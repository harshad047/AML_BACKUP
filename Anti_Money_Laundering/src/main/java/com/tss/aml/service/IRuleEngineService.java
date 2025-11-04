package com.tss.aml.service;

import com.tss.aml.dto.compliance.EvaluationResultDto;
import com.tss.aml.dto.transaction.TransactionInputDto;

public interface IRuleEngineService {
    EvaluationResultDto evaluate(TransactionInputDto input);

}
