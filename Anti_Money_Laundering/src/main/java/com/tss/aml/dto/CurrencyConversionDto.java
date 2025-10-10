package com.tss.aml.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CurrencyConversionDto {
    // Request fields
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal amount;
    
    // Response fields
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal convertedAmount;
    private String convertedCurrency;
    private BigDecimal exchangeRate;
    private BigDecimal conversionCharges;
    private BigDecimal totalDebitAmount;
    private String chargeBreakdown;
    private boolean isSupported;
}
