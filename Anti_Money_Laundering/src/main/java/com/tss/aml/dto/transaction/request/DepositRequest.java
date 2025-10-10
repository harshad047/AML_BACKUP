package com.tss.aml.dto.transaction.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DepositRequest {
    private String toAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
}
