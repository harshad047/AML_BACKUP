package com.tss.aml.service.rules;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;

@Component
public class AmountEvaluator implements RuleEvaluator {

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        boolean result = compareNumber(input.getAmount(), condition.getOperator(), condition.getValue());
        System.out.println("    AmountEvaluator: " + input.getAmount() + " " + condition.getOperator() + " " + condition.getValue() + " = " + result);
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
