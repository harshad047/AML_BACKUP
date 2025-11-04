package com.tss.aml.service;

import java.util.List;
import java.util.Map;

import com.tss.aml.entity.SuspiciousKeyword;

public interface ISuspiciousKeywordService {

	 List<SuspiciousKeyword> getAllActiveKeywords();
	    List<SuspiciousKeyword> getKeywordsByRiskLevel(SuspiciousKeyword.RiskLevel riskLevel);
	    List<SuspiciousKeyword> getKeywordsByCategory(String category);
	    SuspiciousKeyword addKeyword(SuspiciousKeyword keyword);
	    SuspiciousKeyword updateKeyword(Long id, SuspiciousKeyword updatedKeyword);
	    void deactivateKeyword(Long id, String deactivatedBy);
	    void activateKeyword(Long id, String activatedBy);
	    void deleteKeyword(Long id);
	    List<String> getAllCategories();
	    Map<String, Long> getKeywordStatistics();
	    int calculateRiskScore(String text);
	    List<SuspiciousKeyword> getMatchedKeywords(String text);
	    void bulkImportKeywords(List<SuspiciousKeyword> keywords, String importedBy);
}
