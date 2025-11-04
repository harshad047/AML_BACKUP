package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.compliance.AlertDto;
import com.tss.aml.dto.compliance.CaseDto;
import com.tss.aml.dto.transaction.BaseTransactionDto;
import com.tss.aml.dto.transaction.TransactionDto;

public interface IComplianceService {
	 List<AlertDto> getAllOpenAlerts();
	    List<AlertDto> getAllAlerts();
	    AlertDto getAlertById(Long id);
	    CaseDto createCaseFromAlert(Long alertId, String assignedTo);
	    CaseDto addNoteToCase(Long caseId, String author, String content);
	    List<TransactionDto> getFlaggedTransactions();
	    List<BaseTransactionDto> getFlaggedTransactionsOptimized();
	    List<TransactionDto> getBlockedTransactions();
	    List<BaseTransactionDto> getBlockedTransactionsOptimized();
	    List<TransactionDto> getAllTransactions();
	    List<TransactionDto> getTransactionsForReview();
	    TransactionDto getTransactionById(Long transactionId);
	    List<CaseDto> getCasesUnderInvestigation();
	    List<CaseDto> getResolvedCases();
	    CaseDto getCaseById(Long caseId);
	    List<AlertDto> getAlertsForTransaction(Long transactionId);
	    TransactionDto getTransactionWithAlerts(Long transactionId);
	    List<TransactionDto> getTransactionsWithAlerts();
	    List<TransactionDto> getFlaggedTransactionsWithAlerts();
}
