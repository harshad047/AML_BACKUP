package com.tss.aml.dto.transaction;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * DTO for intercurrency transactions with additional exchange-related fields
 */
@Data
public class IntercurrencyTransactionDto extends BaseTransactionDto {
    
    // Intercurrency exchange specific fields
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal convertedAmount;
    private String convertedCurrency;
    private BigDecimal exchangeRate;
    private BigDecimal conversionCharges;
    private BigDecimal totalDebitAmount;
    private String chargeBreakdown;
}

