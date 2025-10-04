package com.tss.aml.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.BankAccountDto;
import com.tss.aml.dto.CreateAccountDto;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.entity.User;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.BankAccountRepository;
import com.tss.aml.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Autowired
    public BankAccountService(BankAccountRepository bankAccountRepository, UserRepository userRepository, ModelMapper modelMapper) {
        this.bankAccountRepository = bankAccountRepository;
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
    }

    public BankAccountDto createAccount(String usernameOrEmail, CreateAccountDto createAccountDto) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);

        BankAccount newAccount = new BankAccount();
        newAccount.setUser(user);
        newAccount.setAccountType(createAccountDto.getAccountType());
        newAccount.setCurrency(createAccountDto.getCurrency());
        newAccount.setBalance(createAccountDto.getInitialBalance() != null ? 
            createAccountDto.getInitialBalance() : BigDecimal.ZERO);
        newAccount.setApprovalStatus(BankAccount.ApprovalStatus.PENDING);
        newAccount.generateAccountNumber(); // Generate account number

        BankAccount savedAccount = bankAccountRepository.save(newAccount);
        return modelMapper.map(savedAccount, BankAccountDto.class);
    }

    public List<BankAccountDto> getAccountsForUser(String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        return bankAccountRepository.findByUserId(user.getId()).stream()
                .map(account -> modelMapper.map(account, BankAccountDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Helper method to find user by username or email
     */
    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        // First try to find by username
        return userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> 
                    // If not found by username, try by email
                    userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail))
                );
    }
}
