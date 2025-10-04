package com.tss.aml.dto;

import com.tss.aml.entity.BankAccount;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BankAccountDto {
    private Long id;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private BankAccount.AccountType accountType;
    private BankAccount.AccountStatus status;
    private BankAccount.ApprovalStatus approvalStatus;
    private UserDto user;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime suspendedAt;
    private LocalDateTime activatedAt;
}
