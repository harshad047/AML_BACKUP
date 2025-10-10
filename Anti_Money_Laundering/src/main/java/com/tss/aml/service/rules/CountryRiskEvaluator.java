package com.tss.aml.service.rules;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.CountryRisk;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.repository.CountryRiskRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@RequiredArgsConstructor
public class CountryRiskEvaluator implements RuleEvaluator {

    private final CountryRiskRepository countryRepo;
    private static final Logger log = LoggerFactory.getLogger(CountryRiskEvaluator.class);

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        CountryRisk cr = countryRepo.findByCountryCodeIgnoreCase(input.getCountryCode());
        if (cr == null) {
            log.debug("CountryRiskEvaluator: No country risk data for {}, returning false", input.getCountryCode());
            return false;
        }
        boolean result = compareNumber(cr.getRiskScore(), condition.getOperator(), condition.getValue());
        log.debug("CountryRiskEvaluator: {} risk={} {} {} = {}", input.getCountryCode(), cr.getRiskScore(), condition.getOperator(), condition.getValue(), result);
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

