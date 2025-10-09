package com.tss.aml.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import com.tss.aml.entity.Transaction;

@Data
@Builder
public class TransactionInputDto {
    private String txId;
    private String customerId;
    private BigDecimal amount;
    private String countryCode;
    private int nlpScore;
    private String text;
    private Transaction.TransactionType transactionType;
    private String fromAccountNumber;
    private String toAccountNumber;
}
