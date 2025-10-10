package com.tss.aml.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    public enum TransactionType {
        DEPOSIT, WITHDRAWAL, TRANSFER, INTERCURRENCY_TRANSFER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(name = "from_account_number")
    private String fromAccountNumber;

    @Column(name = "to_account_number")
    private String toAccountNumber;
    
    @Column(name = "customer_id")
    private Long customerId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status; // e.g., PENDING, APPROVED, BLOCKED

    private Integer nlpScore;

    private Integer ruleEngineScore;

    private Integer combinedRiskScore;

    private boolean thresholdExceeded;

    private String alertId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "transaction_reference")
    private String transactionReference;
    
    // Intercurrency exchange specific fields
    @Column(name = "original_amount")
    private BigDecimal originalAmount;
    
    @Column(name = "original_currency")
    private String originalCurrency;
    
    @Column(name = "converted_amount")
    private BigDecimal convertedAmount;
    
    @Column(name = "converted_currency")
    private String convertedCurrency;
    
    @Column(name = "exchange_rate")
    private BigDecimal exchangeRate;
    
    @Column(name = "conversion_charges")
    private BigDecimal conversionCharges;
    
    @Column(name = "total_debit_amount")
    private BigDecimal totalDebitAmount;
    
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

