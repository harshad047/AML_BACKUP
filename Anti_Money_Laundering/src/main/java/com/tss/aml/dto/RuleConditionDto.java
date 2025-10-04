package com.tss.aml.dto;

import com.tss.aml.entity.RuleCondition;
import lombok.Data;

@Data
public class RuleConditionDto {
    private Long id;
    private RuleCondition.ConditionType type;
    private String field;
    private String operator;
    private String value;
    private boolean isActive;
}
