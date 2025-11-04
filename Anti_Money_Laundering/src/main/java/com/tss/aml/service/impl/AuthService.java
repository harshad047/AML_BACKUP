package com.tss.aml.service.impl;

import java.util.concurrent.CompletableFuture;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.Auth.AuthResponse;
import com.tss.aml.dto.Auth.LoginDto;
import com.tss.aml.entity.User;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.security.JwtTokenProvider;
import com.tss.aml.util.JwtUtil;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditLogServiceImpl auditLogService;

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * Handles user login with improved performance.
     * Returns JWT immediately; async tasks (audit + email) run in background.
     */
    public AuthResponse login(LoginDto loginDto) {
        // 1️⃣ Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // 2️⃣ Extract and normalize role
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        // 3️⃣ Get user ID (works for both User & CustomerUserDetails)
        Long userId = extractUserId(userDetails);

        // 4️⃣ Generate JWT (non-blocking)
        String email = loginDto.getEmail();
        String token = (userId != null)
                ? jwtUtil.generateToken(userDetails.getUsername(), role, userId, email)
                : jwtUtil.generateToken(userDetails.getUsername(), role);

        // 5️⃣ Build fast response
        AuthResponse response = new AuthResponse(
                token, "Bearer", userDetails.getUsername(), "ROLE_" + role, userId
        );

        // 6️⃣ Fire async background tasks after response is ready
        CompletableFuture.runAsync(() -> {
            auditLogService.logLoginAsync(userDetails.getUsername(), "127.0.0.1");
            sendLoginEmailAsync(userDetails.getUsername());
        });

        return response;
    }

    /**
     * Extracts user ID safely for both application users and customers.
     */
    private Long extractUserId(UserDetails userDetails) {
        if (userDetails instanceof User) {
            return ((User) userDetails).getId();
        } else if (userDetails instanceof com.tss.aml.security.CustomerUserDetails) {
            return ((com.tss.aml.security.CustomerUserDetails) userDetails).getId();
        }
        return null;
    }

    /**
     * Sends login success email asynchronously — doesn’t block login flow.
     */
    @Async("taskExecutor")
    protected void sendLoginEmailAsync(String username) {
        try {
            String userEmail = username;
            // If username isn't an email, fetch only the email field
            if (!userEmail.contains("@")) {
                userEmail = userRepository.findEmailByUsername(userEmail).orElse(userEmail);
            }
            emailService.sendLoginSuccessEmailHtml(userEmail);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send login email asynchronously: " + e.getMessage());
        }
    }
}
