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

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Address;
import com.tss.aml.repository.CustomerRepository;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<Customer> getProfile(Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        return ResponseEntity.ok(customer);
    }

    @GetMapping("/kyc-status")
    public ResponseEntity<?> getKycStatus(Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        KycStatusResponse response = new KycStatusResponse(
            customer.getKycStatus().name(),
            "Your KYC status is: " + customer.getKycStatus()
        );
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<Customer> updateProfile(@RequestBody ProfileUpdateRequest req, Authentication authentication) {
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
        
            if (req.address.city != null) addr.setCity(req.address.city);
            if (req.address.state != null) addr.setState(req.address.state);
            if (req.address.postalCode != null) addr.setPostalCode(req.address.postalCode);
            if (req.address.country != null) addr.setCountry(req.address.country);
        }

        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req, Authentication authentication) {
        String username = authentication.getName();
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (req == null || req.oldPassword == null || req.newPassword == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid payload"));
        }

        if (!passwordEncoder.matches(req.oldPassword, customer.getPassword())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Current password is incorrect"));
        }

        customer.setPassword(passwordEncoder.encode(req.newPassword));
        customerRepository.save(customer);
        return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully"));
    }
    
    
    
    public static class KycStatusResponse {
        public final String kycStatus;
        public final String message;
        
        public KycStatusResponse(String kycStatus, String message) {
            this.kycStatus = kycStatus;
            this.message = message;
        }
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
        public String line1;
        public String line2;
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
    }
}
