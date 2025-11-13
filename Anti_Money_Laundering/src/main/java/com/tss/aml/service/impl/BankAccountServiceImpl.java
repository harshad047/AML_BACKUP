package com.tss.aml.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.account.BankAccountDto;
import com.tss.aml.dto.account.CreateAccountDto;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.Enums.AccountStatus;
import com.tss.aml.entity.Enums.ApprovalStatus;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.IBankAccountService;
import com.tss.aml.repository.CustomerRepository;

@Service
public class BankAccountServiceImpl implements IBankAccountService{

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final ModelMapper modelMapper;
    private final AuditLogServiceImpl auditLogService;
    private final EmailService emailService;
    private final CustomerRepository customerRepository;

	@Autowired
	    public BankAccountServiceImpl(BankAccountRepository bankAccountRepository, UserRepository userRepository,
            TransactionRepository transactionRepository, ModelMapper modelMapper, AuditLogServiceImpl auditLogService,
            EmailService emailService, CustomerRepository customerRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.modelMapper = modelMapper;
        this.auditLogService = auditLogService;
        this.emailService = emailService;
        this.customerRepository = customerRepository;
    }

	    public BankAccountDto createAccount(String usernameOrEmail, CreateAccountDto createAccountDto) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);

        Customer customer = customerRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email", user.getEmail()));
        if (customer.getKycStatus() != KycStatus.APPROVED) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, "KYC is not approved. Please complete and get your KYC approved by admin before creating an account.");
        }
        BankAccount newAccount = new BankAccount();
        newAccount.setUser(user);
        newAccount.setAccountType(createAccountDto.getAccountType());
        newAccount.setCurrency(createAccountDto.getCurrency());
        BigDecimal initialBalance = createAccountDto.getInitialBalance();
        BigDecimal balanceToSet = initialBalance != null ? initialBalance : BigDecimal.ZERO;
        newAccount.setBalance(balanceToSet);
        newAccount.setStatus(AccountStatus.PENDING);       
        newAccount.setApprovalStatus(ApprovalStatus.PENDING);
        newAccount.generateAccountNumber(); 

        BankAccount savedAccount = bankAccountRepository.save(newAccount);
        
        String balanceInfo = initialBalance != null ? " with initial balance: " + initialBalance : " with zero balance";
        auditLogService.logAccountCreation(user.getUsername(), savedAccount.getAccountNumber() + balanceInfo);
        
        try {
            emailService.sendBankAccountCreationRequestEmail(user.getEmail(), savedAccount.getAccountNumber());
        } catch (Exception e) {
            System.err.println("Failed to send account creation request email: " + e.getMessage());
        }
        
        return modelMapper.map(savedAccount, BankAccountDto.class);
    }

	public List<BankAccountDto> getAccountsForUser(String usernameOrEmail) {
		User user = findUserByUsernameOrEmail(usernameOrEmail);
		return bankAccountRepository.findByUserId(user.getId()).stream()
				.map(account -> modelMapper.map(account, BankAccountDto.class)).collect(Collectors.toList());
	}


	private User findUserByUsernameOrEmail(String usernameOrEmail) {
		return userRepository.findByUsername(usernameOrEmail).orElseGet(() ->
		userRepository.findByEmail(usernameOrEmail)
				.orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail)));
	}


}

