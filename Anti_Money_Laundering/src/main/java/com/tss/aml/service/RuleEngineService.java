package com.tss.aml.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.compliance.EvaluationResultDto;
import com.tss.aml.dto.compliance.RuleMatchDto;
import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.RuleExecutionLog;
import com.tss.aml.repository.RuleExecutionLogRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.service.rules.RuleEvaluator;
import com.tss.aml.service.rules.RuleEvaluatorFactory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RuleEngineService {
    private final RuleRepository ruleRepo;
    private final RuleEvaluatorFactory ruleEvaluatorFactory;
    private final RuleExecutionLogRepository ruleExecutionLogRepository;

    private static final Logger log = LoggerFactory.getLogger(RuleEngineService.class);

    public EvaluationResultDto evaluate(TransactionInputDto input) {
        List<Rule> rules = ruleRepo.findByIsActiveTrueOrderByPriorityAsc();
        log.debug("Rule Engine - Found {} active rules", rules.size());
        
        List<RuleExecutionLog> logs = new ArrayList<>();
        double survivalProb = 1.0; 
        boolean blockTriggered = false;
        List<RuleMatchDto> matched = new ArrayList<>();

        for (Rule rule : rules) {
            log.debug("Evaluating rule: {} (Weight: {}, Action: {}, Priority: {})", rule.getName(), rule.getRiskWeight(), rule.getAction(), rule.getPriority());
            boolean match = true;
            
            for (RuleCondition cond : rule.getConditions()) {
                if (!cond.isActive()) {
                    log.trace("  Condition inactive: {}", cond.getType());
                    continue;
                }

                RuleEvaluator evaluator = ruleEvaluatorFactory.getEvaluator(cond.getType());
                log.trace("  Evaluating condition: {} with evaluator: {}", cond.getType(), (evaluator != null ? evaluator.getClass().getSimpleName() : "NULL"));

                if (evaluator == null || !evaluator.evaluate(input, cond)) {
                    log.trace("  Condition failed: {}", cond.getType());
                    match = false;
                    break;
                } else {
                    log.trace("  Condition passed: {}", cond.getType());
                }
            }

            if (match) {
                log.debug("  Rule MATCHED: {}", rule.getName());
                // Convert rule weight (0–100) → probability (0.0–1.0)
                double ruleProb = Math.min(1.0, Math.max(0.0, rule.getRiskWeight() / 100.0));
                survivalProb *= (1.0 - ruleProb); // Multiply survival probabilities

                String condSummary = rule.getConditions().stream()
                        .map(c -> c.getType() + " " + c.getOperator() + " " + c.getValue())
                        .reduce((a,b) -> a + "; " + b).orElse("");

                RuleExecutionLog entry = RuleExecutionLog.builder()
                        .rule(rule)
                        .transactionId(input.getTxId())
                        .matched(true)
                        .details("Rule triggered: " + rule.getName() +
                                 " | action=" + rule.getAction() +
                                 " | weight=" + rule.getRiskWeight() +
                                 " | priority=" + rule.getPriority() +
                                 (condSummary.isEmpty() ? "" : " | conditions=[" + condSummary + "]"))
                        .evaluatedAt(java.time.LocalDateTime.now())
                        .build();
                logs.add(entry);
                try { ruleExecutionLogRepository.save(entry); } catch (Exception e) { log.warn("Failed to persist RuleExecutionLog: {}", e.getMessage()); }

                matched.add(new RuleMatchDto(rule.getId(), rule.getName(), rule.getAction(), rule.getRiskWeight(), rule.getPriority()));

                log.info("Matched: {} action={} weight={} priority={}{}",
                        rule.getName(), rule.getAction(), rule.getRiskWeight(), rule.getPriority(),
                        condSummary.isEmpty() ? "" : " | " + condSummary);

                // Short-circuit if action is BLOCK
                if ("BLOCK".equalsIgnoreCase(rule.getAction())) {
                    blockTriggered = true;
                    log.info("  BLOCK action triggered by rule: {}. Short-circuiting further evaluation.", rule.getName());
                    break;
                }
            } else {
                log.trace("  Rule NOT matched: {}", rule.getName());
            }
        }

        // Final risk probability
        double combinedProb = 1.0 - survivalProb;
        int ruleEngineScore = (int) Math.round(combinedProb * 100);
        
        log.debug("Rule Engine Final Score: {} (Combined Prob: {})", ruleEngineScore, combinedProb);
        if (!matched.isEmpty()) {
            String summary = matched.stream().map(m -> m.getRuleName() + "[" + m.getAction() + ", w=" + m.getRiskWeight() + ", p=" + m.getPriority() + "]").reduce((a,b) -> a+", "+b).orElse("");
            log.info("Matched rules: {}", summary);
        } else {
            log.info("No rules matched.");
        }
        return new EvaluationResultDto(ruleEngineScore, logs, matched);
    }
}

