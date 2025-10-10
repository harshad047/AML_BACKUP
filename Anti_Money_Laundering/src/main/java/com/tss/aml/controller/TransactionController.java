package com.tss.aml.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.BalanceDto;
import com.tss.aml.dto.CurrencyConversionDto;
import com.tss.aml.dto.DepositDto;
import com.tss.aml.dto.IntercurrencyTransferDto;
import com.tss.aml.dto.TransactionDto;
import com.tss.aml.dto.TransferDto;
import com.tss.aml.dto.WithdrawalDto;
import com.tss.aml.service.TransactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
public class TransactionController {

    private final TransactionService txService;

    @PostMapping("/deposit")
    public ResponseEntity<TransactionDto> deposit(@RequestBody DepositDto depositDto) {
        return ResponseEntity.ok(txService.deposit(depositDto));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<TransactionDto> withdraw(@RequestBody WithdrawalDto withdrawalDto) {
        return ResponseEntity.ok(txService.withdraw(withdrawalDto));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransactionDto> transfer(@RequestBody TransferDto transferDto) {
        return ResponseEntity.ok(txService.transfer(transferDto));
    }

    @PostMapping("/intercurrency-transfer")
    public ResponseEntity<TransactionDto> intercurrencyTransfer(@RequestBody IntercurrencyTransferDto transferDto) {
        return ResponseEntity.ok(txService.intercurrencyTransfer(transferDto));
    }

    @PostMapping("/currency-conversion/calculate")
    public ResponseEntity<CurrencyConversionDto> calculateCurrencyConversion(@RequestBody CurrencyConversionDto conversionDto) {
        return ResponseEntity.ok(txService.calculateCurrencyConversion(conversionDto));
    }
    
    @GetMapping("/history")
    public ResponseEntity<List<TransactionDto>> getTransactionHistory(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(txService.getTransactionHistory(username));
    }
    
    @GetMapping("/history/{accountNumber}")
    public ResponseEntity<List<TransactionDto>> getAccountTransactionHistory(
            @PathVariable String accountNumber, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(txService.getAccountTransactionHistory(accountNumber, username));
    }
    
    @GetMapping("/balance/{accountNumber}")
    public ResponseEntity<BalanceDto> getAccountBalance(
            @PathVariable String accountNumber, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(txService.getAccountBalance(accountNumber, username));
    }
    
    @GetMapping("/status/{transactionId}")
    public ResponseEntity<TransactionDto> getTransactionStatus(
            @PathVariable Long transactionId, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(txService.getTransactionStatus(transactionId, username));
    }
}
