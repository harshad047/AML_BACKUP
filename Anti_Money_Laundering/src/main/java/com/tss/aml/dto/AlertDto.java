package com.tss.aml.dto;

import com.tss.aml.entity.Alert;
import lombok.Data;

import java.time.LocalDateTime;

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
