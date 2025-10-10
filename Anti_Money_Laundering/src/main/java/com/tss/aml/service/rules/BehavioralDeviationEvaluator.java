package com.tss.aml.service.rules;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BehavioralDeviationEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;

    // condition conventions:
    // - condition.type = BEHAVIORAL_DEVIATION
    // - condition.field = "amount_percentile"
    // - condition.operator = one of >, >= (current amount vs percentile amount)
    // - condition.value = "lookbackDays|percentile"
    //   e.g. "90|95" means: current amount >= 95th percentile of user's amounts over last 90 days
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            String[] parts = condition.getValue().split("\\|");
            if (parts.length < 2) {
                System.out.println("    BehavioralDeviationEvaluator: invalid value format: " + condition.getValue());
                return false;
            }
            int lookbackDays = Integer.parseInt(parts[0].trim());
            int percentile = Integer.parseInt(parts[1].trim());

            Long customerId = Long.parseLong(input.getCustomerId());
            LocalDateTime after = LocalDateTime.now().minusDays(lookbackDays);
            LocalDateTime before = LocalDateTime.now();

            List<BigDecimal> amounts = transactionRepository.findHistoricalAmounts(customerId, after, before);
            if (amounts.isEmpty()) {
                System.out.println("    BehavioralDeviationEvaluator: no history, returning false");
                return false;
            }
            Collections.sort(amounts);

            BigDecimal percentileValue = computePercentile(amounts, percentile);
            int cmp = input.getAmount().compareTo(percentileValue);
            boolean result = switch (condition.getOperator()) {
                case ">" -> cmp > 0;
                case ">=" -> cmp >= 0;
                case "==" -> cmp == 0;
                case "<" -> cmp < 0;
                case "<=" -> cmp <= 0;
                default -> false;
            };

            System.out.println("    BehavioralDeviationEvaluator: current=" + input.getAmount() + 
                ", percentile(" + percentile + ")=" + percentileValue + 
                ", operator=" + condition.getOperator() + " => " + result);
            return result;
        } catch (Exception ex) {
            System.out.println("    BehavioralDeviationEvaluator error: " + ex.getMessage());
            return false;
        }
    }

    private BigDecimal computePercentile(List<BigDecimal> sorted, int percentile) {
        if (sorted.isEmpty()) return BigDecimal.ZERO;
        double rank = Math.ceil((percentile / 100.0) * sorted.size());
        int index = Math.min(Math.max((int)rank - 1, 0), sorted.size() - 1);
        return sorted.get(index);
    }
}

