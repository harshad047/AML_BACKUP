package com.tss.aml.dto.account;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.aml.dto.admin.UserDto;
import com.tss.aml.entity.Enums.AccountStatus;
import com.tss.aml.entity.Enums.AccountType;
import com.tss.aml.entity.Enums.ApprovalStatus;

import lombok.Data;

@Data
public class BankAccountDto {
    private Long id;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private AccountType accountType;
    private AccountStatus status;
    private ApprovalStatus approvalStatus;
    private UserDto user;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime suspendedAt;
    private LocalDateTime activatedAt;
}

