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
    
    // Find all active keywords
    List<SuspiciousKeyword> findByIsActiveTrueOrderByRiskScoreDesc();
    
    // Find by risk level
    List<SuspiciousKeyword> findByRiskLevelAndIsActiveTrueOrderByRiskScoreDesc(SuspiciousKeyword.RiskLevel riskLevel);
    
    // Find by category
    List<SuspiciousKeyword> findByCategoryAndIsActiveTrueOrderByRiskScoreDesc(String category);
    
    // Find by keyword (case-insensitive)
    Optional<SuspiciousKeyword> findByKeywordIgnoreCase(String keyword);
    
    // Find keywords with risk score above threshold
    @Query("SELECT sk FROM SuspiciousKeyword sk WHERE sk.riskScore >= :minScore AND sk.isActive = true ORDER BY sk.riskScore DESC")
    List<SuspiciousKeyword> findByRiskScoreGreaterThanEqualAndIsActiveTrue(@Param("minScore") Integer minScore);
    
    // Find all categories
    @Query("SELECT DISTINCT sk.category FROM SuspiciousKeyword sk WHERE sk.category IS NOT NULL AND sk.isActive = true ORDER BY sk.category")
    List<String> findDistinctCategories();
    
    // Count by risk level
    long countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel riskLevel);
    
    // Check if keyword exists
    boolean existsByKeywordIgnoreCase(String keyword);
}
