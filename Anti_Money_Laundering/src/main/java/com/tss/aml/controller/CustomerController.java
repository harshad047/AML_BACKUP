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

import com.tss.aml.dto.customer.ChangePasswordRequest;
import com.tss.aml.dto.customer.CustomerProfileDTO;
import com.tss.aml.dto.customer.KycStatusResponse;
import com.tss.aml.dto.customer.ProfileUpdateRequest;
import com.tss.aml.entity.Address;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.service.ICustomerService;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
public class CustomerController {

    @Autowired
    private ICustomerService customerService;

    @GetMapping("/profile")
    public ResponseEntity<CustomerProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        CustomerProfileDTO profileDTO = customerService.getCustomerProfile(username);
        return ResponseEntity.ok(profileDTO);
    }

    @GetMapping("/kyc-status")
    public ResponseEntity<KycStatusResponse> getKycStatus(Authentication authentication) {
        String username = authentication.getName();
        KycStatusResponse response = customerService.getKycStatus(username);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<CustomerProfileDTO> updateProfile(@RequestBody ProfileUpdateRequest req, Authentication authentication) {
        String username = authentication.getName();
        CustomerProfileDTO profileDTO = customerService.updateCustomerProfile(req, username);
        return ResponseEntity.ok(profileDTO);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req, Authentication authentication) {
        String username = authentication.getName();
        try {
            customerService.changePassword(req, username);
            return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

   
    @PostMapping("/change-password/send-otp")
    public ResponseEntity<?> sendChangePasswordOtp(Authentication authentication) {
        String username = authentication.getName();
        customerService.sendChangePasswordOtp(username);
        return ResponseEntity.ok(java.util.Map.of("sent", true, "message", "OTP sent to registered email."));
    }    
}
