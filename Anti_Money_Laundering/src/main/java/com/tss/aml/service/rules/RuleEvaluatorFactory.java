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
    private final VelocityEvaluator velocityEvaluator;
    private final StructuringEvaluator structuringEvaluator;
    private final BehavioralDeviationEvaluator behavioralDeviationEvaluator;
    private final BalanceRatioEvaluator balanceRatioEvaluator;
    private final DailyTotalEvaluator dailyTotalEvaluator;
    private final NewCounterpartyEvaluator newCounterpartyEvaluator;

    private final Map<ConditionType, RuleEvaluator> evaluators = new EnumMap<>(ConditionType.class);

    @PostConstruct
    public void init() {
        evaluators.put(ConditionType.AMOUNT, amountEvaluator);
        evaluators.put(ConditionType.COUNTRY_RISK, countryRiskEvaluator);
        evaluators.put(ConditionType.NLP_SCORE, nlpScoreEvaluator);
        evaluators.put(ConditionType.KEYWORD_MATCH, keywordMatchEvaluator);
        evaluators.put(ConditionType.PAST_TRANSACTIONS, pastTransactionsEvaluator);
        evaluators.put(ConditionType.VELOCITY, velocityEvaluator);
        evaluators.put(ConditionType.STRUCTURING, structuringEvaluator);
        evaluators.put(ConditionType.BEHAVIORAL_DEVIATION, behavioralDeviationEvaluator);
        evaluators.put(ConditionType.AMOUNT_BALANCE_RATIO, balanceRatioEvaluator);
        evaluators.put(ConditionType.DAILY_TOTAL, dailyTotalEvaluator);
        evaluators.put(ConditionType.NEW_COUNTERPARTY, newCounterpartyEvaluator);
    }

    public RuleEvaluator getEvaluator(ConditionType type) {
        return evaluators.get(type);
    }
}
