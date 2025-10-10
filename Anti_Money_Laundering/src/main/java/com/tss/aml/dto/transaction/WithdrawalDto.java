package com.tss.aml.dto.transaction;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class WithdrawalDto {
    private String fromAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
}

