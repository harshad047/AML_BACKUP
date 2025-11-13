package com.tss.aml.dto.transaction;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferDto {
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String receiverCountryCode; 
}

