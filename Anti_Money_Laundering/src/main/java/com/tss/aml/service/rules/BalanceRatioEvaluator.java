package com.tss.aml.service.rules;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.BankAccount;
import com.tss.aml.repository.BankAccountRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@RequiredArgsConstructor
public class BalanceRatioEvaluator implements RuleEvaluator {

    private final BankAccountRepository bankAccountRepository;
    private static final Logger log = LoggerFactory.getLogger(BalanceRatioEvaluator.class);

    // condition.type = AMOUNT_BALANCE_RATIO
    // condition.field unused
    // condition.operator: >, >=, etc. applied to ratio (amount/balance)
    // condition.value: decimal ratio threshold, e.g., "0.8"
    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        try {
            String accountNumber = resolvePrimaryAccountNumber(input);
            if (accountNumber == null) {
                log.debug("BalanceRatioEvaluator: no account number available for txType={}, returning false", input.getTransactionType());
                return false;
            }
            BankAccount acct = bankAccountRepository.findByAccountNumber(accountNumber)
                    .orElse(null);
            if (acct == null || acct.getBalance() == null || acct.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
                log.debug("BalanceRatioEvaluator: missing/zero balance for account {}", accountNumber);
                return false;
            }

            BigDecimal amount = input.getAmount();
            BigDecimal ratio = amount.divide(acct.getBalance(), 6, java.math.RoundingMode.HALF_UP);
            BigDecimal threshold = new BigDecimal(condition.getValue());

            boolean result = compare(ratio, condition.getOperator(), threshold);
            log.debug("BalanceRatioEvaluator: amount={} balance={} ratio={} {} {} => {}", amount, acct.getBalance(), ratio, condition.getOperator(), threshold, result);
            return result;
        } catch (Exception ex) {
            log.warn("BalanceRatioEvaluator error: {}", ex.getMessage());
            return false;
        }
    }

    private String resolvePrimaryAccountNumber(TransactionInputDto input) {
        if (input.getTransactionType() == Transaction.TransactionType.WITHDRAWAL || input.getTransactionType() == Transaction.TransactionType.TRANSFER) {
            return input.getFromAccountNumber();
        }
        if (input.getTransactionType() == Transaction.TransactionType.DEPOSIT) {
            return input.getToAccountNumber();
        }
        return null;
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

