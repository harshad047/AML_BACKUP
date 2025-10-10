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

    private final AlertRepository alertRepository;
    private final CaseRepository caseRepository;
    private final TransactionRepository transactionRepository;
    private final ModelMapper modelMapper;

    public List<AlertDto> getAllOpenAlerts() {
        return alertRepository.findAll().stream()
                .filter(alert -> alert.getStatus() == Alert.AlertStatus.OPEN)
                .map(this::mapAlertWithTransaction)
                .collect(Collectors.toList());
    }

    public AlertDto getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        
        return mapAlertWithTransaction(alert);
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
     * Get all transactions with risk details for compliance visibility
     */
    public List<TransactionDto> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(tx -> modelMapper.map(tx, TransactionDto.class))
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
    
    /**
     * Get all alerts for a specific transaction
     */
    public List<AlertDto> getAlertsForTransaction(Long transactionId) {
        return alertRepository.findByTransactionId(transactionId).stream()
                .map(this::mapAlertWithTransaction)
                .collect(Collectors.toList());
    }
    
    /**
     * Get transaction with its associated alerts
     */
    public TransactionDto getTransactionWithAlerts(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        
        TransactionDto transactionDto = modelMapper.map(transaction, TransactionDto.class);
        
        // Get alerts for this transaction
        List<AlertDto> alerts = getAlertsForTransaction(transactionId);
        // Note: You may need to add alerts field to TransactionDto if not present
        
        return transactionDto;
    }
    
    /**
     * Get all transactions that have alerts
     */
    public List<TransactionDto> getTransactionsWithAlerts() {
        // Get all alerts
        List<Alert> allAlerts = alertRepository.findAll();
        
        // Get unique transaction IDs that have alerts
        List<Long> transactionIds = allAlerts.stream()
                .map(Alert::getTransactionId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        // Fetch transactions and map to DTOs
        return transactionIds.stream()
                .map(transactionId -> {
                    Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
                    if (transaction != null) {
                        return modelMapper.map(transaction, TransactionDto.class);
                    }
                    return null;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }
    
    /**
     * Enhanced method to get flagged transactions with their alert information
     */
    public List<TransactionDto> getFlaggedTransactionsWithAlerts() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    // You can add alert count or other alert-related info here if needed
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Helper method to create a properly mapped AlertDto with transaction details
     */
    private AlertDto mapAlertWithTransaction(Alert alert) {
        AlertDto alertDto = modelMapper.map(alert, AlertDto.class);
        
        // Manually fetch and set transaction details
        if (alert.getTransactionId() != null) {
            try {
                Transaction transaction = transactionRepository.findById(alert.getTransactionId()).orElse(null);
                if (transaction != null) {
                    TransactionDto transactionDto = modelMapper.map(transaction, TransactionDto.class);
                    alertDto.setTransaction(transactionDto);
                }
            } catch (Exception e) {
                // Log error but don't fail the entire operation
                System.err.println("Error fetching transaction for alert " + alert.getId() + ": " + e.getMessage());
            }
        }
        
        return alertDto;
    }
}
