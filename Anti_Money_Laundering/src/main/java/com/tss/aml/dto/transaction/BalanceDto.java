package com.tss.aml.dto.transaction;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceDto {
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private String accountType;
    private String status;
}

