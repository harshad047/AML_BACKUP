package com.tss.aml.service;

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
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.exception.AmlApiException;
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
	private AuditLogService auditLogService;
	
	@Autowired
	private CustomerRepository customerRepository;

	public AuthResponse login(LoginDto loginDto) {
		Authentication authentication = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword()));

		SecurityContextHolder.getContext().setAuthentication(authentication);

		UserDetails userDetails = (UserDetails) authentication.getPrincipal();
		String role = userDetails.getAuthorities().iterator().next().getAuthority();
		
		// Remove ROLE_ prefix if present
		if (role.startsWith("ROLE_")) {
			role = role.substring(5);
		}
		
		// Note: KYC validation removed - customers can login regardless of KYC status
		// KYC status will be checked on dashboard and for specific banking operations

		Long userId = null;
		if (userDetails instanceof User) {
			userId = ((User) userDetails).getId();
		} else if (userDetails instanceof com.tss.aml.security.CustomerUserDetails) {
            userId = ((com.tss.aml.security.CustomerUserDetails) userDetails).getId();
        }
		
		

		// Generate token with enhanced JWT util including userId and role
		String token;
		String email = loginDto.getEmail();
		if (userId != null) {
			token = jwtUtil.generateToken(userDetails.getUsername(), role, userId , email);
		} else {
			token = jwtUtil.generateToken(userDetails.getUsername(), role);
		}

		// Log the login action asynchronously - doesn't block response
		auditLogService.logLoginAsync(userDetails.getUsername(), "127.0.0.1");
		
		// Send login success email asynchronously - doesn't block response
		sendLoginEmailAsync(userDetails.getUsername());

		return new AuthResponse(token, "Bearer", userDetails.getUsername(), "ROLE_" + role, userId );
	}
	
	/**
	 * Sends login success email asynchronously to avoid blocking the login response
	 * Uses optimized query to fetch only email instead of entire User entity
	 */
	@Async("taskExecutor")
	private void sendLoginEmailAsync(String username) {
		try {
			String userEmail = username;
			// If username is not an email, fetch email from database using optimized query
			if (!userEmail.contains("@")) {
				userEmail = userRepository.findEmailByUsername(userEmail).orElse(userEmail);
			}
			emailService.sendLoginSuccessEmailHtml(userEmail);
		} catch (Exception e) {
			// Log error but don't fail login
			System.err.println("Failed to send login email asynchronously: " + e.getMessage());
		}
	}
}
