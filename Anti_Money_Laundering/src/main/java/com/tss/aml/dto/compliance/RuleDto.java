package com.tss.aml.dto.compliance;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class RuleDto {
    private Long id;
    private String name;
    private String description;
    private int priority;
    private String action;
    private int riskWeight;
    
    @JsonProperty("active")
    private boolean isActive;
    
    private List<RuleConditionDto> conditions;
}

