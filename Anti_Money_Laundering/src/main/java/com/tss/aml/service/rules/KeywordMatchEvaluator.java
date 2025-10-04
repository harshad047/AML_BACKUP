package com.tss.aml.service.rules;

import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.tss.aml.dto.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;

@Component
public class KeywordMatchEvaluator implements RuleEvaluator {

    @Override
    public boolean evaluate(TransactionInputDto input, RuleCondition condition) {
        String cleanText = input.getText() != null ? cleanForMatching(input.getText()) : "";
        if (cleanText.isEmpty()) {
            System.out.println("    KeywordMatchEvaluator: Empty text, returning false");
            return false;
        }
        
        String keyword = condition.getValue().toLowerCase();
        String operator = condition.getOperator();
        
        boolean result = false;
        if ("CONTAINS".equalsIgnoreCase(operator)) {
            result = containsWholeWord(cleanText, keyword);
        } else if ("EQUALS".equalsIgnoreCase(operator)) {
            result = cleanText.equals(keyword);
        } else if ("STARTS_WITH".equalsIgnoreCase(operator)) {
            result = cleanText.startsWith(keyword);
        } else if ("ENDS_WITH".equalsIgnoreCase(operator)) {
            result = cleanText.endsWith(keyword);
        } else {
            // Default to CONTAINS for backward compatibility
            result = containsWholeWord(cleanText, keyword);
        }
        
        System.out.println("    KeywordMatchEvaluator: '" + cleanText + "' " + operator + " '" + keyword + "' = " + result);
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
