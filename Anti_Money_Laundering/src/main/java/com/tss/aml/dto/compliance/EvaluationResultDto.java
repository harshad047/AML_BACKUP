package com.tss.aml.dto.compliance;

import java.util.List;

import com.tss.aml.entity.RuleExecutionLog;

import lombok.Data;

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
