package com.tss.aml.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
