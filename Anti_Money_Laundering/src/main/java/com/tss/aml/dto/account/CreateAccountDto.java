package com.tss.aml.dto.account;

import java.math.BigDecimal;

import com.tss.aml.entity.Enums.AccountType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountDto {
    @NotNull(message = "Account type is required")
    private AccountType accountType;
    
    @NotNull(message = "Currency is required")
    private String currency;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Initial balance must be non-negative")
    private BigDecimal initialBalance; // No default value - will be null if not provided
}

