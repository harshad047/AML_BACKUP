package com.tss.aml.dto.customer;

import jakarta.validation.constraints.NotBlank;

public class ChangePasswordRequest {
        @NotBlank
        public String oldPassword;
        @NotBlank
        public String newPassword;
        public String otp; 
        public String token; 
    }
    