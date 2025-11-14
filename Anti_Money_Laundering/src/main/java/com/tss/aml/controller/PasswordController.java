package com.tss.aml.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.customer.ForgotPasswordResetRequest;
import com.tss.aml.dto.customer.ForgotPasswordResponse;
import com.tss.aml.dto.customer.ForgotPasswordVerifyResponse;
import com.tss.aml.service.IPasswordService;

@RestController
@RequestMapping("/api/auth")
public class PasswordController {

    @Autowired
    private IPasswordService passwordService;
   
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendForgotPasswordOtp(@RequestParam("email") String email) {
        try {
            ForgotPasswordResponse response = passwordService.sendForgotPasswordOtp(email);
            return ResponseEntity.ok(java.util.Map.of(
                "sent", response.sent,
                "message", response.message
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyForgotPasswordOtp(@RequestParam("email") String email, @RequestParam("otp") String otp) {
        try {
            ForgotPasswordVerifyResponse response = passwordService.verifyForgotPasswordOtp(email, otp);
            return ResponseEntity.ok(java.util.Map.of(
                "verified", response.verified,
                "resetToken", response.resetToken,
                "message", response.message
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

  
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody ForgotPasswordResetRequest req) {
        try {
            String message = passwordService.resetPassword(req);
            return ResponseEntity.ok(java.util.Map.of("message", message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    
}