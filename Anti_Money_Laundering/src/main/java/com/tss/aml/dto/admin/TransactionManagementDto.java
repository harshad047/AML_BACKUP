package com.tss.aml.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionManagementDto {

    private Long id;
    private String transactionType;
    private String fromAccountNumber;
    private String toAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    
    private Integer nlpScore;
    private Integer ruleEngineScore;
    private Integer combinedRiskScore;
    private boolean thresholdExceeded;
    
    private Long customerId;
    private String customerName;
    private String customerEmail;
    
    private String alertId;
    private String alertStatus;
    private String alertReason;
    
    private String assignedOfficer;
    private String resolvedBy;
    private LocalDateTime resolvedAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private String countryCode;
    private List<String> matchedKeywords;
    private List<String> triggeredRules;
    
    private boolean canApprove;
    private boolean canReject;
    private boolean canEscalate;
}

