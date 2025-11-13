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

@Component("NEW_COUNTERPARTY")
@RequiredArgsConstructor
public class NewCounterpartyEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;
    private static final Logger log = LoggerFactory.getLogger(NewCounterpartyEvaluator.class);

    // condition.type = NEW_COUNTERPARTY
    // condition.field unused
    // condition.operator applied to amount comparison (>=)
    // condition.value = "lookbackDays|minAmount|transactionTypes"
    //   e.g. "30|50000|TRANSFER" or "30|25000|DEPOSIT,TRANSFER"
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            if (input.getToAccountNumber() == null || input.getToAccountNumber().isEmpty()) {
                log.debug("NewCounterpartyEvaluator: toAccountNumber missing, returning false");
                return false;
            }
            String[] parts = condition.getValue().split("\\|");
            if (parts.length < 3) {
                log.debug("NewCounterpartyEvaluator: invalid value format: {}", condition.getValue());
                return false;
            }
            int lookbackDays = Integer.parseInt(parts[0].trim());
            BigDecimal minAmount = new BigDecimal(parts[1].trim());
            String typesStr = parts[2].trim().toUpperCase(Locale.ROOT);

            if (input.getAmount().compareTo(minAmount) < 0) {
                return false;
            }

            Long customerId = Long.parseLong(input.getCustomerId());
            LocalDateTime after = LocalDateTime.now().minusDays(lookbackDays);

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

            long priorCount = transactionRepository.countToCounterpartyInWindow(
                    customerId,
                    input.getToAccountNumber(),
                    after,
                    types
            );
            
            log.info(
                "Evaluating NEW_COUNTERPARTY: customerId={}, toAcc={}, after={}, types={}, priorCount={}, amount={}, minAmount={}",
                customerId,
                input.getToAccountNumber(),
                after,
                types,
                priorCount,
                input.getAmount(),
                minAmount
            );

            boolean result = priorCount == 0;
            log.debug("NewCounterpartyEvaluator: priorCount={} (lookbackDays={}), minAmount={}, types={} => {}",
                    priorCount, lookbackDays, minAmount, typesStr, result);
            return result;
        } catch (Exception ex) {
            log.warn("NewCounterpartyEvaluator error: {}", ex.getMessage());
            return false;
        }
    }
}

