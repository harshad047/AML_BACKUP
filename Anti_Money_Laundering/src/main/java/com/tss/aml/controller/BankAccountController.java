package com.tss.aml.controller;

import com.tss.aml.dto.BankAccountDto;
import com.tss.aml.dto.CreateAccountDto;
import com.tss.aml.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
public class BankAccountController {

    private final BankAccountService bankAccountService;

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
