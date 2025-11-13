package com.tss.aml.repository;

import com.tss.aml.entity.CountryRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CountryRiskRepository extends JpaRepository<CountryRisk, Long> {
    
    Optional<CountryRisk> findByCountryCode(String countryCode);
    
    CountryRisk findByCountryCodeIgnoreCase(String countryCode);
    
    List<CountryRisk> findByRiskScoreGreaterThanEqualOrderByRiskScoreDesc(Integer riskScore);
    
    List<CountryRisk> findByRiskScoreBetweenOrderByRiskScoreDesc(Integer minScore, Integer maxScore);
    
    List<CountryRisk> findByCountryNameContainingIgnoreCase(String countryName);
    
    Optional<CountryRisk> findByCountryNameIgnoreCase(String countryName);
    
    boolean existsByCountryCode(String countryCode);
    
    long countByRiskScoreGreaterThanEqual(Integer riskScore);
    
    List<CountryRisk> findAllByOrderByRiskScoreDesc();
}
