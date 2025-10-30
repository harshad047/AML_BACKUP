package com.tss.aml.repository;

import com.tss.aml.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByFromAccountNumberOrToAccountNumberOrderByCreatedAtDesc(String fromAccountNumber, String toAccountNumber);
    List<Transaction> findByFromAccountNumberInOrToAccountNumberInOrderByCreatedAtDesc(List<String> fromAccountNumbers, List<String> toAccountNumbers);
    List<Transaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Transaction> findByCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(Long customerId, LocalDateTime createdAt);
    List<Transaction> findByFromAccountNumberOrderByCreatedAtDesc(String fromAccountNumber);
    List<Transaction> findByToAccountNumberOrderByCreatedAtDesc(String toAccountNumber);
    
    // Admin management methods
    List<Transaction> findAllByOrderByCreatedAtDesc();
    List<Transaction> findByStatusOrderByCreatedAtDesc(String status);
    List<Transaction> findByCombinedRiskScoreGreaterThanEqualOrderByCreatedAtDesc(Integer riskScore);
    long countByStatus(String status);
    long countByCombinedRiskScoreGreaterThanEqual(Integer riskScore);
    
    List<Transaction> findTop20ByCustomerIdOrderByCreatedAtDesc(Long customerId);

    // Velocity and frequency: count high-value transactions in a time window for a customer and type
    long countByCustomerIdAndTransactionTypeAndAmountGreaterThanEqualAndCreatedAtAfter(
            Long customerId,
            Transaction.TransactionType transactionType,
            java.math.BigDecimal amount,
            LocalDateTime createdAtAfter
    );

    // Mixed velocity across multiple transaction types
    long countByCustomerIdAndTransactionTypeInAndAmountGreaterThanEqualAndCreatedAtAfter(
            Long customerId,
            List<Transaction.TransactionType> transactionTypes,
            BigDecimal amount,
            LocalDateTime createdAtAfter
    );

    // Structuring: sum of amounts below a per-transaction threshold within a window and types
    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.customerId = :customerId and t.createdAt > :after and t.amount < :maxSingle and t.transactionType in :types")
    BigDecimal sumAmountsBelowThresholdInWindow(
            @Param("customerId") Long customerId,
            @Param("maxSingle") BigDecimal maxSingle,
            @Param("after") LocalDateTime after,
            @Param("types") List<Transaction.TransactionType> types
    );

    // Behavioral deviation: fetch historical amounts for percentile computation
    @Query("select t.amount from Transaction t where t.customerId = :customerId and t.createdAt > :after and t.createdAt < :before")
    List<BigDecimal> findHistoricalAmounts(
            @Param("customerId") Long customerId,
            @Param("after") LocalDateTime after,
            @Param("before") LocalDateTime before
    );
    


    // Daily total across types in a time window
    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.customerId = :customerId and t.createdAt > :after and t.transactionType in :types")
    BigDecimal sumAmountsInWindow(
            @Param("customerId") Long customerId,
            @Param("after") LocalDateTime after,
            @Param("types") List<Transaction.TransactionType> types
    );

    // New counterparty: count transactions to the same toAccountNumber in a window (optionally filter by types)
    @Query("select count(t) from Transaction t where t.customerId = :customerId and t.toAccountNumber = :toAcc and t.createdAt > :after and t.transactionType in :types")
    long countToCounterpartyInWindow(
            @Param("customerId") Long customerId,
            @Param("toAcc") String toAccountNumber,
            @Param("after") LocalDateTime after,
            @Param("types") List<Transaction.TransactionType> types
    );
}
