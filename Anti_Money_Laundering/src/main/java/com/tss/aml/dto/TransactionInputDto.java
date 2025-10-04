package com.tss.aml.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TransactionInputDto {
    private String txId;
    private String customerId;
    private BigDecimal amount;
    private String countryCode;
    private int nlpScore;
    private String text;
}
