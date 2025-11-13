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

@Component("PATTERN_DEPOSIT_WITHDRAW")
@RequiredArgsConstructor
public class PatternDepositWithdrawEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {

        int requiredPairs;
        BigDecimal amountMultiplier;

        try {
            String[] params = condition.getValue().split("\\|"); 
            if (params.length != 2) return false;
            requiredPairs = Integer.parseInt(params[0]);
            amountMultiplier = new BigDecimal(params[1]);
        } catch (Exception e) {
            return false;
        }

        Long customerId;
        try {
            customerId = Long.parseLong(input.getCustomerId());
        } catch (NumberFormatException e) {
            return false;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Transaction> recentTransactions =
                transactionRepository.findByCustomerIdAndCreatedAtAfterOrderByCreatedAtAsc(customerId, cutoff);

        if (recentTransactions.size() < 2) {
            return false;
        }

        int pairCount = 0;

        for (int i = 1; i < recentTransactions.size(); i++) {
            Transaction previous = recentTransactions.get(i - 1);
            Transaction current = recentTransactions.get(i);

            if (previous.getTransactionType() == Transaction.TransactionType.DEPOSIT &&
                current.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {

                BigDecimal minWithdrawAmount = previous.getAmount().multiply(amountMultiplier);

                if (current.getAmount().compareTo(minWithdrawAmount) >= 0) {
                    pairCount++;
                }
            }
        }

        if (pairCount >= requiredPairs) {
            return true;
        }

        return false;
    }
}
