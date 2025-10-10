package com.tss.aml.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferDto {
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private String currency; // Optional - will be auto-detected from sender account
    private String description;
    private String receiverCountryCode; // Optional - will be auto-detected from receiver account
}
