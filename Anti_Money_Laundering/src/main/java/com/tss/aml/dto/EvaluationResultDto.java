package com.tss.aml.dto;

import com.tss.aml.entity.RuleExecutionLog;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class EvaluationResultDto {
    private int totalRiskScore;
    private List<RuleExecutionLog> logs;
}
