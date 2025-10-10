package com.tss.aml.dto;

import com.tss.aml.entity.Transaction;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionDto {
    private Long id;
    private Transaction.TransactionType transactionType;
    private String fromAccountNumber;
    private String toAccountNumber;
    private Long customerId;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private Integer nlpScore;
    private Integer ruleEngineScore;
    private Integer combinedRiskScore;
    private boolean thresholdExceeded;
    private String alertId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String transactionReference;
    
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
