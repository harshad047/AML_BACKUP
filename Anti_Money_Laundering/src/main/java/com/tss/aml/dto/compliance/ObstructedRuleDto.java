package com.tss.aml.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ObstructedRuleDto {
    private Long ruleId;
    private String ruleName;
    private String action; // FLAG or BLOCK
    private int riskWeight;
    private int priority;
    private String details;
    private LocalDateTime evaluatedAt;
}
