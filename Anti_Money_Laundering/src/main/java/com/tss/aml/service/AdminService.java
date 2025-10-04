package com.tss.aml.service;

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
        BankAccount updatedAccount = bankAccountRepository.save(account);
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
        BankAccount updatedAccount = bankAccountRepository.save(account);
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
        return modelMapper.map(updatedAccount, BankAccountDto.class);
    }
}
