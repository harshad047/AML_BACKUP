package com.tss.aml.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.RuleExecutionLog;

@Repository
public interface RuleExecutionLogRepository extends JpaRepository<RuleExecutionLog, Long> {
}
