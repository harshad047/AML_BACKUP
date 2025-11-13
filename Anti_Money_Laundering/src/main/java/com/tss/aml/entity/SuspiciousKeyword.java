package com.tss.aml.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "suspicious_keywords")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuspiciousKeyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Keyword cannot be blank")
    @Size(max = 255, message = "Keyword cannot exceed 255 characters")
    @Column(nullable = false, unique = true)
    private String keyword;

    @NotNull(message = "Risk level is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;

    @Min(value = 0, message = "Risk score must be non-negative")
    @Max(value = 100, message = "Risk score cannot exceed 100")
    @Column(name = "risk_score", nullable = false)
    private Integer riskScore;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    @Column(name = "category")
    private String category; // e.g., "FINANCIAL_CRIME", "TERRORISM", "DRUG_RELATED"

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(name = "description")
    private String description; 

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "case_sensitive", nullable = false)
    private boolean caseSensitive = false;

    @Column(name = "whole_word_only", nullable = false)
    private boolean wholeWordOnly = true; 
    
    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    @Column(name = "created_by")
    private String createdBy; 
    @Size(max = 100, message = "Updated by cannot exceed 100 characters")
    @Column(name = "updated_by")
    private String updatedBy; 

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RiskLevel {
        LOW(1, 25),
        Low(1, 25),
        Medium(26,50),
        MEDIUM(26, 50),      
        HIGH(51, 75),
        High(51, 75),
        CRITICAL(76, 100),
    	Critical (76,100);

        private final int minScore;
        private final int maxScore;

        RiskLevel(int minScore, int maxScore) {
            this.minScore = minScore;
            this.maxScore = maxScore;
        }

        public int getMinScore() { return minScore; }
        public int getMaxScore() { return maxScore; }

        public static RiskLevel fromScore(int score) {
            for (RiskLevel level : values()) {
                if (score >= level.minScore && score <= level.maxScore) {
                    return level;
                }
            } 
            return LOW; 
        }
    }
}
