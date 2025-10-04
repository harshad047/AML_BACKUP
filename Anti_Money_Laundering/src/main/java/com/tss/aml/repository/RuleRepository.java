package com.tss.aml.repository;

import com.tss.aml.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {
    List<Rule> findByIsActiveTrueOrderByPriorityAsc();
    
    // Admin management methods
    List<Rule> findByIsActiveTrueOrderByRiskWeightDesc();
    List<Rule> findByIsActiveFalse();
    long countByIsActiveTrue();
}
