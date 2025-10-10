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
            // If customerId is not a valid number, return false
            return false;
        }
        
        // Get past transactions for this customer (last 7 days)
        LocalDateTime lookbackTime = LocalDateTime.now().minusDays(7);
        List<Transaction> pastTransactions = transactionRepository.findByCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(
                customerId, 
                lookbackTime
        );

        if ("count".equalsIgnoreCase(condition.getField())) {
            boolean result = compareNumber(pastTransactions.size(), condition.getOperator(), condition.getValue());
            System.out.println("    PastTransactionsEvaluator (count): " + pastTransactions.size() + " " + condition.getOperator() + " " + condition.getValue() + " = " + result);
            return result;
        } else if ("sum".equalsIgnoreCase(condition.getField())) {
            BigDecimal totalAmount = pastTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            boolean result = compareNumber(totalAmount, condition.getOperator(), condition.getValue());
            System.out.println("    PastTransactionsEvaluator (sum): " + totalAmount + " " + condition.getOperator() + " " + condition.getValue() + " = " + result);
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

