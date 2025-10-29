package com.tss.aml.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.customer.CustomerProfileDTO;
import com.tss.aml.entity.Address;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.EmailService;
import com.tss.aml.service.OtpService;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @GetMapping("/profile")
    public ResponseEntity<CustomerProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Map Customer entity to DTO to avoid circular references and deep nesting
        CustomerProfileDTO profileDTO = new CustomerProfileDTO();
        profileDTO.setId(customer.getId());
        profileDTO.setFirstName(customer.getFirstName());
        profileDTO.setMiddleName(customer.getMiddleName());
        profileDTO.setLastName(customer.getLastName());
        profileDTO.setEmail(customer.getEmail());
        profileDTO.setUsername(customer.getUsername());
        profileDTO.setPhone(customer.getPhone());
        profileDTO.setAddress(customer.getAddress());
        profileDTO.setKycStatus(customer.getKycStatus());
        profileDTO.setCreatedAt(customer.getCreatedAt().toString());

        return ResponseEntity.ok(profileDTO);
    }

    @GetMapping("/kyc-status")
    public ResponseEntity<KycStatusResponse> getKycStatus(Authentication authentication) {
        String username = authentication.getName();

        // Use a custom query to get only the KYC status without loading the full entity
        KycStatus kycStatus = customerRepository.findKycStatusByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        KycStatusResponse response = new KycStatusResponse(
            kycStatus.name(),
            "Your KYC status is: " + kycStatus
        );
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<CustomerProfileDTO> updateProfile(@RequestBody ProfileUpdateRequest req, Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (req.firstName != null) customer.setFirstName(req.firstName);
        if (req.middleName != null) customer.setMiddleName(req.middleName);
        if (req.lastName != null) customer.setLastName(req.lastName);
        if (req.phone != null) customer.setPhone(req.phone);
        // Address fields if provided
        if (req.address != null) {
            Address addr = customer.getAddress();
            if (addr == null) {
                addr = new Address();
                customer.setAddress(addr);
            }
        
            
            if (req.address.street != null) addr.setStreet(req.address.street);
            if (req.address.city != null) addr.setCity(req.address.city);
            if (req.address.state != null) addr.setState(req.address.state);
            if (req.address.postalCode != null) addr.setPostalCode(req.address.postalCode);
            if (req.address.country != null) addr.setCountry(req.address.country);
        }

        Customer saved = customerRepository.save(customer);

        // Map to DTO to avoid serialization issues
        CustomerProfileDTO profileDTO = new CustomerProfileDTO();
        profileDTO.setId(saved.getId());
        profileDTO.setFirstName(saved.getFirstName());
        profileDTO.setMiddleName(saved.getMiddleName());
        profileDTO.setLastName(saved.getLastName());
        profileDTO.setEmail(saved.getEmail());
        profileDTO.setUsername(saved.getUsername());
        profileDTO.setPhone(saved.getPhone());
        profileDTO.setAddress(saved.getAddress());
        profileDTO.setKycStatus(saved.getKycStatus());
        profileDTO.setCreatedAt(saved.getCreatedAt().toString());

        return ResponseEntity.ok(profileDTO);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req, Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (req == null || req.oldPassword == null || req.newPassword == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid payload"));
        }

        // Verify either reset token (preferred) or OTP
        boolean allowed = false;
        if (req.token != null && !req.token.isBlank()) {
            allowed = otpService.validateResetToken(user.getEmail(), req.token, true);
        } else if (req.otp != null && !req.otp.isBlank()) {
            allowed = otpService.verifyOtp(user.getEmail(), req.otp);
            if (!allowed) {
                otpService.consumeOtp(user.getEmail());
            }
        }
        if (!allowed) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired verification. Please verify OTP again."));
        }

        if (!passwordEncoder.matches(req.oldPassword, customer.getPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Current password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(req.newPassword));
        userRepository.save(user);
        customer.setPassword(passwordEncoder.encode(req.newPassword));
        customerRepository.save(customer);
        // Send confirmation email
        String fullName = (customer.getFirstName() != null ? customer.getFirstName() : "")
                + (customer.getLastName() != null ? (" " + customer.getLastName()) : "");
        emailService.sendPasswordChangeSuccessEmail(user.getEmail(), fullName.trim().isEmpty() ? null : fullName.trim());
        return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully"));
    }

    /**
     * Send OTP to user's registered email for password change verification
     */
    @PostMapping("/change-password/send-otp")
    public ResponseEntity<?> sendChangePasswordOtp(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        otpService.sendOtpToEmail(user.getEmail());
        return ResponseEntity.ok(java.util.Map.of("sent", true, "message", "OTP sent to registered email."));
    }

    // Simple DTOs for requests
    public static class ProfileUpdateRequest {
        public String firstName;
        public String middleName;
        public String lastName;
        public String phone;
        public AddressDto address;
    }

    public static class AddressDto {
        public String street;
        public String city;
        public String state;
        public String postalCode;
        public String country;
    }

    public static class ChangePasswordRequest {
        @NotBlank
        public String oldPassword;
        @NotBlank
        public String newPassword;
        public String otp; 
        public String token; 
    }
    
    public static class KycStatusResponse {
        public final String kycStatus;
        public final String message;
        
        public KycStatusResponse(String kycStatus, String message) {
            this.kycStatus = kycStatus;
            this.message = message;
        }
    }
}
