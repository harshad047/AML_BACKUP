package com.tss.aml.service.rules;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component("AMOUNT")
public class AmountEvaluator implements RuleEvaluator {

    private static final Logger log = LoggerFactory.getLogger(AmountEvaluator.class);

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        boolean result = compareNumber(input.getAmount(), condition.getOperator(), condition.getValue());
        log.debug("AmountEvaluator: {} {} {} = {}", input.getAmount(), condition.getOperator(), condition.getValue(), result);
        return result;
    }

    private boolean compareNumber(Number actual, String operator, String expectedStr) {
        if (actual == null) return false;
        try {
            double actualVal = actual.doubleValue();
            double expected = Double.parseDouble(expectedStr);
            return switch (operator) {
                case ">" -> actualVal > expected;
                case ">=" -> actualVal >= expected;
                case "<" -> actualVal < expected;
                case "<=" -> actualVal <= expected;
                case "==" -> Math.abs(actualVal - expected) < 1e-6;
                default -> false;
            };
        } catch (NumberFormatException e) {
            return false;
        }
    }
}

