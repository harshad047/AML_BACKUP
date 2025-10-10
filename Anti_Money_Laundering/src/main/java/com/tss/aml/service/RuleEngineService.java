package com.tss.aml.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
        List<RuleMatchDto> flaggedRules = new ArrayList<>();
        List<RuleMatchDto> blockedRules = new ArrayList<>();
        double combinedRiskScore = 0.0;

        for (Rule rule : rules) {
            log.debug("Evaluating rule: {} (Weight: {}, Action: {}, Priority: {})",
                    rule.getName(), rule.getRiskWeight(), rule.getAction(), rule.getPriority());

            boolean ruleMatched = true;
            List<String> conditionResults = new ArrayList<>();

            for (RuleCondition cond : rule.getConditions()) {
                if (!cond.isActive()) {
                    log.trace("  Condition inactive: {}", cond.getType());
                    continue;
                }

                RuleEvaluator evaluator = ruleEvaluatorFactory.getEvaluator(cond.getType());
                if (evaluator == null) {
                    log.warn("No evaluator found for condition type: {}", cond.getType());
                    ruleMatched = false;
                    break;
                }

                boolean condResult = evaluator.evaluate(input, cond);
                conditionResults.add(cond.getType() + " " + cond.getOperator() + " " + cond.getValue() + " => " + condResult);

                if (!condResult) {
                    ruleMatched = false;
                    break; // AND logic: one false condition fails the rule
                }
            }

            if (ruleMatched) {
                log.info("  Rule MATCHED: {}", rule.getName());

                // Convert risk weight to probability (0.0 - 1.0)
                double ruleProb = Math.min(1.0, Math.max(0.0, rule.getRiskWeight() / 100.0));

                // Aggregate using weighted sum approach capped at 100
                combinedRiskScore += ruleProb * 100.0;
                combinedRiskScore = Math.min(combinedRiskScore, 100);

                RuleExecutionLog entry = RuleExecutionLog.builder()
                        .rule(rule)
                        .transactionId(input.getTxId())
                        .matched(true)
                        .details("Rule triggered: " + rule.getName() +
                                 " | action=" + rule.getAction() +
                                 " | weight=" + rule.getRiskWeight() +
                                 " | priority=" + rule.getPriority() +
                                 " | conditions=" + String.join("; ", conditionResults))
                        .evaluatedAt(java.time.LocalDateTime.now())
                        .build();
                logs.add(entry);
                try { ruleExecutionLogRepository.save(entry); } catch (Exception e) { log.warn("Failed to persist RuleExecutionLog: {}", e.getMessage()); }

                RuleMatchDto matchDto = new RuleMatchDto(
                        rule.getId(),
                        rule.getName(),
                        rule.getAction(),
                        rule.getRiskWeight(),
                        rule.getPriority()
                );

                if ("BLOCK".equalsIgnoreCase(rule.getAction())) {
                    blockedRules.add(matchDto);
                    log.info("  BLOCK action triggered. Short-circuiting further evaluation.");
                    break; // Stop evaluating further rules
                } else {
                    flaggedRules.add(matchDto);
                }

            } else {
                log.trace("  Rule NOT matched: {}", rule.getName());
            }
        }

        log.info("Rule Engine Final Score: {}", combinedRiskScore);
        if (!flaggedRules.isEmpty() || !blockedRules.isEmpty()) {
            String summary = flaggedRules.stream().map(r -> r.getRuleName() + "[FLAG]").collect(Collectors.joining(", "));
            String blockSummary = blockedRules.stream().map(r -> r.getRuleName() + "[BLOCK]").collect(Collectors.joining(", "));
            log.info("Matched FLAG rules: {}", summary);
            log.info("Matched BLOCK rules: {}", blockSummary);
        } else {
            log.info("No rules matched.");
        }

        List<RuleMatchDto> allMatches = new ArrayList<>();
        allMatches.addAll(flaggedRules);
        allMatches.addAll(blockedRules);

        return new EvaluationResultDto((int) Math.round(combinedRiskScore), logs, allMatches);
    }
}