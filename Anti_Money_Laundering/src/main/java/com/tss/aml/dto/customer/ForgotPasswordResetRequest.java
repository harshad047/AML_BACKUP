package com.tss.aml.dto.customer;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordResetRequest {
        @NotBlank public String email;
        public String otp; // legacy support
        public String token; // preferred two-step flow
        @NotBlank public String newPassword;
        @NotBlank public String confirmPassword;
    }