package com.tss.aml.repository;

import com.tss.aml.entity.SuspiciousKeyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuspiciousKeywordRepository extends JpaRepository<SuspiciousKeyword, Long> {
    
    List<SuspiciousKeyword> findByIsActiveTrueOrderByRiskScoreDesc();
    
    List<SuspiciousKeyword> findByRiskLevelAndIsActiveTrueOrderByRiskScoreDesc(SuspiciousKeyword.RiskLevel riskLevel);
    
    List<SuspiciousKeyword> findByCategoryAndIsActiveTrueOrderByRiskScoreDesc(String category);
    
    Optional<SuspiciousKeyword> findByKeywordIgnoreCase(String keyword);
    
    @Query("SELECT sk FROM SuspiciousKeyword sk WHERE sk.riskScore >= :minScore AND sk.isActive = true ORDER BY sk.riskScore DESC")
    List<SuspiciousKeyword> findByRiskScoreGreaterThanEqualAndIsActiveTrue(@Param("minScore") Integer minScore);
    
    @Query("SELECT DISTINCT sk.category FROM SuspiciousKeyword sk WHERE sk.category IS NOT NULL AND sk.isActive = true ORDER BY sk.category")
    List<String> findDistinctCategories();
    
    long countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel riskLevel);
    
    boolean existsByKeywordIgnoreCase(String keyword);
}
