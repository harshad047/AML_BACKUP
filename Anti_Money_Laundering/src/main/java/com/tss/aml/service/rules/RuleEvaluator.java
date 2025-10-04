package com.tss.aml.service.rules;

import com.tss.aml.dto.TransactionInputDto;
import com.tss.aml.entity.RuleCondition;

public interface RuleEvaluator {
    boolean evaluate(TransactionInputDto input, RuleCondition condition);
}
