package com.tss.aml.dto;

import com.tss.aml.entity.RuleExecutionLog;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
public class EvaluationResultDto {
    private int totalRiskScore;
    private List<RuleExecutionLog> logs;
    private List<RuleMatchDto> matchedRules;

    public EvaluationResultDto(int totalRiskScore, List<RuleExecutionLog> logs, List<RuleMatchDto> matchedRules) {
        this.totalRiskScore = totalRiskScore;
        this.logs = logs;
        this.matchedRules = matchedRules;
    }
}
