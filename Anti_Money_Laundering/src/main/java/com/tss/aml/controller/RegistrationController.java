package com.tss.aml.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.dto.Auth.RegistrationRequest;
import com.tss.aml.dto.CountryDto;
import com.tss.aml.entity.CountryRisk;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.repository.CountryRiskRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.service.impl.CloudinaryService;
import com.tss.aml.service.impl.EmailService;
import com.tss.aml.service.impl.RegistrationServiceImpl;
import com.tss.aml.util.JwtUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/register")
@CrossOrigin(origins = "*") // Allow requests from all origins
public class RegistrationController {

    @Autowired private RegistrationServiceImpl regService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private EmailService emailService;
    @Autowired private CloudinaryService cloudinaryService;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private CountryRiskRepository countryRiskRepository;

    // 1. send OTP
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        regService.initiateEmailOtp(email);
        return ResponseEntity.ok(Map.of("sent", true));
    }
    
    @PostMapping("/check-status")
    public ResponseEntity<?> checkRegistrationStatus(@RequestParam String email) {
        boolean hasPending = regService.hasPendingRegistration(email);
        boolean existsInDb = customerRepository.existsByEmail(email);
        
        if (existsInDb) {
            return ResponseEntity.ok(Map.of(
                "status", "COMPLETED",
                "message", "Registration already completed"
            ));
        } else if (hasPending) {
            return ResponseEntity.ok(Map.of(
                "status", "PENDING_VERIFICATION",
                "message", "Registration pending email verification"
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                "status", "NOT_FOUND",
                "message", "No registration found for this email"
            ));
        }
    }

  

    // Get active countries for registration dropdown
    @GetMapping("/countries")
    public ResponseEntity<List<CountryDto>> getActiveCountries() {
        List<CountryRisk> countries = countryRiskRepository.findAllByOrderByRiskScoreDesc();
        
        // Filter only active countries and map to response format
        List<CountryDto> activeCountries = countries.stream()
            .map(country -> new CountryDto(country.getCountryCode(), country.getCountryName()))
            .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(activeCountries);
    }

    // 2. verify OTP and complete registration
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        boolean otpValid = regService.verifyOtp(email, otp);
        if (otpValid) { 
            try {
                // Complete registration after successful OTP verification
                Customer customer = regService.completeRegistrationAfterVerification(email);
                
                // Send registration success email
                emailService.sendRegistrationSuccessEmail(email);
                
                return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "customerId", customer.getId(),
                    "email", customer.getEmail(),
                    "name", customer.getFirstName() + " " + customer.getLastName(),
                    "message", "Registration completed successfully!"
                ));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "verified", false,
                    "error", e.getMessage()
                ));
            }
        }
        else return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("verified", false));
    }

    @PostMapping
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest req, BindingResult br) {
        if (br.hasErrors()) {
            return ResponseEntity.badRequest().body(br.getAllErrors());
        }
        
        try {
            // Store registration data temporarily (NOT in database yet)
            regService.storePendingRegistration(req);
            
            // Send OTP for email verification
            regService.initiateEmailOtp(req.getEmail());

            return ResponseEntity.ok(Map.of(
                "email", req.getEmail(),
                "name", req.getFirstName() + " " + req.getLastName(),
                "message", "Registration data received. Please verify your email to complete registration.",
                "nextStep", "Please check your email and verify OTP to complete registration."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping(path="/{customerId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocuments(
            @PathVariable Long customerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType) {

        try {
            String folder = "customer_" + customerId;
            String cloudUrl = cloudinaryService.uploadFile(file, folder);

            Document d = regService.saveDocument(customerId, docType, cloudUrl);

            // Null-safe response
            Long docId = (d != null && d.getId() != null) ? d.getId() : -1L;

            return ResponseEntity.ok(Map.of(
                    "documentId", docId,
                    "url", cloudUrl
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getClass().getSimpleName(),
                    "message", e.getMessage()
            ));
        }
    }

}
