package com.tss.aml.dto;

import lombok.Data;

/**
 * DTO for regular transactions (DEPOSIT, WITHDRAWAL, TRANSFER)
 * Contains only the essential fields without intercurrency-specific data
 */
@Data
public class RegularTransactionDto extends BaseTransactionDto {
    // No additional fields needed for regular transactions
    // All necessary fields are inherited from BaseTransactionDto
}
