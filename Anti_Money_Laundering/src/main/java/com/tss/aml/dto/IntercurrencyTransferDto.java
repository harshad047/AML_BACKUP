package com.tss.aml.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class IntercurrencyTransferDto {
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private String description;
    private String receiverCountryCode; // Optional - will be auto-detected if not provided
    
    // Response fields for conversion details
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal convertedAmount;
    private String convertedCurrency;
    private BigDecimal exchangeRate;
    private BigDecimal conversionCharges;
    private BigDecimal totalDebitAmount;
    private String chargeBreakdown;
}
