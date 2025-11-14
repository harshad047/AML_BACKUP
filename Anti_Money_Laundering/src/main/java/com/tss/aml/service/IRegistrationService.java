package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.Auth.RegistrationRequest;
import com.tss.aml.dto.CountryDto;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;

public interface IRegistrationService {
	
	void initiateEmailOtp(String email);
    boolean verifyOtp(String email, String otp);
    void storePendingRegistration(RegistrationRequest req);
    Customer completeRegistrationAfterVerification(String email);
    Customer registerCustomer(RegistrationRequest req);
    Document saveDocument(Long customerId, String docType, String storagePath);
    boolean hasPendingRegistration(String email);
    int getPendingRegistrationCount();
    List<CountryDto> getActiveCountries();
}
