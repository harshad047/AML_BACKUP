package com.tss.aml.dto.compliance;

import java.time.LocalDateTime;

import com.tss.aml.dto.transaction.TransactionDto;
import com.tss.aml.entity.Alert;

import lombok.Data;

@Data
public class AlertDto {
    private Long id;
    private Long transactionId;
    private String reason;
    private int riskScore;
    private Alert.AlertStatus status;
    private LocalDateTime createdAt;
    private TransactionDto transaction;
}
