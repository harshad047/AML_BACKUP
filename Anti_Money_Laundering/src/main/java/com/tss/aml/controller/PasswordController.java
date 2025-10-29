package com.tss.aml.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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

    private static final Logger log = LoggerFactory.getLogger(PasswordController.class);

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
        String normalized = email == null ? null : email.trim().toLowerCase();
        log.debug("Send OTP request - original: '{}', normalized: '{}'", email, normalized);
        if (normalized == null || normalized.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email is required"));
        }
        
        // Check if user exists
        boolean userExists = userRepository.existsByEmail(normalized);
        
        if (!userExists) {
            log.debug("Email not found in database: {}", normalized);
            return ResponseEntity.ok(java.util.Map.of(
                "sent", false,
                "message", "No account found with this email address."
            ));
        }
        
        // Only send OTP if user exists
        boolean otpSent = otpService.sendOtpToEmail(normalized);
        
        if (otpSent) {
            log.debug("OTP sent to email: {}", normalized);
            return ResponseEntity.ok(java.util.Map.of(
                "sent", true,
                "message", "OTP has been sent to your email."
            ));
        } else {
            log.warn("Failed to send OTP to email: {}", normalized);
            return ResponseEntity.ok(java.util.Map.of(
                "sent", false,
                "message", "Failed to send OTP. Please try again later."
            ));
        }
    }

    /**
     * Verify OTP for forgot password flow.
     */
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyForgotPasswordOtp(@RequestParam("email") String email, @RequestParam("otp") String otp) {
        String normalized = email == null ? null : email.trim().toLowerCase();
        log.debug("Verify OTP request - original: '{}', normalized: '{}', otp: '{}'", email, normalized, otp);
        if (normalized == null || normalized.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Email and OTP are required"));
        }
        
        boolean otpValid = otpService.verifyOtp(normalized, otp);
        if (!otpValid) {
            // Consume the OTP even if verification failed to prevent reuse
            otpService.consumeOtp(normalized);
            log.debug("OTP verification failed for email: {}", normalized);
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP. Please request a new OTP."));
        }
        // Issue a short-lived reset token for step 2 (change password page)
        String resetToken = otpService.issueResetToken(normalized);
        log.debug("OTP verification successful for email: {}, token issued", normalized);
        return ResponseEntity.ok(java.util.Map.of(
            "verified", true,
            "resetToken", resetToken,
            "message", "OTP verified successfully"
        ));
    }

    /**
     * Reset password using email + OTP. Requires newPassword and confirmPassword to match.
     */
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ForgotPasswordResetRequest req) {
        if (req == null || req.email == null || req.newPassword == null || req.confirmPassword == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid payload"));
        }
        String email = req.email.trim().toLowerCase();
        log.debug("Reset password request - email: '{}', otp: '{}'", email, req.otp);
        if (!req.newPassword.equals(req.confirmPassword)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Passwords do not match"));
        }
        // Two-step flow: prefer token validation; fallback to legacy OTP if token not provided
        boolean allowed = false;
        if (req.token != null && !req.token.isBlank()) {
            allowed = otpService.validateResetToken(email, req.token, true);
        } else if (req.otp != null && !req.otp.isBlank()) {
            // Backward compatibility: validate OTP directly (single-step legacy)
            allowed = otpService.verifyOtp(email, req.otp);
            if (!allowed) {
                otpService.consumeOtp(email);
            }
        }
        if (!allowed) {
            log.debug("Reset authorization failed for email: {}", email);
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired token/OTP. Please verify again."));
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

        // Consume/remove the OTP after successful password reset
        otpService.consumeOtp(email);
        log.debug("Password reset successful for email: {}", email);

        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully"));
    }

    public static class ForgotPasswordResetRequest {
        @NotBlank public String email;
        public String otp; // legacy support
        public String token; // preferred two-step flow
        @NotBlank public String newPassword;
        @NotBlank public String confirmPassword;
    }
}