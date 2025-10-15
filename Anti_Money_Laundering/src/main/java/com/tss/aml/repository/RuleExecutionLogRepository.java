package com.tss.aml.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.RuleExecutionLog;
import java.util.List;

@Repository
public interface RuleExecutionLogRepository extends JpaRepository<RuleExecutionLog, Long> {

    /**
     * Find all rule execution logs for a specific transaction that matched (obstructed)
     */
    List<RuleExecutionLog> findByTransactionIdAndMatchedTrueOrderByEvaluatedAtDesc(String transactionId);

    /**
     * Find all rule execution logs for a specific transaction
     */
    List<RuleExecutionLog> findByTransactionIdOrderByEvaluatedAtDesc(String transactionId);
}
