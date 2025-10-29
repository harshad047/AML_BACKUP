package com.tss.aml.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.EmailService;
import com.tss.aml.service.OtpService;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
public class PasswordController {

    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    /**
     * Initiate forgot password by sending an OTP to the provided email.
     * Always returns success to avoid email enumeration.
     */
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendForgotPasswordOtp(@RequestParam("email") String email) {
        String normalized = email == null ? null : email.trim();
        if (normalized == null || normalized.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is required"));
        }
        // If user exists, send OTP. If not, still return success to avoid enumeration.
        userRepository.findByEmail(normalized).ifPresent(u -> otpService.sendOtpToEmail(normalized));
        return ResponseEntity.ok(java.util.Map.of("sent", true, "message", "If the email exists, an OTP has been sent."));
    }

    /**
     * Verify OTP for forgot password flow.
     * Does NOT consume the OTP - it will be consumed during password reset.
     */
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyForgotPasswordOtp(@RequestParam("email") String email, @RequestParam("otp") String otp) {
        String normalized = email == null ? null : email.trim();
        if (normalized == null || normalized.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email and OTP are required"));
        }
        
        // Verify WITHOUT consuming the OTP (false parameter)
        boolean otpValid = otpService.verifyOtp(normalized, otp, false);
        if (!otpValid) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP. Please request a new OTP."));
        }
        
        return ResponseEntity.ok(java.util.Map.of("verified", true, "message", "OTP verified successfully"));
    }

    /**
     * Reset password using email + OTP. Requires newPassword and confirmPassword to match.
     */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ForgotPasswordResetRequest req) {
        if (req == null || req.email == null || req.otp == null || req.newPassword == null || req.confirmPassword == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid payload"));
        }
        String email = req.email.trim();
        if (!req.newPassword.equals(req.confirmPassword)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Passwords do not match"));
        }
        boolean otpValid = otpService.verifyOtp(email, req.otp);
        if (!otpValid) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP. Please request a new OTP."));
        }

        User user = userRepository.findByEmail(email)
            .orElse(null);
        if (user == null) {
            // To avoid enumeration, return generic error though OTP passed for this email
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Unable to reset password for the specified email"));
        }

        String encoded = passwordEncoder.encode(req.newPassword);
        user.setPassword(encoded);
        userRepository.save(user);
        // Update customer password if customer exists with same email
        customerRepository.findByEmail(email).ifPresent(c -> {
            c.setPassword(encoded);
            customerRepository.save(c);
        });

        String fullName = null;
        Customer customer = customerRepository.findByEmail(email).orElse(null);
        if (customer != null) {
            String fn = customer.getFirstName() != null ? customer.getFirstName() : "";
            String ln = customer.getLastName() != null ? customer.getLastName() : "";
            fullName = (fn + (ln.isBlank()? "" : (" " + ln))).trim();
            if (fullName.isBlank()) fullName = null;
        }
        emailService.sendPasswordChangeSuccessEmail(email, fullName);

        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully"));
    }

    public static class ForgotPasswordResetRequest {
        @NotBlank public String email;
        @NotBlank public String otp;
        @NotBlank public String newPassword;
        @NotBlank public String confirmPassword;
    }
}
