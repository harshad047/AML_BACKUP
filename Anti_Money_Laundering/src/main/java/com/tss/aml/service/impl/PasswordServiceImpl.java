package com.tss.aml.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.customer.ForgotPasswordResetRequest;
import com.tss.aml.dto.customer.ForgotPasswordResponse;
import com.tss.aml.dto.customer.ForgotPasswordVerifyResponse;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.IPasswordService;

@Service
public class PasswordServiceImpl implements IPasswordService {

    private static final Logger log = LoggerFactory.getLogger(PasswordServiceImpl.class);

    @Autowired
    private OtpService otpService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public ForgotPasswordResponse sendForgotPasswordOtp(String email) {
        String normalized = email == null ? null : email.trim().toLowerCase();
        log.debug("Send OTP request - original: '{}', normalized: '{}'", email, normalized);
        
        if (normalized == null || normalized.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        
        // Check if user exists
        boolean userExists = userRepository.existsByEmail(normalized);
        
        if (!userExists) {
            log.debug("Email not found in database: {}", normalized);
            return new ForgotPasswordResponse(false, "No account found with this email address.");
        }
        
        // Only send OTP if user exists
        boolean otpSent = otpService.sendOtpToEmail(normalized);
        
        if (otpSent) {
            log.debug("OTP sent to email: {}", normalized);
            return new ForgotPasswordResponse(true, "OTP has been sent to your email.");
        } else {
            log.warn("Failed to send OTP to email: {}", normalized);
            return new ForgotPasswordResponse(false, "Failed to send OTP. Please try again later.");
        }
    }

    @Override
    public ForgotPasswordVerifyResponse verifyForgotPasswordOtp(String email, String otp) {
        String normalized = email == null ? null : email.trim().toLowerCase();
        log.debug("Verify OTP request - original: '{}', normalized: '{}', otp: '{}'", email, normalized, otp);
        
        if (normalized == null || normalized.isBlank() || otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("Email and OTP are required");
        }
        
        boolean otpValid = otpService.verifyOtp(normalized, otp);
        if (!otpValid) {
            otpService.consumeOtp(normalized);
            log.debug("OTP verification failed for email: {}", normalized);
            throw new IllegalArgumentException("Invalid or expired OTP. Please request a new OTP.");
        }
        
        String resetToken = otpService.issueResetToken(normalized);
        log.debug("OTP verification successful for email: {}, token issued", normalized);
        return new ForgotPasswordVerifyResponse(true, resetToken, "OTP verified successfully");
    }

    @Override
    public String resetPassword(ForgotPasswordResetRequest req) {
        if (req == null || req.email == null || req.newPassword == null || req.confirmPassword == null) {
            throw new IllegalArgumentException("Invalid payload");
        }
        
        String email = req.email.trim().toLowerCase();
        log.debug("Reset password request - email: '{}', otp: '{}'", email, req.otp);
        
        if (!req.newPassword.equals(req.confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        
        boolean allowed = false;
        if (req.token != null && !req.token.isBlank()) {
            allowed = otpService.validateResetToken(email, req.token, true);
        } else if (req.otp != null && !req.otp.isBlank()) {
            allowed = otpService.verifyOtp(email, req.otp);
            if (!allowed) {
                otpService.consumeOtp(email);
            }
        }
        
        if (!allowed) {
            log.debug("Reset authorization failed for email: {}", email);
            throw new IllegalArgumentException("Invalid or expired token/OTP. Please verify again.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            throw new RuntimeException("Unable to reset password for the specified email");
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
            fullName = (fn + (ln.isBlank() ? "" : (" " + ln))).trim();
            if (fullName.isBlank()) fullName = null;
        }
        emailService.sendPasswordChangeSuccessEmail(email, fullName);

        otpService.consumeOtp(email);
        log.debug("Password reset successful for email: {}", email);

        return "Password reset successfully";
    }
}
