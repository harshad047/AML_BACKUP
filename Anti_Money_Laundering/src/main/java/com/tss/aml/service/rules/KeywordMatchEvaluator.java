package com.tss.aml.service.rules;

import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.transaction.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component("KEYWORD_MATCH")
public class KeywordMatchEvaluator implements RuleEvaluator {

    private static final Logger log = LoggerFactory.getLogger(KeywordMatchEvaluator.class);

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        String cleanText = input.getText() != null ? cleanForMatching(input.getText()) : "";
        if (cleanText.isEmpty()) {
            log.debug("KeywordMatchEvaluator: Empty text, returning false");
            return false;
        }
        
        String keyword = condition.getValue().toLowerCase();
        String operator = condition.getOperator();
        
        boolean result = false;
        if (">".equals(operator)) {
            result = containsWholeWord(cleanText, keyword);
        } else if (">=".equals(operator)) {
            result = cleanText.contains(keyword);
        } else if ("==".equals(operator)) {
            result = cleanText.equals(keyword);
        } else if ("<=".equals(operator)) {
            result = cleanText.contains(keyword) || cleanText.startsWith(keyword) || cleanText.endsWith(keyword);
        } else if ("<".equals(operator)) {
            result = !cleanText.contains(keyword);
        } else {
            // Default to CONTAINS for backward compatibility
            result = containsWholeWord(cleanText, keyword);
        }
        
        log.debug("KeywordMatchEvaluator: '{}' {} '{}' = {}", cleanText, operator, keyword, result);
        return result;
    }

    private String cleanForMatching(String text) {
        return text.toLowerCase()
                   .replaceAll("[^a-z0-9\\s]", " ")
                   .trim()
                   .replaceAll("\\s+", " ");
    }

    private boolean containsWholeWord(String text, String word) {
        String pattern = "\\b" + Pattern.quote(word) + "\\b";
        return Pattern.compile(pattern).matcher(text).find();
    }
}

