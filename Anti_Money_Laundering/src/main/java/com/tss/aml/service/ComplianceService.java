package com.tss.aml.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.AlertDto;
import com.tss.aml.dto.CaseDto;
import com.tss.aml.dto.TransactionDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Case;
import com.tss.aml.entity.InvestigationNote;
import com.tss.aml.entity.Transaction;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CaseRepository;
import com.tss.aml.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComplianceService {

	@Autowired
    private final AlertRepository alertRepository;
	@Autowired
    private final CaseRepository caseRepository;
    @Autowired
    private final TransactionRepository transactionRepository;
	
	
    private final ModelMapper modelMapper = new ModelMapper();

    public List<AlertDto> getAllOpenAlerts() {
        return alertRepository.findAll().stream()
                .filter(alert -> alert.getStatus() == Alert.AlertStatus.OPEN)
                .map(alert -> modelMapper.map(alert, AlertDto.class))
                .collect(Collectors.toList());
    }

    public AlertDto getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        return modelMapper.map(alert, AlertDto.class);
    }

    public CaseDto createCaseFromAlert(Long alertId, String assignedTo) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        alert.setStatus(Alert.AlertStatus.ESCALATED);
        alertRepository.save(alert);

        Case caseInstance = new Case();
        caseInstance.setAlert(alert);
        caseInstance.setAssignedTo(assignedTo);
        Case savedCase = caseRepository.save(caseInstance);
        return modelMapper.map(savedCase, CaseDto.class);
    }

    public CaseDto addNoteToCase(Long caseId, String author, String content) {
        Case foundCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        InvestigationNote note = new InvestigationNote();
        note.setCaseEntity(foundCase);
        note.setAuthor(author);
        note.setContent(content);

        foundCase.getNotes().add(note);
        Case savedCase = caseRepository.save(foundCase);
        return modelMapper.map(savedCase, CaseDto.class);
    }
    
    /**
     * Get all flagged transactions awaiting compliance officer review
     */
    public List<TransactionDto> getFlaggedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> modelMapper.map(transaction, TransactionDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all blocked transactions for compliance officer review
     */
    public List<TransactionDto> getBlockedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("BLOCKED").stream()
                .map(transaction -> modelMapper.map(transaction, TransactionDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all transactions requiring review (FLAGGED + BLOCKED)
     */
    public List<TransactionDto> getTransactionsForReview() {
        List<TransactionDto> flaggedTransactions = getFlaggedTransactions();
        List<TransactionDto> blockedTransactions = getBlockedTransactions();
        
        // Combine both lists
        List<TransactionDto> allTransactions = new java.util.ArrayList<>(flaggedTransactions);
        allTransactions.addAll(blockedTransactions);
        
        // Sort by creation date (newest first)
        allTransactions.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));
        
        return allTransactions;
    }
    
    /**
     * Get transaction details by ID for compliance officer review
     */
    public TransactionDto getTransactionById(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        return modelMapper.map(transaction, TransactionDto.class);
    }
    
    /**
     * Get all cases under investigation
     */
    public List<CaseDto> getCasesUnderInvestigation() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.UNDER_INVESTIGATION)
                .map(caseEntity -> modelMapper.map(caseEntity, CaseDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get all resolved cases
     */
    public List<CaseDto> getResolvedCases() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.RESOLVED)
                .map(caseEntity -> modelMapper.map(caseEntity, CaseDto.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get case by ID
     */
    public CaseDto getCaseById(Long caseId) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));
        return modelMapper.map(caseEntity, CaseDto.class);
    }
}
