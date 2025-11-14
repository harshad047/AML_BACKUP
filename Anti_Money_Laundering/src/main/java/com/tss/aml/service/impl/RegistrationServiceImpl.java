package com.tss.aml.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.Auth.RegistrationRequest;
import com.tss.aml.dto.CountryDto;
import com.tss.aml.entity.Address;
import com.tss.aml.entity.CountryRisk;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.DocumentStatus;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.entity.Enums.Role;
import com.tss.aml.repository.CountryRiskRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.DocumentRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.IRegistrationService;

@Service
public class RegistrationServiceImpl implements IRegistrationService {

	private final Map<String, RegistrationRequest> pendingRegistrations = new ConcurrentHashMap<>();

	private final CustomerRepository customerRepo;
	private final DocumentRepository docRepo;
	private final CountryRiskRepository countryRiskRepo;
	private final OtpService otpService;
	private final PasswordEncoder passwordEncoder;
	private final ReCaptchaService reCaptchaService;
	private final UserRepository userRepo;
	private final AuditLogServiceImpl auditLogService;

	@Autowired
	public RegistrationServiceImpl(CustomerRepository customerRepo, DocumentRepository docRepo, CountryRiskRepository countryRiskRepo,
			OtpService otpService, PasswordEncoder passwordEncoder, ReCaptchaService reCaptchaService, UserRepository userRepo,
			AuditLogServiceImpl auditLogService) {
		this.customerRepo = customerRepo;
		this.docRepo = docRepo;
		this.countryRiskRepo = countryRiskRepo;
		this.otpService = otpService;
		this.passwordEncoder = passwordEncoder;
		this.reCaptchaService = reCaptchaService;
		this.userRepo = userRepo;
		this.auditLogService = auditLogService;
	}

	public void initiateEmailOtp(String email) {
		otpService.sendOtpToEmail(email);
	}

	public boolean verifyOtp(String email, String otp) {
		return otpService.verifyOtp(email, otp);
	}

	public void storePendingRegistration(RegistrationRequest req) {

		if (customerRepo.existsByEmail(req.getEmail())) {
			throw new IllegalArgumentException("Email already exists");
		}

		if (customerRepo.existsByPhone(req.getPhone())) {
			throw new IllegalArgumentException("Phone number already exists");
		}

		pendingRegistrations.put(req.getEmail(), req);
	}

	@Transactional
	public Customer completeRegistrationAfterVerification(String email) {
		RegistrationRequest req = pendingRegistrations.get(email);
		if (req == null) {
			throw new IllegalArgumentException("No pending registration found for email: " + email);
		}

		try {
			Customer savedCustomer = registerCustomer(req);

			pendingRegistrations.remove(email);

			return savedCustomer;
		} catch (Exception e) {
			throw e;
		}
	}

	@Transactional
	public Customer registerCustomer(RegistrationRequest req) {

		if (customerRepo.existsByEmail(req.getEmail())) {
			throw new IllegalArgumentException("Email already exists");
		}

		Customer c = new Customer();
		c.setFirstName(req.getFirstName());
		c.setMiddleName(req.getMiddleName());
		c.setLastName(req.getLastName());
		c.setEmail(req.getEmail());
		c.setPhone(req.getPhone());
		c.setPassword(passwordEncoder.encode(req.getPassword()));
		c.setDob(req.getDob());

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

		User user = User.builder().firstName(req.getFirstName()).lastName(req.getLastName()).email(req.getEmail())
				.username(username) // Use the same generated username
				.password(passwordEncoder.encode(req.getPassword())).role(Role.CUSTOMER) // assuming you have a CUSTOMER
																							// role
				.isEnabled(true).build();

		userRepo.save(user);

		auditLogService.logUserAction(username, "USER_REGISTERED", String.format("New customer registered: %s %s (%s)",
				req.getFirstName(), req.getLastName(), req.getEmail()));

		return savedCustomer;
	}

	@Transactional
	public Document saveDocument(Long customerId, String docType, String storagePath) {
		Customer c = customerRepo.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));

		Document d = new Document();
		d.setDocType(docType);
		d.setStoragePath(storagePath);
		d.setCustomer(c);
		d.setStatus(DocumentStatus.UPLOADED);
		d.setUploadedAt(Instant.now());

		Document savedDoc = docRepo.save(d);

		c.addDocument(savedDoc);
		customerRepo.save(c);

		return savedDoc;
	}

	private String generateUsername(String firstName, String lastName) {
		String baseUsername = (firstName + "_" + lastName).toLowerCase().replaceAll("[^a-z0-9_]", "");
		String username = baseUsername;
		int counter = 1;

		while (customerRepo.existsByUsername(username) || userRepo.existsByUsername(username)) {
			username = baseUsername + "_" + counter;
			counter++;
		}

		return username;
	}

	public boolean hasPendingRegistration(String email) {
		return pendingRegistrations.containsKey(email);
	}

	public int getPendingRegistrationCount() {
		return pendingRegistrations.size();
	}

	public List<CountryDto> getActiveCountries() {
		List<CountryRisk> countries = countryRiskRepo.findAllByOrderByRiskScoreDesc();
		
		// Filter only active countries and map to response format
		return countries.stream()
			.map(country -> new CountryDto(country.getCountryCode(), country.getCountryName()))
			.collect(java.util.stream.Collectors.toList());
	}
}
