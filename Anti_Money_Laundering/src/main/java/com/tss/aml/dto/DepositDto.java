package com.tss.aml.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DepositDto {
    private String toAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
}
