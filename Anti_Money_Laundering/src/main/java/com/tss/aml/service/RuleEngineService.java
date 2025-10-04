package com.tss.aml.service;

import com.tss.aml.dto.EvaluationResultDto;
import com.tss.aml.dto.TransactionInputDto;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.RuleExecutionLog;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.service.rules.RuleEvaluator;
import com.tss.aml.service.rules.RuleEvaluatorFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RuleEngineService {
    private final RuleRepository ruleRepo;
    private final RuleEvaluatorFactory ruleEvaluatorFactory;

    public EvaluationResultDto evaluate(TransactionInputDto input) {
        List<Rule> rules = ruleRepo.findByIsActiveTrueOrderByPriorityAsc();
        System.out.println("Rule Engine - Found " + rules.size() + " active rules");
        
        List<RuleExecutionLog> logs = new ArrayList<>();
        double survivalProb = 1.0; // P(no risk) = ∏(1 - P_i)

        for (Rule rule : rules) {
            System.out.println("Evaluating rule: " + rule.getName() + " (Weight: " + rule.getRiskWeight() + ")");
            boolean match = true;
            
            for (RuleCondition cond : rule.getConditions()) {
                if (!cond.isActive()) {
                    System.out.println("  Condition inactive: " + cond.getType());
                    continue;
                }

                RuleEvaluator evaluator = ruleEvaluatorFactory.getEvaluator(cond.getType());
                System.out.println("  Evaluating condition: " + cond.getType() + " with evaluator: " + (evaluator != null ? evaluator.getClass().getSimpleName() : "NULL"));

                if (evaluator == null || !evaluator.evaluate(input, cond)) {
                    System.out.println("  Condition failed: " + cond.getType());
                    match = false;
                    break;
                } else {
                    System.out.println("  Condition passed: " + cond.getType());
                }
            }

            if (match) {
                System.out.println("  Rule MATCHED: " + rule.getName());
                // Convert rule weight (0–100) → probability (0.0–1.0)
                double ruleProb = Math.min(1.0, Math.max(0.0, rule.getRiskWeight() / 100.0));
                survivalProb *= (1.0 - ruleProb); // Multiply survival probabilities

                logs.add(RuleExecutionLog.builder()
                        .rule(rule)
                        .transactionId(input.getTxId())
                        .matched(true)
                        .details("Rule triggered: " + rule.getName())
                        .evaluatedAt(java.time.LocalDateTime.now())
                        .build());
            } else {
                System.out.println("  Rule NOT matched: " + rule.getName());
            }
        }

        // Final risk probability
        double combinedProb = 1.0 - survivalProb;
        int ruleEngineScore = (int) Math.round(combinedProb * 100);
        
        System.out.println("Rule Engine Final Score: " + ruleEngineScore + " (Combined Prob: " + combinedProb + ")");
        return new EvaluationResultDto(ruleEngineScore, logs);
    }
}
