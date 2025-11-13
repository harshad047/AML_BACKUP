package com.tss.aml.service.rules;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Component("STRUCTURING")
@RequiredArgsConstructor
public class StructuringEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;

    // condition conventions:
    // - condition.type = STRUCTURING
    // - condition.field = "sum"
    // - condition.operator = one of >, >=, ==, <, <= (applied to window SUM)
    // - condition.value = "maxSingle|maxWindowSum|windowHours|transactionTypes"
    //     e.g. "50000|300000|24|DEPOSIT" means: sum of DEPOSIT amounts < 50000 in last 24h >= 300000
    //     types can be "ANY" or comma list like "DEPOSIT,TRANSFER"
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            String[] parts = condition.getValue().split("\\|");
            if (parts.length < 4) {
                System.out.println("    StructuringEvaluator: invalid value format: " + condition.getValue());
                return false;
            }
            BigDecimal maxSingle = new BigDecimal(parts[0].trim());
            BigDecimal maxWindowSum = new BigDecimal(parts[1].trim());
            int windowHours = Integer.parseInt(parts[2].trim());
            String typesStr = parts[3].trim().toUpperCase(Locale.ROOT);

            Long customerId = Long.parseLong(input.getCustomerId());
            LocalDateTime after = LocalDateTime.now().minusHours(windowHours);

            List<Transaction.TransactionType> types;
            if ("ANY".equals(typesStr)) {
                types = Arrays.asList(Transaction.TransactionType.DEPOSIT, Transaction.TransactionType.TRANSFER);
            } else {
                types = Arrays.stream(typesStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Transaction.TransactionType::valueOf)
                        .collect(Collectors.toList());
            }

            BigDecimal sum = transactionRepository.sumAmountsBelowThresholdInWindow(customerId, maxSingle, after, types);
            boolean result = compare(sum, condition.getOperator(), maxWindowSum);
            System.out.println("    StructuringEvaluator: sum=" + sum + ", operator=" + condition.getOperator() +
                    ", threshold=" + maxWindowSum + ", maxSingle=" + maxSingle + ", windowHours=" + windowHours +
                    ", types=" + typesStr + " => " + result);
            return result;
        } catch (Exception ex) {
            System.out.println("    StructuringEvaluator error: " + ex.getMessage());
            return false;
        }
    }

    private boolean compare(BigDecimal actual, String operator, BigDecimal expected) {
        int cmp = actual.compareTo(expected);
        return switch (operator) {
            case ">" -> cmp > 0;
            case ">=" -> cmp >= 0;
            case "<" -> cmp < 0;
            case "<=" -> cmp <= 0;
            case "==" -> cmp == 0;
            default -> false;
        };
    }
}

