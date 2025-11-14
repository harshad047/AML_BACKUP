package com.tss.aml.service.rules;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.CountryRisk;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.repository.CountryRiskRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component("COUNTRY_RISK")
@RequiredArgsConstructor
public class CountryRiskEvaluator implements RuleEvaluator {

    private final CountryRiskRepository countryRepo;
    private static final Logger log = LoggerFactory.getLogger(CountryRiskEvaluator.class);

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        boolean hasSenderCountry = input.getSenderCountryCode() != null && !input.getSenderCountryCode().trim().isEmpty();
        boolean hasReceiverCountry = input.getCountryCode() != null && !input.getCountryCode().trim().isEmpty();
        
        if (hasSenderCountry && hasReceiverCountry) {
            CountryRisk senderRisk = countryRepo.findByCountryCodeIgnoreCase(input.getSenderCountryCode());
            CountryRisk receiverRisk = countryRepo.findByCountryCodeIgnoreCase(input.getCountryCode());
            
            if (senderRisk == null && receiverRisk == null) {
                log.debug("CountryRiskEvaluator: No country risk data for sender {} or receiver {}, returning false", 
                         input.getSenderCountryCode(), input.getCountryCode());
                return false;
            }
            
            boolean senderMatch = false;
            if (senderRisk != null) {
                senderMatch = compareNumber(senderRisk.getRiskScore(), condition.getOperator(), condition.getValue());
                log.debug("CountryRiskEvaluator [SENDER]: {} risk={} {} {} = {}", 
                         input.getSenderCountryCode(), senderRisk.getRiskScore(), 
                         condition.getOperator(), condition.getValue(), senderMatch);
            }
            
            boolean receiverMatch = false;
            if (receiverRisk != null) {
                receiverMatch = compareNumber(receiverRisk.getRiskScore(), condition.getOperator(), condition.getValue());
                log.debug("CountryRiskEvaluator [RECEIVER]: {} risk={} {} {} = {}", 
                         input.getCountryCode(), receiverRisk.getRiskScore(), 
                         condition.getOperator(), condition.getValue(), receiverMatch);
            }
            
            boolean result = senderMatch || receiverMatch;
            log.info("CountryRiskEvaluator [DUAL-CHECK]: Sender={} ({}), Receiver={} ({}), Result={}", 
                    input.getSenderCountryCode(), senderMatch, 
                    input.getCountryCode(), receiverMatch, result);
            return result;
        }
        
        CountryRisk cr = countryRepo.findByCountryCodeIgnoreCase(input.getCountryCode());
        if (cr == null) {
            log.debug("CountryRiskEvaluator: No country risk data for {}, returning false", input.getCountryCode());
            return false;
        }
        boolean result = compareNumber(cr.getRiskScore(), condition.getOperator(), condition.getValue());
        log.debug("CountryRiskEvaluator [SINGLE-CHECK]: {} risk={} {} {} = {}", 
                 input.getCountryCode(), cr.getRiskScore(), condition.getOperator(), condition.getValue(), result);
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

