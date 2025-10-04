package com.tss.aml.dto;

import com.tss.aml.entity.BankAccount;
import lombok.Data;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Data
public class CreateAccountDto {
    @NotNull(message = "Account type is required")
    private BankAccount.AccountType accountType;
    
    @NotNull(message = "Currency is required")
    private String currency;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Initial balance must be non-negative")
    private BigDecimal initialBalance; // No default value - will be null if not provided
}
