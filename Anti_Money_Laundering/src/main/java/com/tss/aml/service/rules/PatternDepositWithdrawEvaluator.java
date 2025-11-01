//package com.tss.aml.service.rules;
//
//import com.tss.aml.dto.transaction.TransactionInputDto;
//import com.tss.aml.entity.RuleCondition;
//import com.tss.aml.entity.Transaction;
//import com.tss.aml.repository.TransactionRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Component;
//
//import java.math.BigDecimal;
//import java.util.Comparator;
//import java.util.List;
//
//@Component
//@RequiredArgsConstructor
//public class PatternDepositWithdrawEvaluator implements RuleEvaluator {
//
//    private final TransactionRepository transactionRepository;
//
//    @Override
//    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
//
//        // --- Step 1: Parse parameters from rule_condition.value ---
//        int consecutiveCount;
//        BigDecimal amountMultiplier;
//
//        try {
//            String[] params = condition.getValue().split("\\|"); // Example: "3|1.0"
//            if (params.length != 2) return false;
//            consecutiveCount = Integer.parseInt(params[0]);
//            amountMultiplier = new BigDecimal(params[1]);
//        } catch (Exception e) {
//            return false; // Malformed condition value
//        }
//
//        // --- Step 2: Parse customer ID ---
//        Long customerId;
//        try {
//            customerId = Long.parseLong(input.getCustomerId());
//        } catch (NumberFormatException e) {
//            return false;
//        }
//
//        // --- Step 3: Fetch recent transactions ---
//        List<Transaction> recentTransactions =
//                transactionRepository.findTop20ByCustomerIdOrderByCreatedAtDesc(customerId);
//
//        // Sort chronologically
//        recentTransactions.sort(Comparator.comparing(Transaction::getCreatedAt));
//
//        if (recentTransactions.size() < consecutiveCount) {
//            return false;
//        }
//
//        // --- Step 4: Detect continuous deposit or withdrawal pattern ---
//        int depositStreak = 0;
//        int withdrawStreak = 0;
//
//        for (Transaction t : recentTransactions) {
//            if (t.getTransactionType() == Transaction.TransactionType.DEPOSIT) {
//                depositStreak++;
//                withdrawStreak = 0;
//            } else if (t.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {
//                withdrawStreak++;
//                depositStreak = 0;
//            } else {
//                depositStreak = 0;
//                withdrawStreak = 0;
//            }
//
//            // ✅ Flag only when streak completes (not before)
//            if (depositStreak == consecutiveCount &&
//                t.getTransactionType() == Transaction.TransactionType.DEPOSIT) {
//                return true;
//            }
//
//            if (withdrawStreak == consecutiveCount &&
//                t.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {
//                return true;
//            }
//        }
//
//        // --- Step 5: Detect deposit immediately followed by large withdrawal ---
//        for (int i = 1; i < recentTransactions.size(); i++) {
//            Transaction previous = recentTransactions.get(i - 1);
//            Transaction current = recentTransactions.get(i);
//
//            if (previous.getTransactionType() == Transaction.TransactionType.DEPOSIT &&
//                current.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {
//
//                BigDecimal requiredAmount = previous.getAmount().multiply(amountMultiplier);
//
//                // ✅ Flag only if withdrawal ≥ deposit × multiplier
//                if (current.getAmount().compareTo(requiredAmount) >= 0) {
//                    return true;
//                }
//            }
//        }
//
//        return false;
//    }
//}

package com.tss.aml.service.rules;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PatternDepositWithdrawEvaluator implements RuleEvaluator {

    private final TransactionRepository transactionRepository;

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {

        // --- Step 1: Parse parameters from rule_condition.value ---
        int requiredPairs;
        BigDecimal amountMultiplier;

        try {
            String[] params = condition.getValue().split("\\|"); // Example: "3|1.0"
            if (params.length != 2) return false;
            requiredPairs = Integer.parseInt(params[0]);
            amountMultiplier = new BigDecimal(params[1]);
        } catch (Exception e) {
            return false;
        }

        // --- Step 2: Parse customer ID ---
        Long customerId;
        try {
            customerId = Long.parseLong(input.getCustomerId());
        } catch (NumberFormatException e) {
            return false;
        }

        // --- Step 3: Get transactions within the last 24 hours ---
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Transaction> recentTransactions =
                transactionRepository.findByCustomerIdAndCreatedAtAfterOrderByCreatedAtAsc(customerId, cutoff);

        if (recentTransactions.size() < 2) {
            return false;
        }

        // --- Step 4: Detect deposit-withdraw pairs within 24h ---
        int pairCount = 0;

        for (int i = 1; i < recentTransactions.size(); i++) {
            Transaction previous = recentTransactions.get(i - 1);
            Transaction current = recentTransactions.get(i);

            // Deposit followed by withdrawal within 24h
            if (previous.getTransactionType() == Transaction.TransactionType.DEPOSIT &&
                current.getTransactionType() == Transaction.TransactionType.WITHDRAWAL) {

                BigDecimal minWithdrawAmount = previous.getAmount().multiply(amountMultiplier);

                if (current.getAmount().compareTo(minWithdrawAmount) >= 0) {
                    pairCount++;
                }
            }
        }

        // --- Step 5: Flag if pattern threshold reached ---
        if (pairCount >= requiredPairs) {
            // This means the next transaction (after 3 pairs) is suspicious
            return true;
        }

        return false;
    }
}
