package com.tss.aml.service;

import com.tss.aml.dto.customer.ForgotPasswordResetRequest;
import com.tss.aml.dto.customer.ForgotPasswordResponse;
import com.tss.aml.dto.customer.ForgotPasswordVerifyResponse;

public interface IPasswordService {
    
    ForgotPasswordResponse sendForgotPasswordOtp(String email);
    
    ForgotPasswordVerifyResponse verifyForgotPasswordOtp(String email, String otp);
    
    String resetPassword(ForgotPasswordResetRequest request);
    
   
}
