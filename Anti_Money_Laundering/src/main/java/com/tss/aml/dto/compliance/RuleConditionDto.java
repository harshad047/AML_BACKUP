package com.tss.aml.dto.compliance;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.tss.aml.entity.RuleCondition;
import lombok.Data;

@Data
public class RuleConditionDto {
    private Long id;
    private RuleCondition.ConditionType type;
    private String field;
    private String operator;
    private String value;
    
    @JsonProperty("active")
    private boolean isActive;
}

