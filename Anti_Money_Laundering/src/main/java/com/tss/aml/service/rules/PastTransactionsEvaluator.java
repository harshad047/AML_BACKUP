package com.tss.aml.service.rules;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PastTransactionsEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        // Convert customerId string to Long
        Long customerId;
        try {
            customerId = Long.parseLong(input.getCustomerId());
        } catch (NumberFormatException e) {
            return false;
        }

        int lookbackDays = 30; // default
        String thresholdStr = null;

        // Try to parse condition.getValue()
        String value = condition.getValue().trim();
        String[] parts = value.split("\\|");

        try {
            if (parts.length == 2) {
                // Old format: "lookbackDays|threshold"
                lookbackDays = Integer.parseInt(parts[0].trim());
                thresholdStr = parts[1].trim();
            } else if ("count".equalsIgnoreCase(condition.getField())) {
                // For count rule, interpret value as lookbackDays
                lookbackDays = Integer.parseInt(value);
                thresholdStr = "0"; // default threshold (compare count to 0)
            } else if ("sum".equalsIgnoreCase(condition.getField())) {
                // For sum rule, interpret value as threshold amount
                thresholdStr = value;
                lookbackDays = 30; // default lookback window
            }
        } catch (NumberFormatException e) {
            System.out.println("PastTransactionsEvaluator: invalid value format: " + value);
            return false;
        }

        // Get past transactions for this customer
        LocalDateTime lookbackTime = LocalDateTime.now().minusDays(lookbackDays);
        List<Transaction> pastTransactions = transactionRepository
                .findByCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(customerId, lookbackTime);

        // Evaluate rule
        if ("count".equalsIgnoreCase(condition.getField())) {
            int count = pastTransactions.size();
            boolean result = compareNumber(count, condition.getOperator(), thresholdStr);
            System.out.printf(
                    "PastTransactionsEvaluator (count): %d %s %s = %b (lookback: %d days)%n",
                    count, condition.getOperator(), thresholdStr, result, lookbackDays
            );
            return result;
        } else if ("sum".equalsIgnoreCase(condition.getField())) {
            BigDecimal totalAmount = pastTransactions.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            boolean result = compareNumber(totalAmount, condition.getOperator(), thresholdStr);
            System.out.printf(
                    "PastTransactionsEvaluator (sum): %s %s %s = %b (lookback: %d days)%n",
                    totalAmount, condition.getOperator(), thresholdStr, result, lookbackDays
            );
            return result;
        }

        return false;
    }

    private boolean compareNumber(Number actual, String operator, String expectedStr) {
        if (actual == null) return false;
        try {
            BigDecimal actualVal = new BigDecimal(actual.toString());
            BigDecimal expected = new BigDecimal(expectedStr);
            int comparison = actualVal.compareTo(expected);

            return switch (operator) {
                case ">" -> comparison > 0;
                case ">=" -> comparison >= 0;
                case "<" -> comparison < 0;
                case "<=" -> comparison <= 0;
                case "==" -> comparison == 0;
                default -> false;
            };
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
