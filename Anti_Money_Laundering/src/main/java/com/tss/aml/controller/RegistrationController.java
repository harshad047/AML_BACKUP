package com.tss.aml.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.dto.RegistrationRequest;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.service.CloudinaryService;
import com.tss.aml.service.EmailService;
import com.tss.aml.service.RegistrationService;
import com.tss.aml.util.JwtUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/register")
@CrossOrigin(origins = "*") // Allow requests from all origins
public class RegistrationController {

    @Autowired private RegistrationService regService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private EmailService emailService;
    @Autowired private CloudinaryService cloudinaryService;

    // 1. send OTP
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        regService.initiateEmailOtp(email);
        return ResponseEntity.ok(Map.of("sent", true));
    }

  

    // 2. verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        boolean ok = regService.verifyOtp(email, otp);
        if (ok) { 
        	// 3. SEND THE REGISTRATION SUCCESS EMAIL
            emailService.sendRegistrationSuccessEmail(email);
        	return ResponseEntity.ok(Map.of("verified", true));
        }
        else return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("verified", false));
    }

    @PostMapping
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest req, BindingResult br) {
        if (br.hasErrors()) {
            return ResponseEntity.badRequest().body(br.getAllErrors());
        }
        
        try {
            // This creates the customer in the database
            Customer created = regService.registerCustomer(req);
            regService.initiateEmailOtp(created.getEmail());

            

            return ResponseEntity.ok(Map.of(
                "customerId", created.getId(),
                "email", created.getEmail(),
                "name", created.getFirstName() + " " + created.getLastName(),
                "message", "Registration successful. Please check your email."
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
