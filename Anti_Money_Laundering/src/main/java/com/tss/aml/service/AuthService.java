package com.tss.aml.service;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.AuthResponse;
import com.tss.aml.dto.LoginDto;
import com.tss.aml.entity.User;
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
	private AuditLogService auditLogService;

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

		Long userId = null;
		if (userDetails instanceof User) {
			userId = ((User) userDetails).getId();
		} else if (userDetails instanceof com.tss.aml.security.CustomerUserDetails) {
            userId = ((com.tss.aml.security.CustomerUserDetails) userDetails).getId();
        }

		// Generate token with enhanced JWT util including userId and role
		String token;
		if (userId != null) {
			token = jwtUtil.generateToken(userDetails.getUsername(), role, userId);
		} else {
			token = jwtUtil.generateToken(userDetails.getUsername(), role);
		}

		// Log the login action
		auditLogService.logLogin(userDetails.getUsername(), "127.0.0.1"); // You can get real IP from request
		
		// Send login success email
		try {
			// Get user email - assuming username is email or we need to fetch user
			String userEmail = userDetails.getUsername();
			if (!userEmail.contains("@")) {
				// If username is not email, fetch user to get email
				User user = userRepository.findByUsername(userEmail).orElse(null);
				if (user != null) {
					userEmail = user.getEmail();
				}
			}
			emailService.sendLoginSuccessEmailHtml(userEmail);
		} catch (Exception e) {
			// Log error but don't fail login
			System.err.println("Failed to send login email: " + e.getMessage());
		}

		return new AuthResponse(token, "Bearer", userDetails.getUsername(), "ROLE_" + role, userId);
	}
}
