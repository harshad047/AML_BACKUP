package com.tss.aml.service.impl;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.customer.ChangePasswordRequest;
import com.tss.aml.dto.customer.CustomerProfileDTO;
import com.tss.aml.dto.customer.KycStatusResponse;
import com.tss.aml.dto.customer.ProfileUpdateRequest;
import com.tss.aml.entity.Address;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.CountryRiskRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.ICustomerService;

@Service
public class CustomerServiceImpl implements ICustomerService {

    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CountryRiskRepository countryRiskRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private OtpService otpService;
    
    @Autowired
    private EmailService emailService;

    @Override
    public CustomerProfileDTO getCustomerProfile(String username) {
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

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

        return profileDTO;
    }

    @Override
    public KycStatusResponse getKycStatus(String username) {
        KycStatus kycStatus = customerRepository.findKycStatusByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        return new KycStatusResponse(
            kycStatus.name(),
            "Your KYC status is: " + kycStatus
        );
    }

    @Override
    public CustomerProfileDTO updateCustomerProfile(ProfileUpdateRequest req, String username) {
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (req.firstName != null) customer.setFirstName(req.firstName);
        if (req.middleName != null) customer.setMiddleName(req.middleName);
        if (req.lastName != null) customer.setLastName(req.lastName);
        
        // Validate phone number uniqueness before updating
        if (req.phone != null) {
            // Check if the new phone number is different from current phone number
            if (!req.phone.equals(customer.getPhone())) {
                // Check if phone number already exists for another customer
                if (customerRepository.existsByPhone(req.phone)) {
                    throw new IllegalArgumentException("Phone number already exists");
                }
            }
            customer.setPhone(req.phone);
        }
        
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
            
            // Validate country exists in database before updating
            if (req.address.country != null) {
                // Check if country exists in the CountryRisk table (by country name or code)
                boolean countryExists = countryRiskRepository.findByCountryNameIgnoreCase(req.address.country).isPresent() ||
                                      countryRiskRepository.existsByCountryCode(req.address.country);
                
                if (!countryExists) {
                    throw new IllegalArgumentException("Invalid country: " + req.address.country + ". Country not found in database.");
                }
                addr.setCountry(req.address.country);
            }
        }

        Customer saved = customerRepository.save(customer);

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

        return profileDTO;
    }

    @Override
    public Optional<Customer> findByUsername(String username) {
        return customerRepository.findByUsername(username);
    }

    @Override
    public Optional<Customer> findByEmail(String email) {
        return customerRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return customerRepository.existsByEmail(email);
    }

    @Override
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Override
    public boolean changePassword(ChangePasswordRequest req, String username) {
        Customer customer = customerRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (req == null || req.oldPassword == null || req.newPassword == null) {
            throw new IllegalArgumentException("Invalid payload");
        }

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
            throw new IllegalArgumentException("Invalid or expired verification. Please verify OTP again.");
        }

        // Frontend now sends hashed passwords
        // req.oldPassword and req.newPassword are already hashed by the frontend
        String clientHashedOldPassword = req.oldPassword;
        String clientHashedNewPassword = req.newPassword;
        
        // For old password verification, we need to check against the stored password
        // Since the stored password might be double-hashed (client hash + server hash),
        // we need to handle both cases
        
        boolean oldPasswordValid = false;
        try {
            // Try to match the client-hashed old password against stored password
            oldPasswordValid = passwordEncoder.matches(clientHashedOldPassword, customer.getPassword());
        } catch (Exception e) {
            // If that fails, the stored password might be in old format
            // This is part of the migration strategy
            oldPasswordValid = false;
        }
        
        if (!oldPasswordValid) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Store the new client-hashed password (double-hashed for extra security)
        String encodedNewPassword = passwordEncoder.encode(clientHashedNewPassword);
        user.setPassword(encodedNewPassword);
        userRepository.save(user);
        customer.setPassword(encodedNewPassword);
        customerRepository.save(customer);
        
        String fullName = (customer.getFirstName() != null ? customer.getFirstName() : "")
                + (customer.getLastName() != null ? (" " + customer.getLastName()) : "");
        emailService.sendPasswordChangeSuccessEmail(user.getEmail(), fullName.trim().isEmpty() ? null : fullName.trim());
        
        return true;
    }

    @Override
    public boolean resetPassword(String email, String newPassword, String confirmPassword, String token, String otp) {
        String normalizedEmail = email.trim().toLowerCase();
        
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        
        boolean allowed = false;
        if (token != null && !token.isBlank()) {
            allowed = otpService.validateResetToken(normalizedEmail, token, true);
        } else if (otp != null && !otp.isBlank()) {
            allowed = otpService.verifyOtp(normalizedEmail, otp);
            if (!allowed) {
                otpService.consumeOtp(normalizedEmail);
            }
        }
        
        if (!allowed) {
            throw new IllegalArgumentException("Invalid or expired token/OTP. Please verify again.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new RuntimeException("Unable to reset password for the specified email"));

        String encoded = passwordEncoder.encode(newPassword);
        user.setPassword(encoded);
        userRepository.save(user);
        
        customerRepository.findByEmail(normalizedEmail).ifPresent(c -> {
            c.setPassword(encoded);
            customerRepository.save(c);
        });

        String fullName = null;
        Customer customer = customerRepository.findByEmail(normalizedEmail).orElse(null);
        if (customer != null) {
            String fn = customer.getFirstName() != null ? customer.getFirstName() : "";
            String ln = customer.getLastName() != null ? customer.getLastName() : "";
            fullName = (fn + (ln.isBlank() ? "" : (" " + ln))).trim();
            if (fullName.isBlank()) fullName = null;
        }
        emailService.sendPasswordChangeSuccessEmail(normalizedEmail, fullName);

        otpService.consumeOtp(normalizedEmail);
        return true;
    }

    @Override
    public void sendChangePasswordOtp(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        otpService.sendOtpToEmail(user.getEmail());
    }

    @Override
    public Optional<KycStatus> findKycStatusByUsername(String username) {
        return customerRepository.findKycStatusByUsername(username);
    }
}
