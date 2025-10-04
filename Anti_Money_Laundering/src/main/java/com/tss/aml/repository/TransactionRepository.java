package com.tss.aml.repository;

import com.tss.aml.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

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
}
