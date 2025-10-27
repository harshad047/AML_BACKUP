package com.tss.aml.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long transactionId;

    private String reason;

    private int riskScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AlertStatus status = AlertStatus.OPEN;

    private LocalDateTime createdAt = LocalDateTime.now();
    
    private String resolvedBy; // Officer who resolved the alert
    private LocalDateTime resolvedAt; // When the alert was resolved

    public enum AlertStatus {
        OPEN, RESOLVED, ESCALATED
    }
}
