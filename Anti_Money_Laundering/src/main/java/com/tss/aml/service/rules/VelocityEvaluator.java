package com.tss.aml.service.rules;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@RequiredArgsConstructor
public class VelocityEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;
    private static final Logger log = LoggerFactory.getLogger(VelocityEvaluator.class);

    // condition conventions:
    // - condition.type = VELOCITY
    // - condition.field = "count" (we compare observed count to threshold)
    // - condition.operator = one of >, >=, ==, <, <=
    // - condition.value = "minAmount|minCount|windowHours|transactionType"
    //     e.g. "100000|3|24|DEPOSIT" means: at least 3 deposits >= 100000 in last 24 hours
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            String[] parts = condition.getValue().split("\\|");
            if (parts.length < 4) {
                log.debug("VelocityEvaluator: invalid value format: {}", condition.getValue());
                return false;
            }
            BigDecimal minAmount = new BigDecimal(parts[0].trim());
            int minCount = Integer.parseInt(parts[1].trim());
            int windowHours = Integer.parseInt(parts[2].trim());
            String txTypeStr = parts[3].trim().toUpperCase(Locale.ROOT);

            Long customerId = Long.parseLong(input.getCustomerId());
            LocalDateTime after = LocalDateTime.now().minusHours(windowHours);

            long observed;
            if ("ANY".equals(txTypeStr)) {
                List<Transaction.TransactionType> types = Arrays.asList(
                    Transaction.TransactionType.DEPOSIT,
                    Transaction.TransactionType.TRANSFER
                );
                observed = transactionRepository
                    .countByCustomerIdAndTransactionTypeInAndAmountGreaterThanEqualAndCreatedAtAfter(
                        customerId, types, minAmount, after);
            } else if (txTypeStr.contains(",")) {
                List<Transaction.TransactionType> types = Arrays.stream(txTypeStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Transaction.TransactionType::valueOf)
                    .collect(Collectors.toList());
                observed = transactionRepository
                    .countByCustomerIdAndTransactionTypeInAndAmountGreaterThanEqualAndCreatedAtAfter(
                        customerId, types, minAmount, after);
            } else {
                Transaction.TransactionType txType = Transaction.TransactionType.valueOf(txTypeStr);
                observed = transactionRepository
                    .countByCustomerIdAndTransactionTypeAndAmountGreaterThanEqualAndCreatedAtAfter(
                        customerId, txType, minAmount, after);
            }

            boolean result = compareNumber(observed, condition.getOperator(), minCount);
            log.debug("VelocityEvaluator: observed={}, operator={}, threshold={}, minAmount={}, windowHours={}, types={} => {}",
                    observed, condition.getOperator(), minCount, minAmount, windowHours, txTypeStr, result);
            return result;
        } catch (Exception ex) {
            log.warn("VelocityEvaluator error: {}", ex.getMessage());
            return false;
        }
    }

    private boolean compareNumber(long actual, String operator, int expected) {
        return switch (operator) {
            case ">" -> actual > expected;
            case ">=" -> actual >= expected;
            case "<" -> actual < expected;
            case "<=" -> actual <= expected;
            case "==" -> actual == expected;
            default -> false;
        };
    }
}
