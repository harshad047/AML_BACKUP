package com.tss.aml.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.account.BankAccountDto;
import com.tss.aml.dto.admin.CreateUserDto;
import com.tss.aml.dto.admin.UserDto;
import com.tss.aml.dto.compliance.CountryRiskDto;
import com.tss.aml.dto.compliance.RuleConditionDto;
import com.tss.aml.dto.compliance.RuleDto;
import com.tss.aml.dto.compliance.SuspiciousKeywordDto;
import com.tss.aml.dto.transaction.TransactionDto;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.CountryRisk;
import com.tss.aml.entity.Role;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.AccountStatus;
import com.tss.aml.entity.Enums.ApprovalStatus;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.CountryRiskRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.UserRepository;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RuleRepository ruleRepository;
    private final SuspiciousKeywordRepository suspiciousKeywordRepository;
    private final CountryRiskRepository countryRiskRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final SuspiciousKeywordService suspiciousKeywordService;
    private final TransactionService transactionService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(Collectors.toList());
    }

    public UserDto createUser(CreateUserDto createUserDto) {
        if (userRepository.findByEmail(createUserDto.getEmail()).isPresent()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Email is already taken!");
        }
        User user = modelMapper.map(createUserDto, User.class);
        user.setPassword(passwordEncoder.encode(createUserDto.getPassword()));
        User newUser = userRepository.save(user);
        
        // Log user creation
        auditLogService.logUserCreation("ADMIN", newUser.getUsername(), newUser.getRole().toString());
        
        return modelMapper.map(newUser, UserDto.class);
    }

    public List<RuleDto> getAllRules() {
        return ruleRepository.findAll().stream()
                .map(this::mapRuleToDto)
                .collect(Collectors.toList());
    }
    
    private RuleDto mapRuleToDto(Rule rule) {
        RuleDto dto = new RuleDto();
        dto.setId(rule.getId());
        dto.setName(rule.getName());
        dto.setDescription(rule.getDescription());
        dto.setPriority(rule.getPriority());
        dto.setAction(rule.getAction());
        dto.setRiskWeight(rule.getRiskWeight());
        
        dto.setActive(rule.isActive()); // Explicit mapping for boolean field
        
        if (rule.getConditions() != null) {
            List<RuleConditionDto> conditionDtos = rule.getConditions().stream()
                    .map(this::mapConditionToDto)
                    .collect(Collectors.toList());
            dto.setConditions(conditionDtos);
        }
        
        return dto;
    }
    
    private RuleConditionDto mapConditionToDto(RuleCondition condition) {
        RuleConditionDto dto = new RuleConditionDto();
        dto.setId(condition.getId());
        dto.setType(condition.getType());
        dto.setField(condition.getField());
        dto.setOperator(condition.getOperator());
        dto.setValue(condition.getValue());
        
        dto.setActive(condition.isActive()); // Explicit mapping for boolean field
        return dto;
    }

    public RuleDto createRule(RuleDto ruleDto) {
        // Create the Rule entity manually to handle relationships properly
        // Note: New rules and conditions are always created as active (isActive = true)
        Rule rule = Rule.builder()
                .name(ruleDto.getName())
                .description(ruleDto.getDescription())
                .priority(ruleDto.getPriority())
                .action(ruleDto.getAction())
                .riskWeight(ruleDto.getRiskWeight())
                .isActive(true)  // Force new rules to be active by default
                .build();
        
        // Save the rule first to get the ID
        Rule savedRule = ruleRepository.save(rule);
        
        // Now handle the conditions if they exist
        if (ruleDto.getConditions() != null && !ruleDto.getConditions().isEmpty()) {
            List<RuleCondition> conditions = ruleDto.getConditions().stream()
                    .map(conditionDto -> RuleCondition.builder()
                            .rule(savedRule)  // Set the saved rule reference
                            .type(conditionDto.getType())
                            .field(conditionDto.getField())
                            .operator(conditionDto.getOperator())
                            .value(conditionDto.getValue())
                            .isActive(true)  // Force new conditions to be active by default
                            .build())
                    .collect(Collectors.toList());
            
            savedRule.setConditions(conditions);
            // Save again to persist the conditions
            ruleRepository.save(savedRule);
        }
        
        // Log rule creation
        auditLogService.logRuleCreation("ADMIN", savedRule.getName());
        
        return mapRuleToDto(savedRule);
    }

    public RuleDto updateRule(Long id, RuleDto ruleDto) {
        Rule existing = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", id));
        
        // Update basic rule properties
        existing.setName(ruleDto.getName());
        existing.setDescription(ruleDto.getDescription());
        existing.setPriority(ruleDto.getPriority());
        existing.setAction(ruleDto.getAction());
        existing.setRiskWeight(ruleDto.getRiskWeight());
        existing.setActive(ruleDto.isActive());
        
        // Handle conditions update
        if (ruleDto.getConditions() != null) {
            // Clear existing conditions
            existing.getConditions().clear();
            
            // Add new conditions with automatic activation/deactivation based on rule status
            List<RuleCondition> newConditions = ruleDto.getConditions().stream()
                    .map(conditionDto -> RuleCondition.builder()
                            .rule(existing)  // Set the existing rule reference
                            .type(conditionDto.getType())
                            .field(conditionDto.getField())
                            .operator(conditionDto.getOperator())
                            .value(conditionDto.getValue())
                            // Auto-activate/deactivate conditions based on rule status
                            .isActive(ruleDto.isActive() ? conditionDto.isActive() : false)
                            .build())
                    .collect(Collectors.toList());
            
            existing.setConditions(newConditions);
        } else {
            // If no conditions provided in update, just update existing conditions based on rule status
            if (existing.getConditions() != null) {
                existing.getConditions().forEach(condition -> 
                    condition.setActive(ruleDto.isActive() ? condition.isActive() : false)
                );
            }
        }
        
        Rule saved = ruleRepository.save(existing);
        auditLogService.logRuleCreation("ADMIN", "Updated: " + saved.getName());
        return mapRuleToDto(saved);
    }

    public RuleDto toggleRuleStatus(Long id, boolean isActive) {
        Rule existing = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", id));
        
        // Update rule status
        existing.setActive(isActive);
        
        // Auto-activate/deactivate all conditions based on rule status
        if (existing.getConditions() != null) {
            existing.getConditions().forEach(condition -> {
                if (isActive) {
                    // When activating rule, restore condition to active (you might want to store previous state)
                    condition.setActive(true);
                } else {
                    // When deactivating rule, deactivate all conditions
                    condition.setActive(false);
                }
            });
        }
        
        Rule saved = ruleRepository.save(existing);
        String action = isActive ? "Activated" : "Deactivated";
        auditLogService.logRuleCreation("ADMIN", action + ": " + saved.getName());
        
        return mapRuleToDto(saved);
    }

    public void deleteRule(Long id) {
        Rule existing = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", id));
        ruleRepository.delete(existing);
        auditLogService.logRuleCreation("ADMIN", "Deleted: " + existing.getName());
    }

    public List<SuspiciousKeywordDto> getAllKeywords() {
        return suspiciousKeywordRepository.findAll().stream()
                .map(keyword -> modelMapper.map(keyword, SuspiciousKeywordDto.class))
                .collect(Collectors.toList());
    }

    public SuspiciousKeywordDto addKeyword(SuspiciousKeywordDto keywordDto) {
        SuspiciousKeyword keyword = modelMapper.map(keywordDto, SuspiciousKeyword.class);
        SuspiciousKeyword savedKeyword = suspiciousKeywordRepository.save(keyword);
        return modelMapper.map(savedKeyword, SuspiciousKeywordDto.class);
    }

    public void deleteKeyword(Long id) {
        SuspiciousKeyword existing = suspiciousKeywordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SuspiciousKeyword", "id", id));
        suspiciousKeywordRepository.delete(existing);
        auditLogService.logRuleCreation("ADMIN", "Deleted keyword: " + existing.getKeyword());
    }

    public List<BankAccountDto> getPendingAccounts() {
        return bankAccountRepository.findByApprovalStatus(ApprovalStatus.PENDING).stream()
                .map(this::mapAccountToDto)
                .collect(Collectors.toList());
    }

    public BankAccountDto approveAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));

        if (account.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not in a pending state.");
        }

        account.setApprovalStatus(ApprovalStatus.APPROVED);
        account.setStatus(AccountStatus.ACTIVE); // Activate the account
        account.setApprovedAt(LocalDateTime.now());
        
        // Account balance is already set during creation, no need to process deposits
        BankAccount updatedAccount = bankAccountRepository.save(account);
        
        // Log account approval
        auditLogService.logAccountApproval("ADMIN", account.getAccountNumber(), account.getUser().getUsername());
        
        // Send approval email
        try {
            String customerName = account.getUser().getFirstName() + " " + account.getUser().getLastName();
            emailService.sendBankAccountApprovalEmail(account.getUser().getEmail(), account.getAccountNumber(), customerName);
        } catch (Exception e) {
            System.err.println("Failed to send approval email: " + e.getMessage());
        }
        
        return mapAccountToDto(updatedAccount);
    }

    // Country Risk Management
    public List<CountryRiskDto> getAllCountryRisks() {
        return countryRiskRepository.findAll().stream()
                .map(cr -> modelMapper.map(cr, CountryRiskDto.class))
                .collect(Collectors.toList());
    }

    public CountryRiskDto createCountryRisk(CountryRiskDto dto) {
        // Manual mapping to handle null riskScore safely
        CountryRisk entity = CountryRisk.builder()
                .countryCode(dto.getCountryCode())
                .countryName(dto.getCountryName())
                .riskScore(dto.getRiskScore() != null ? dto.getRiskScore() : 0)
                .notes(dto.getNotes())
                .build();
        CountryRisk saved = countryRiskRepository.save(entity);
        return modelMapper.map(saved, CountryRiskDto.class);
    }

    public CountryRiskDto updateCountryRisk(Long id, CountryRiskDto dto) {
        CountryRisk existing = countryRiskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CountryRisk", "id", id));
        existing.setCountryCode(dto.getCountryCode());
        existing.setCountryName(dto.getCountryName());
        // Handle null riskScore safely
        existing.setRiskScore(dto.getRiskScore() != null ? dto.getRiskScore() : 0);
        existing.setNotes(dto.getNotes());
        CountryRisk saved = countryRiskRepository.save(existing);
        return modelMapper.map(saved, CountryRiskDto.class);
    }

    public void deleteCountryRisk(Long id) {
        CountryRisk existing = countryRiskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CountryRisk", "id", id));
        countryRiskRepository.delete(existing);
    }

    // Admin view transactions by account number
    public List<TransactionDto> getTransactionsByAccountNumber(String accountNumber) {
        return transactionRepository
                .findByFromAccountNumberOrToAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
                .stream()
                .map(tx -> modelMapper.map(tx, TransactionDto.class))
                .collect(Collectors.toList());
    }

    private BankAccountDto mapAccountToDto(BankAccount account) {
        BankAccountDto dto = modelMapper.map(account, BankAccountDto.class);
        if (account.getUser() != null) {
            dto.setCustomerId(account.getUser().getId());
            String first = account.getUser().getFirstName();
            String last = account.getUser().getLastName();
            dto.setCustomerName(((first != null ? first : "").trim() + " " + (last != null ? last : "").trim()).trim());
        }
        return dto;
    }

    public BankAccountDto rejectAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));

        if (account.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not in a pending state.");
        }

        account.setApprovalStatus(ApprovalStatus.REJECTED);
        account.setStatus(AccountStatus.SUSPENDED); // Deactivate the account
        account.setRejectedAt(LocalDateTime.now());
        
        // Reset balance to zero for rejected accounts
        BigDecimal originalBalance = account.getBalance();
        account.setBalance(BigDecimal.ZERO);
        
        BankAccount updatedAccount = bankAccountRepository.save(account);
        
        // Log the balance reset
        if (originalBalance.compareTo(BigDecimal.ZERO) > 0) {
            auditLogService.logAccountRejection("ADMIN", account.getAccountNumber(), 
                account.getUser().getUsername(), 
                "Account rejected - balance reset from " + originalBalance + " to 0");
        }
        
        // Log account rejection
        auditLogService.logAccountRejection("ADMIN", account.getAccountNumber(), account.getUser().getUsername(), "Account rejected by admin");
        
        // Send rejection email
        try {
            String customerName = account.getUser().getFirstName() + " " + account.getUser().getLastName();
            emailService.sendBankAccountRejectionEmail(account.getUser().getEmail(), account.getAccountNumber(), customerName, "Account did not meet compliance requirements");
        } catch (Exception e) {
            System.err.println("Failed to send rejection email: " + e.getMessage());
        }
        
        return mapAccountToDto(updatedAccount);
    }
    
    public List<BankAccountDto> getAllAccounts() {
        return bankAccountRepository.findAll().stream()
                .map(this::mapAccountToDto)
                .collect(Collectors.toList());
    }
    
    public BankAccountDto getAccountById(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        return mapAccountToDto(account);
    }
    
    public BankAccountDto suspendAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        
        if (account.getStatus() == AccountStatus.SUSPENDED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is already suspended.");
        }
        
        account.setStatus(AccountStatus.SUSPENDED);
        account.setSuspendedAt(LocalDateTime.now());
        BankAccount updatedAccount = bankAccountRepository.save(account);
        
        // Log account suspension
        auditLogService.logAccountSuspension("ADMIN", account.getAccountNumber(), account.getUser().getUsername());
        
        // Send suspension email
        try {
            String customerName = account.getUser().getFirstName() + " " + account.getUser().getLastName();
            emailService.sendAccountSuspensionEmail(account.getUser().getEmail(), account.getAccountNumber(), customerName, "Account suspended for compliance review");
        } catch (Exception e) {
            System.err.println("Failed to send suspension email: " + e.getMessage());
        }
        
        return mapAccountToDto(updatedAccount);
    }
    
    public BankAccountDto activateAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        
        if (account.getStatus() == AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is already active.");
        }
        
        if (account.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account must be approved before activation.");
        }
        
        account.setStatus(AccountStatus.ACTIVE);
        account.setActivatedAt(LocalDateTime.now());
        BankAccount updatedAccount = bankAccountRepository.save(account);
        
        // Log account activation
        auditLogService.logAccountActivation("ADMIN", account.getAccountNumber(), account.getUser().getUsername());
        
        // Send activation email
        try {
            String customerName = account.getUser().getFirstName() + " " + account.getUser().getLastName();
            emailService.sendAccountActivationEmail(account.getUser().getEmail(), account.getAccountNumber(), customerName);
        } catch (Exception e) {
            System.err.println("Failed to send activation email: " + e.getMessage());
        }
        
        return mapAccountToDto(updatedAccount);
    }
    
    // New methods for compliance officer management and customer blocking
    
    public UserDto addComplianceOfficer(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (user.getRole() == Role.OFFICER) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "User is already a compliance officer.");
        }
        
        user.setRole(Role.OFFICER);
        User updatedUser = userRepository.save(user);
        
        // Log compliance officer addition
        auditLogService.logComplianceOfficerAdded("ADMIN", user.getUsername());
        
        // Send email notification
        try {
            String officerName = user.getFirstName() + " " + user.getLastName();
            emailService.sendComplianceOfficerAddedEmail(user.getEmail(), officerName);
        } catch (Exception e) {
            System.err.println("Failed to send compliance officer added email: " + e.getMessage());
        }
        
        return modelMapper.map(updatedUser, UserDto.class);
    }
    
    public UserDto removeComplianceOfficer(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (user.getRole() != Role.OFFICER) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "User is not a compliance officer.");
        }
        
        user.setRole(Role.CUSTOMER); // Demote to customer
        User updatedUser = userRepository.save(user);
        
        // Log compliance officer removal
        auditLogService.logComplianceOfficerRemoved("ADMIN", user.getUsername());
        
        // Send email notification
        try {
            String officerName = user.getFirstName() + " " + user.getLastName();
            emailService.sendComplianceOfficerRemovedEmail(user.getEmail(), officerName);
        } catch (Exception e) {
            System.err.println("Failed to send compliance officer removed email: " + e.getMessage());
        }
        
        return modelMapper.map(updatedUser, UserDto.class);
    }
    
    public UserDto blockCustomer(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.SUPER_ADMIN) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Cannot block admin users.");
        }
        
        if (!user.isEnabled()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "User is already blocked.");
        }
        
        user.setEnabled(false);
        User updatedUser = userRepository.save(user);
        
        // Also suspend all user's bank accounts
        List<BankAccount> userAccounts = bankAccountRepository.findByUser(user);
        for (BankAccount account : userAccounts) {
            if (account.getStatus() != AccountStatus.SUSPENDED) {
                account.setStatus(AccountStatus.SUSPENDED);
                account.setSuspendedAt(LocalDateTime.now());
                bankAccountRepository.save(account);
            }
        }
        
        // Log customer blocking
        auditLogService.logCustomerBlocked("ADMIN", user.getUsername(), reason != null ? reason : "Blocked by admin");
        
        return modelMapper.map(updatedUser, UserDto.class);
    }
    
    public UserDto unblockCustomer(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (user.isEnabled()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "User is not blocked.");
        }
        
        user.setEnabled(true);
        User updatedUser = userRepository.save(user);
        
        // Log customer unblocking
        auditLogService.logCustomerUnblocked("ADMIN", user.getUsername());
        
        return modelMapper.map(updatedUser, UserDto.class);
    }
    
    public List<UserDto> getComplianceOfficers() {
        return userRepository.findByRole(Role.OFFICER).stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(Collectors.toList());
    }
    
    public List<UserDto> getBlockedCustomers() {
        return userRepository.findByIsEnabledFalse().stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new compliance officer directly (not promoting existing user)
     */
    public UserDto createComplianceOfficer(CreateUserDto createUserDto) {
        // Check if email is already taken
        if (userRepository.findByEmail(createUserDto.getEmail()).isPresent()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Email is already taken!");
        }
        
        // Check if username is already taken
        if (userRepository.findByUsername(createUserDto.getUsername()).isPresent()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Username is already taken!");
        }
        
        // Force role to be OFFICER for compliance officer
        createUserDto.setRole(Role.OFFICER);
        
        User user = modelMapper.map(createUserDto, User.class);
        user.setPassword(passwordEncoder.encode(createUserDto.getPassword()));
        User newOfficer = userRepository.save(user);
        
        // Log compliance officer creation
        auditLogService.logUserCreation("ADMIN", newOfficer.getUsername(), "COMPLIANCE_OFFICER");
        auditLogService.logComplianceOfficerAdded("ADMIN", newOfficer.getUsername());
        
        // Send welcome email to new compliance officer
        try {
            String officerName = newOfficer.getFirstName() + " " + newOfficer.getLastName();
            emailService.sendComplianceOfficerAddedEmail(newOfficer.getEmail(), officerName);
        } catch (Exception e) {
            System.err.println("Failed to send compliance officer welcome email: " + e.getMessage());
        }
        
        return modelMapper.map(newOfficer, UserDto.class);
    }
    
}

