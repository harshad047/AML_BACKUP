package com.tss.aml.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.account.BankAccountDto;
import com.tss.aml.dto.account.CreateAccountDto;
import com.tss.aml.service.impl.BankAccountServiceImpl;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
public class BankAccountController {

    private final BankAccountServiceImpl bankAccountService;

    @PostMapping
    public ResponseEntity<BankAccountDto> createAccount(@Valid @RequestBody CreateAccountDto createAccountDto, Authentication authentication) {
        String username = authentication.getName();
        BankAccountDto newAccount = bankAccountService.createAccount(username, createAccountDto);
        return new ResponseEntity<>(newAccount, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BankAccountDto>> getAccounts(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(bankAccountService.getAccountsForUser(username));
    }
}

