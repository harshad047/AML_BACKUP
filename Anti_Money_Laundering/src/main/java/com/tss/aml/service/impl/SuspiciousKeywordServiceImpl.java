package com.tss.aml.service.impl;

import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.exception.AmlApiException;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuspiciousKeywordServiceImpl {

    private final SuspiciousKeywordRepository suspiciousKeywordRepository;

    /**
     * Get all active suspicious keywords
     */
    public List<SuspiciousKeyword> getAllActiveKeywords() {
        return suspiciousKeywordRepository.findByIsActiveTrueOrderByRiskScoreDesc();
    }

    /**
     * Get keywords by risk level
     */
    public List<SuspiciousKeyword> getKeywordsByRiskLevel(SuspiciousKeyword.RiskLevel riskLevel) {
        return suspiciousKeywordRepository.findByRiskLevelAndIsActiveTrueOrderByRiskScoreDesc(riskLevel);
    }

    /**
     * Get keywords by category
     */
    public List<SuspiciousKeyword> getKeywordsByCategory(String category) {
        return suspiciousKeywordRepository.findByCategoryAndIsActiveTrueOrderByRiskScoreDesc(category);
    }

    /**
     * Add a new suspicious keyword
     */
    @Transactional
    public SuspiciousKeyword addKeyword(SuspiciousKeyword keyword) {
        // Check if keyword already exists
        if (suspiciousKeywordRepository.existsByKeywordIgnoreCase(keyword.getKeyword())) {
            throw new AmlApiException(HttpStatus.CONFLICT, "Keyword already exists: " + keyword.getKeyword());
        }

        // Validate risk score matches risk level
        validateRiskScoreAndLevel(keyword.getRiskScore(), keyword.getRiskLevel());

        return suspiciousKeywordRepository.save(keyword);
    }

    /**
     * Update an existing suspicious keyword
     */
    @Transactional
    public SuspiciousKeyword updateKeyword(Long id, SuspiciousKeyword updatedKeyword) {
        SuspiciousKeyword existingKeyword = suspiciousKeywordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SuspiciousKeyword", "id", id));

        // Check if new keyword conflicts with existing one (excluding current)
        if (!existingKeyword.getKeyword().equalsIgnoreCase(updatedKeyword.getKeyword()) &&
            suspiciousKeywordRepository.existsByKeywordIgnoreCase(updatedKeyword.getKeyword())) {
            throw new AmlApiException(HttpStatus.CONFLICT, "Keyword already exists: " + updatedKeyword.getKeyword());
        }

        // Validate risk score matches risk level
        validateRiskScoreAndLevel(updatedKeyword.getRiskScore(), updatedKeyword.getRiskLevel());

        // Update fields
        existingKeyword.setKeyword(updatedKeyword.getKeyword());
        existingKeyword.setRiskLevel(updatedKeyword.getRiskLevel());
        existingKeyword.setRiskScore(updatedKeyword.getRiskScore());
        existingKeyword.setCategory(updatedKeyword.getCategory());
        existingKeyword.setDescription(updatedKeyword.getDescription());
        existingKeyword.setCaseSensitive(updatedKeyword.isCaseSensitive());
        existingKeyword.setWholeWordOnly(updatedKeyword.isWholeWordOnly());
        existingKeyword.setUpdatedBy(updatedKeyword.getUpdatedBy());

        return suspiciousKeywordRepository.save(existingKeyword);
    }

    /**
     * Deactivate a suspicious keyword
     */
    @Transactional
    public void deactivateKeyword(Long id, String deactivatedBy) {
        SuspiciousKeyword keyword = suspiciousKeywordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SuspiciousKeyword", "id", id));

        keyword.setActive(false);
        keyword.setUpdatedBy(deactivatedBy);
        suspiciousKeywordRepository.save(keyword);
    }

    
    @Transactional
    public void activateKeyword(Long id, String activatedBy) {
        SuspiciousKeyword keyword = suspiciousKeywordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SuspiciousKeyword", "id", id));

        keyword.setActive(true);
        keyword.setUpdatedBy(activatedBy);
        suspiciousKeywordRepository.save(keyword);
    }

  
    @Transactional
    public void deleteKeyword(Long id) {
        if (!suspiciousKeywordRepository.existsById(id)) {
            throw new ResourceNotFoundException("SuspiciousKeyword", "id", id);
        }
        suspiciousKeywordRepository.deleteById(id);
    }

    /**
     * Get all available categories
     */
    public List<String> getAllCategories() {
        return suspiciousKeywordRepository.findDistinctCategories();
    }

    /**
     * Get keyword statistics
     */
    public Map<String, Long> getKeywordStatistics() {
        return Map.of(
            "CRITICAL", suspiciousKeywordRepository.countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel.Critical),
            "HIGH", suspiciousKeywordRepository.countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel.High),
            "MEDIUM", suspiciousKeywordRepository.countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel.Medium),
            "LOW", suspiciousKeywordRepository.countByRiskLevelAndIsActiveTrue(SuspiciousKeyword.RiskLevel.Low)
        );
    }

    /**
     * Calculate risk score for a given text using database keywords
     */
    public int calculateRiskScore(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }

        List<SuspiciousKeyword> activeKeywords = getAllActiveKeywords();
        double productComplement = 1.0;
        String processedText = text.toLowerCase();

        System.out.println("\n--- Keyword Risk Evaluation Started ---");

        for (SuspiciousKeyword keyword : activeKeywords) {
            if (containsKeyword(processedText, keyword)) {
                double p = Math.min(1.0, Math.max(0.0, keyword.getRiskScore() / 100.0));
                productComplement *= (1.0 - p);

                System.out.printf(
                    "Matched Keyword: %-20s | Level: %-8s | RiskScore: %-3d | Probability: %.2f%%%n",
                    keyword.getKeyword(),
                    keyword.getRiskLevel(),
                    keyword.getRiskScore(),
                    p * 100
                );
            }
        }

        double finalProb = 1.0 - productComplement;
        double combinedRiskScore = Math.round(finalProb * 100.0);

        System.out.println("-----------------------------------------");
        System.out.printf("Final Probability-Based Risk Score: %.2f%n", combinedRiskScore);
        System.out.println("-----------------------------------------\n");

        return (int) combinedRiskScore;
    }


    /**
     * Get matched keywords from text
     */
    public List<SuspiciousKeyword> getMatchedKeywords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return List.of();
        }

        List<SuspiciousKeyword> activeKeywords = getAllActiveKeywords();
        String processedText = text.toLowerCase();

        return activeKeywords.stream()
                .filter(keyword -> containsKeyword(processedText, keyword))
                .collect(Collectors.toList());
    }

    /**
     * Bulk import keywords
     */
    @Transactional
    public void bulkImportKeywords(List<SuspiciousKeyword> keywords, String importedBy) {
        for (SuspiciousKeyword keyword : keywords) {
            if (!suspiciousKeywordRepository.existsByKeywordIgnoreCase(keyword.getKeyword())) {
                keyword.setCreatedBy(importedBy);
                validateRiskScoreAndLevel(keyword.getRiskScore(), keyword.getRiskLevel());
                suspiciousKeywordRepository.save(keyword);
            }
        }
    }

    /**
     * Check if text contains a specific keyword based on its settings
     */
    private boolean containsKeyword(String text, SuspiciousKeyword keyword) {
        String searchText = keyword.isCaseSensitive() ? text : text.toLowerCase();
        String searchKeyword = keyword.isCaseSensitive() ? keyword.getKeyword() : keyword.getKeyword().toLowerCase();

        if (keyword.isWholeWordOnly()) {
            // Use word boundaries for whole word matching
            String pattern = "\\b" + java.util.regex.Pattern.quote(searchKeyword) + "\\b";
            return java.util.regex.Pattern.compile(pattern).matcher(searchText).find();
        } else {
            // Simple substring matching
            return searchText.contains(searchKeyword);
        }
    }

    /**
     * Validate that risk score is within the range of the risk level
     */
    private void validateRiskScoreAndLevel(Integer riskScore, SuspiciousKeyword.RiskLevel riskLevel) {
        if (riskScore < riskLevel.getMinScore() || riskScore > riskLevel.getMaxScore()) {
            throw new AmlApiException(HttpStatus.BAD_REQUEST, 
                String.format("Risk score %d is not valid for risk level %s (valid range: %d-%d)", 
                    riskScore, riskLevel, riskLevel.getMinScore(), riskLevel.getMaxScore()));
        }
    }
}
