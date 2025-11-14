package com.tss.aml.service;

import java.util.Optional;

import com.tss.aml.dto.customer.ChangePasswordRequest;
import com.tss.aml.dto.customer.CustomerProfileDTO;
import com.tss.aml.dto.customer.KycStatusResponse;
import com.tss.aml.dto.customer.ProfileUpdateRequest;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Enums.KycStatus;

public interface ICustomerService {
    
    // Customer profile operations
    CustomerProfileDTO getCustomerProfile(String username);
    KycStatusResponse getKycStatus(String username);
    CustomerProfileDTO updateCustomerProfile(ProfileUpdateRequest request, String username);
    
    // Customer entity operations
    Optional<Customer> findByUsername(String username);
    Optional<Customer> findByEmail(String email);
    boolean existsByEmail(String email);
    Customer saveCustomer(Customer customer);
    
    // Password operations
    boolean changePassword(ChangePasswordRequest request, String username);
    boolean resetPassword(String email, String newPassword, String confirmPassword, String token, String otp);
    void sendChangePasswordOtp(String username);
    
    // Utility methods
    Optional<KycStatus> findKycStatusByUsername(String username);
}
