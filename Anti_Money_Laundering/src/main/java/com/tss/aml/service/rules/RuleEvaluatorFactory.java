package com.tss.aml.service.rules;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.tss.aml.entity.RuleCondition.ConditionType;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RuleEvaluatorFactory {

    private final Map<String,RuleEvaluator> evaluators;

    public RuleEvaluator getEvaluator(ConditionType type) {
        return evaluators.get(type.name());
    }
}
