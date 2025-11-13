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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component("DAILY_TOTAL")
@RequiredArgsConstructor
public class DailyTotalEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;
    private static final Logger log = LoggerFactory.getLogger(DailyTotalEvaluator.class);

    // condition.type = DAILY_TOTAL
    // condition.field = "sum"
    // condition.operator applied to window SUM
    // condition.value = "threshold|windowHours|transactionTypes" (types can be ANY or comma-separated)
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            String[] parts = condition.getValue().split("\\|");
            if (parts.length < 3) {
                log.debug("DailyTotalEvaluator: invalid value format: {}", condition.getValue());
                return false;
            }
            BigDecimal threshold = new BigDecimal(parts[0].trim());
            int windowHours = Integer.parseInt(parts[1].trim());
            String typesStr = parts[2].trim().toUpperCase(Locale.ROOT);

            Long customerId = Long.parseLong(input.getCustomerId());
            LocalDateTime after = LocalDateTime.now().minusHours(windowHours);

            List<Transaction.TransactionType> types;
            if ("ANY".equals(typesStr)) {
                types = Arrays.asList(Transaction.TransactionType.values());
            } else {
                types = Arrays.stream(typesStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Transaction.TransactionType::valueOf)
                        .collect(Collectors.toList());
            }

            BigDecimal sum = transactionRepository.sumAmountsInWindow(customerId, after, types);
            boolean result = compare(sum, condition.getOperator(), threshold);
            log.debug("DailyTotalEvaluator: sum={} {} {} (windowHours={}, types={}) => {}", sum, condition.getOperator(), threshold, windowHours, typesStr, result);
            return result;
        } catch (Exception ex) {
            log.warn("DailyTotalEvaluator error: {}", ex.getMessage());
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

