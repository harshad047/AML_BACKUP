package com.tss.aml.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.*;
import com.tss.aml.entity.*;
import com.tss.aml.repository.*;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import com.tss.aml.entity.User;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import com.tss.aml.repository.UserRepository;


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
                .map(rule -> modelMapper.map(rule, RuleDto.class))
                .collect(Collectors.toList());
    }

    public RuleDto createRule(RuleDto ruleDto) {
        Rule rule = modelMapper.map(ruleDto, Rule.class);
        Rule savedRule = ruleRepository.save(rule);
        
        // Log rule creation
        auditLogService.logRuleCreation("ADMIN", savedRule.getName());
        
        return modelMapper.map(savedRule, RuleDto.class);
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

    public List<BankAccountDto> getPendingAccounts() {
        return bankAccountRepository.findByApprovalStatus(BankAccount.ApprovalStatus.PENDING).stream()
                .map(account -> modelMapper.map(account, BankAccountDto.class))
                .collect(Collectors.toList());
    }

    public BankAccountDto approveAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));

        if (account.getApprovalStatus() != BankAccount.ApprovalStatus.PENDING) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not in a pending state.");
        }

        account.setApprovalStatus(BankAccount.ApprovalStatus.APPROVED);
        account.setStatus(BankAccount.AccountStatus.ACTIVE); // Activate the account
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
        
        return modelMapper.map(updatedAccount, BankAccountDto.class);
    }

    public BankAccountDto rejectAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));

        if (account.getApprovalStatus() != BankAccount.ApprovalStatus.PENDING) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is not in a pending state.");
        }

        account.setApprovalStatus(BankAccount.ApprovalStatus.REJECTED);
        account.setStatus(BankAccount.AccountStatus.SUSPENDED); // Deactivate the account
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
        
        return modelMapper.map(updatedAccount, BankAccountDto.class);
    }
    
    public List<BankAccountDto> getAllAccounts() {
        return bankAccountRepository.findAll().stream()
                .map(account -> modelMapper.map(account, BankAccountDto.class))
                .collect(Collectors.toList());
    }
    
    public BankAccountDto getAccountById(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        return modelMapper.map(account, BankAccountDto.class);
    }
    
    public BankAccountDto suspendAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        
        if (account.getStatus() == BankAccount.AccountStatus.SUSPENDED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is already suspended.");
        }
        
        account.setStatus(BankAccount.AccountStatus.SUSPENDED);
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
        
        return modelMapper.map(updatedAccount, BankAccountDto.class);
    }
    
    public BankAccountDto activateAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", accountId));
        
        if (account.getStatus() == BankAccount.AccountStatus.ACTIVE) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account is already active.");
        }
        
        if (account.getApprovalStatus() != BankAccount.ApprovalStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "Account must be approved before activation.");
        }
        
        account.setStatus(BankAccount.AccountStatus.ACTIVE);
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
        
        return modelMapper.map(updatedAccount, BankAccountDto.class);
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
            if (account.getStatus() != BankAccount.AccountStatus.SUSPENDED) {
                account.setStatus(BankAccount.AccountStatus.SUSPENDED);
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
