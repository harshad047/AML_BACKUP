package com.tss.aml.repository;

import com.tss.aml.entity.CountryRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRiskRepository extends JpaRepository<CountryRisk, Long> {
    
    // Find by country code
    Optional<CountryRisk> findByCountryCode(String countryCode);
    
    // Find by country code (for backward compatibility)
    CountryRisk findByCountryCodeIgnoreCase(String countryCode);
    
    // Find high-risk countries
    List<CountryRisk> findByRiskScoreGreaterThanEqualOrderByRiskScoreDesc(Integer riskScore);
    
    // Find by risk score range
    List<CountryRisk> findByRiskScoreBetweenOrderByRiskScoreDesc(Integer minScore, Integer maxScore);
    
    // Find by country name
    List<CountryRisk> findByCountryNameContainingIgnoreCase(String countryName);
    
    // Find by exact country name match (case insensitive)
    Optional<CountryRisk> findByCountryNameIgnoreCase(String countryName);
    
    // Check if country code exists
    boolean existsByCountryCode(String countryCode);
    
    // Count by risk level
    long countByRiskScoreGreaterThanEqual(Integer riskScore);
    
    // Find all ordered by risk score
    List<CountryRisk> findAllByOrderByRiskScoreDesc();
}
