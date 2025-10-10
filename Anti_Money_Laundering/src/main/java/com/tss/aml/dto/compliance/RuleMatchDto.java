package com.tss.aml.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RuleMatchDto {
    private Long ruleId;
    private String ruleName;
    private String action;
    private int riskWeight;
    private int priority;
}

