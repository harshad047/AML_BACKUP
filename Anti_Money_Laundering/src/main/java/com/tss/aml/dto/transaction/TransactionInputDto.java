package com.tss.aml.dto.transaction;

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
    private String countryCode;           // Receiver/Customer country (for backward compatibility)
    private String senderCountryCode;     // Sender's country (for transfers)
    private int nlpScore;
    private String text;
    private Transaction.TransactionType transactionType;
    private String fromAccountNumber;
    private String toAccountNumber;
}

