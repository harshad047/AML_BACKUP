package com.tss.aml.service.rules;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.tss.aml.entity.RuleCondition.ConditionType;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RuleEvaluatorFactory {

    private final AmountEvaluator amountEvaluator;
    private final CountryRiskEvaluator countryRiskEvaluator;
    private final NlpScoreEvaluator nlpScoreEvaluator;
    private final KeywordMatchEvaluator keywordMatchEvaluator;
    private final PastTransactionsEvaluator pastTransactionsEvaluator;

    private final Map<ConditionType, RuleEvaluator> evaluators = new EnumMap<>(ConditionType.class);

    @PostConstruct
    public void init() {
        evaluators.put(ConditionType.AMOUNT, amountEvaluator);
        evaluators.put(ConditionType.COUNTRY_RISK, countryRiskEvaluator);
        evaluators.put(ConditionType.NLP_SCORE, nlpScoreEvaluator);
        evaluators.put(ConditionType.KEYWORD_MATCH, keywordMatchEvaluator);
        evaluators.put(ConditionType.PAST_TRANSACTIONS, pastTransactionsEvaluator);
    }

    public RuleEvaluator getEvaluator(ConditionType type) {
        return evaluators.get(type);
    }
}
