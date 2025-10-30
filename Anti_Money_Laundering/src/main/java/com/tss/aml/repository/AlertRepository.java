package com.tss.aml.repository;

import com.tss.aml.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByTransactionId(Long transactionId);
    List<Alert> findByTransactionIdIn(List<Long> transactionIds);
    List<Alert> findByStatus(Alert.AlertStatus status);
    long countByTransactionIdIn(List<Long> transactionIds);
}
