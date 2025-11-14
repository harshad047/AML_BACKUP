package com.tss.aml.dto.customer;
public class ForgotPasswordResponse {
        public boolean sent;
        public String message;
        
        public ForgotPasswordResponse(boolean sent, String message) {
            this.sent = sent;
            this.message = message;
        }
    }