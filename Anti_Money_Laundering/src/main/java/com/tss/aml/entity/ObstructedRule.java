package com.tss.aml.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "obstructed_rules")
public class ObstructedRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    @JsonBackReference
    private Alert alert;

    private Long ruleId;
    private String ruleName;
    private String ruleAction;
    private Double riskWeight;
    private Integer priority;
    private String details;
    private LocalDateTime evaluatedAt;
}
