package com.tss.aml.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.RegistrationRequest;
import com.tss.aml.entity.Address;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Role;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.DocumentStatus;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.DocumentRepository;
import com.tss.aml.repository.UserRepository;

@Service
public class RegistrationService {

    private final CustomerRepository customerRepo;
    private final DocumentRepository docRepo;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final ReCaptchaService reCaptchaService;
    private final UserRepository userRepo;
    private final AuditLogService auditLogService;

    @Autowired
    public RegistrationService(CustomerRepository customerRepo, DocumentRepository docRepo, 
                             OtpService otpService, PasswordEncoder passwordEncoder, 
                             ReCaptchaService reCaptchaService, UserRepository userRepo,
                             AuditLogService auditLogService) {
        this.customerRepo = customerRepo;
        this.docRepo = docRepo;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
        this.reCaptchaService = reCaptchaService;
        this.userRepo = userRepo;
        this.auditLogService = auditLogService;
    }

    public void initiateEmailOtp(String email) {
        // optionally check uniqueness before sending OTP
        otpService.sendOtpToEmail(email);
    }

    public boolean verifyOtp(String email, String otp) {
        return otpService.verifyOtp(email, otp);
    }

    @Transactional
    public Customer registerCustomer(RegistrationRequest req) {
        // Verify reCaptcha (Temporarily Disabled for Testing)
        /* if (!reCaptchaService.verifyRecaptcha(req.getRecaptchaToken())) {
            throw new IllegalArgumentException("reCaptcha verification failed");
        } */

        // Check uniqueness in Customer and User tables
        if (customerRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // 1️⃣ Create Customer entity
        Customer c = new Customer();
        c.setFirstName(req.getFirstName());
        c.setMiddleName(req.getMiddleName());
        c.setLastName(req.getLastName());
        c.setEmail(req.getEmail());
        c.setPhone(req.getPhone());
        c.setPassword(passwordEncoder.encode(req.getPassword()));
        
        // Auto-generate username as firstname_lastname
        String username = generateUsername(req.getFirstName(), req.getLastName());
        c.setUsername(username);

        Address a = new Address();
        a.setStreet(req.getStreet());
        a.setCity(req.getCity());
        a.setState(req.getState());
        a.setCountry(req.getCountry());
        a.setPostalCode(req.getPostalCode());
        c.setAddress(a);
        c.setKycStatus(KycStatus.PENDING);

        Customer savedCustomer = customerRepo.save(c);

        // 2️⃣ Create corresponding User for Spring Security
        User user = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .username(username) // Use the same generated username
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.CUSTOMER) // assuming you have a CUSTOMER role
                .isEnabled(true)
                .build();

        userRepo.save(user);

        // Log user registration
        auditLogService.logUserAction(username, "USER_REGISTERED", 
            String.format("New customer registered: %s %s (%s)", 
                req.getFirstName(), req.getLastName(), req.getEmail()));

        return savedCustomer;
    }


    public Document saveDocument(Long customerId, String docType, String storagePath) {
        Customer c = customerRepo.findById(customerId).orElseThrow();
        Document d = new Document();
        d.setDocType(docType);
        d.setStoragePath(storagePath);
        d.setCustomer(c);
        d.setStatus(DocumentStatus.UPLOADED);
        d.setUploadedAt(Instant.now());
        c.addDocument(d);
        customerRepo.save(c);
        return d;
    }
    
    /**
     * Generate username as firstname_lastname with uniqueness handling
     */
    private String generateUsername(String firstName, String lastName) {
        String baseUsername = (firstName + "_" + lastName).toLowerCase().replaceAll("[^a-z0-9_]", "");
        String username = baseUsername;
        int counter = 1;
        
        // Check for uniqueness in both Customer and User tables
        while (customerRepo.existsByUsername(username) || userRepo.existsByUsername(username)) {
            username = baseUsername + "_" + counter;
            counter++;
        }
        
        return username;
    }
}
