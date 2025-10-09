package com.tss.aml.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.repository.RuleRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RuleSeeder implements CommandLineRunner {

    private final RuleRepository ruleRepository;

    @Override
    public void run(String... args) throws Exception {
        var all = ruleRepository.findAll();

        // Velocity: repeated high-value deposits
        String velocityName = "High Value Deposit Velocity";
        boolean velocityExists = all.stream().anyMatch(r -> velocityName.equalsIgnoreCase(r.getName()));
        if (!velocityExists) {
            Rule rule = Rule.builder()
                    .name(velocityName)
                    .description("Flag when there are repeated high-value deposits within a short time window")
                    .priority(1)
                    .action("FLAG")
                    .riskWeight(80)
                    .isActive(true)
                    .build();

            RuleCondition velocity = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.VELOCITY)
                    .field("count")
                    .operator(">=")
                    // minAmount|minCount|windowHours|transactionType
                    .value("100000|3|24|DEPOSIT")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(velocity));
            ruleRepository.save(rule);
        }

        // Extreme velocity -> BLOCK
        String velocityBlockName = "Extreme High Value Velocity (BLOCK)";
        boolean velocityBlockExists = all.stream().anyMatch(r -> velocityBlockName.equalsIgnoreCase(r.getName()));
        if (!velocityBlockExists) {
            Rule rule = Rule.builder()
                    .name(velocityBlockName)
                    .description("Block when extreme count of high-value tx within window is reached")
                    .priority(0)
                    .action("BLOCK")
                    .riskWeight(100)
                    .isActive(true)
                    .build();

            RuleCondition velocityExtreme = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.VELOCITY)
                    .field("count")
                    .operator(">=")
                    // minAmount|minCount|windowHours|transactionType (ANY types)
                    .value("100000|5|24|ANY")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(velocityExtreme));
            ruleRepository.save(rule);
        }

        // Structuring: many small deposits/transfers whose sum exceeds threshold
        String structuringName = "Structuring Sum Over Window";
        boolean structuringExists = all.stream().anyMatch(r -> structuringName.equalsIgnoreCase(r.getName()));
        if (!structuringExists) {
            Rule rule = Rule.builder()
                    .name(structuringName)
                    .description("Flag when sum of small transactions over a window exceeds threshold (possible structuring)")
                    .priority(2)
                    .action("FLAG")
                    .riskWeight(85)
                    .isActive(true)
                    .build();

            RuleCondition structuring = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.STRUCTURING)
                    .field("sum")
                    .operator(">=")
                    // maxSingle|maxWindowSum|windowHours|transactionTypes
                    .value("50000|300000|24|DEPOSIT,TRANSFER")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(structuring));
            ruleRepository.save(rule);
        }

        // Behavioral deviation: amount > 95th percentile of last 90 days
        String behaviorName = "Behavioral Deviation High Amount";
        boolean behaviorExists = all.stream().anyMatch(r -> behaviorName.equalsIgnoreCase(r.getName()));
        if (!behaviorExists) {
            Rule rule = Rule.builder()
                    .name(behaviorName)
                    .description("Flag when current amount exceeds user's 95th percentile over 90 days")
                    .priority(3)
                    .action("FLAG")
                    .riskWeight(70)
                    .isActive(true)
                    .build();

            RuleCondition deviation = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.BEHAVIORAL_DEVIATION)
                    .field("amount_percentile")
                    .operator(">=")
                    // lookbackDays|percentile
                    .value("90|95")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(deviation));
            ruleRepository.save(rule);
        }

        // Balance impact ratio: amount >= 80% of balance
        String balanceImpactName = "High Balance Impact Ratio";
        boolean balanceImpactExists = all.stream().anyMatch(r -> balanceImpactName.equalsIgnoreCase(r.getName()));
        if (!balanceImpactExists) {
            Rule rule = Rule.builder()
                    .name(balanceImpactName)
                    .description("Flag when transaction amount is a large share of account balance")
                    .priority(2)
                    .action("FLAG")
                    .riskWeight(70)
                    .isActive(true)
                    .build();

            RuleCondition ratio = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.AMOUNT_BALANCE_RATIO)
                    .field("ratio")
                    .operator(">=")
                    .value("0.8")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(ratio));
            ruleRepository.save(rule);
        }

        // Daily total across deposits/transfers >= 400000 in 24h
        String dailyTotalName = "Daily Total Threshold";
        boolean dailyTotalExists = all.stream().anyMatch(r -> dailyTotalName.equalsIgnoreCase(r.getName()));
        if (!dailyTotalExists) {
            Rule rule = Rule.builder()
                    .name(dailyTotalName)
                    .description("Flag when cumulative amount in window exceeds threshold")
                    .priority(2)
                    .action("FLAG")
                    .riskWeight(75)
                    .isActive(true)
                    .build();

            RuleCondition total = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.DAILY_TOTAL)
                    .field("sum")
                    .operator(">=")
                    .value("400000|24|DEPOSIT,TRANSFER")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(total));
            ruleRepository.save(rule);
        }

        // New counterparty + high amount
        String newCpName = "New Counterparty High Amount";
        boolean newCpExists = all.stream().anyMatch(r -> newCpName.equalsIgnoreCase(r.getName()));
        if (!newCpExists) {
            Rule rule = Rule.builder()
                    .name(newCpName)
                    .description("Flag high-value transfer to a first-time beneficiary in lookback window")
                    .priority(2)
                    .action("FLAG")
                    .riskWeight(70)
                    .isActive(true)
                    .build();

            RuleCondition newCp = RuleCondition.builder()
                    .rule(rule)
                    .type(RuleCondition.ConditionType.NEW_COUNTERPARTY)
                    .field("first_time")
                    .operator(">=")
                    .value("30|50000|TRANSFER")
                    .isActive(true)
                    .build();

            rule.setConditions(List.of(newCp));
            ruleRepository.save(rule);
        }
    }
}
