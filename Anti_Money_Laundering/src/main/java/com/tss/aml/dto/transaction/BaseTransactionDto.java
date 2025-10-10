package com.tss.aml.dto.transaction;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.tss.aml.entity.Transaction;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "transactionType")
@JsonSubTypes({
    @JsonSubTypes.Type(value = RegularTransactionDto.class, name = "DEPOSIT"),
    @JsonSubTypes.Type(value = RegularTransactionDto.class, name = "WITHDRAWAL"),
    @JsonSubTypes.Type(value = RegularTransactionDto.class, name = "TRANSFER"),
    @JsonSubTypes.Type(value = IntercurrencyTransactionDto.class, name = "INTERCURRENCY_TRANSFER")
})
public abstract class BaseTransactionDto {
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
}

