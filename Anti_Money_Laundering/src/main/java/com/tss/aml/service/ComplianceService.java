package com.tss.aml.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.compliance.AlertDto;
import com.tss.aml.dto.compliance.CaseDto;
import com.tss.aml.dto.compliance.NoteDto;
import com.tss.aml.dto.compliance.ObstructedRuleDto;
import com.tss.aml.dto.transaction.BaseTransactionDto;
import com.tss.aml.dto.transaction.TransactionDto;
import com.tss.aml.dto.transaction.TransactionDtoFactory;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Case;
import com.tss.aml.entity.InvestigationNote;
import com.tss.aml.entity.RuleExecutionLog;
import com.tss.aml.entity.Transaction;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CaseRepository;
import com.tss.aml.repository.RuleExecutionLogRepository;
import com.tss.aml.repository.TransactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private final AlertRepository alertRepository;
    private final CaseRepository caseRepository;
    private final TransactionRepository transactionRepository;
    private final RuleExecutionLogRepository ruleExecutionLogRepository;
    private final ModelMapper modelMapper;
    private final TransactionDtoFactory transactionDtoFactory;

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

        // Create CaseDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
        CaseDto dto = new CaseDto();
        dto.setId(savedCase.getId());
        dto.setAssignedTo(savedCase.getAssignedTo());
        dto.setStatus(savedCase.getStatus());
        dto.setCreatedAt(savedCase.getCreatedAt());
        dto.setUpdatedAt(savedCase.getUpdatedAt());

        // Map alert manually
        if (savedCase.getAlert() != null) {
            AlertDto alertDto = mapAlertWithTransaction(savedCase.getAlert());
            dto.setAlert(alertDto);
        }

        return dto;
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

        // Create CaseDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
        CaseDto dto = new CaseDto();
        dto.setId(savedCase.getId());
        dto.setAssignedTo(savedCase.getAssignedTo());
        dto.setStatus(savedCase.getStatus());
        dto.setCreatedAt(savedCase.getCreatedAt());
        dto.setUpdatedAt(savedCase.getUpdatedAt());

        // Map alert manually
        if (savedCase.getAlert() != null) {
            AlertDto alertDto = mapAlertWithTransaction(savedCase.getAlert());
            dto.setAlert(alertDto);
        }

        // Map notes manually
        if (savedCase.getNotes() != null) {
            List<NoteDto> noteDtos = savedCase.getNotes().stream()
                    .map(noteEntity -> {
                        NoteDto noteDto = new NoteDto();
                        noteDto.setId(noteEntity.getId());
                        noteDto.setAuthor(noteEntity.getAuthor());
                        noteDto.setContent(noteEntity.getContent());
                        noteDto.setCreatedAt(noteEntity.getCreatedAt());
                        return noteDto;
                    })
                    .collect(Collectors.toList());
            dto.setNotes(noteDtos);
        }

        return dto;
    }
    
    /**
     * Get all flagged transactions awaiting compliance officer review
     */
    public List<TransactionDto> getFlaggedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all flagged transactions with appropriate DTO types (no null fields)
     */
    public List<BaseTransactionDto> getFlaggedTransactionsOptimized() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    BaseTransactionDto dto = transactionDtoFactory.createTransactionDto(transaction);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all blocked transactions for compliance officer review
     */
    public List<TransactionDto> getBlockedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("BLOCKED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all blocked transactions with appropriate DTO types (no null fields)
     */
    public List<BaseTransactionDto> getBlockedTransactionsOptimized() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("BLOCKED").stream()
                .map(transaction -> {
                    BaseTransactionDto dto = transactionDtoFactory.createTransactionDto(transaction);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all transactions with risk details for compliance visibility
     */
    public List<TransactionDto> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(tx -> {
                    TransactionDto dto = modelMapper.map(tx, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
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
        TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
        populateObstructedRules(dto);
        return dto;
    }
    
    /**
     * Get all cases under investigation
     */
    public List<CaseDto> getCasesUnderInvestigation() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.UNDER_INVESTIGATION)
                .map(caseEntity -> {
                    // Create CaseDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
                    CaseDto dto = new CaseDto();
                    dto.setId(caseEntity.getId());
                    dto.setAssignedTo(caseEntity.getAssignedTo());
                    dto.setStatus(caseEntity.getStatus());
                    dto.setCreatedAt(caseEntity.getCreatedAt());
                    dto.setUpdatedAt(caseEntity.getUpdatedAt());

                    // Map alert manually
                    if (caseEntity.getAlert() != null) {
                        AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
                        dto.setAlert(alertDto);
                    }

                    // Map notes manually
                    if (caseEntity.getNotes() != null) {
                        List<NoteDto> noteDtos = caseEntity.getNotes().stream()
                                .map(note -> {
                                    NoteDto noteDto = new NoteDto();
                                    noteDto.setId(note.getId());
                                    noteDto.setAuthor(note.getAuthor());
                                    noteDto.setContent(note.getContent());
                                    noteDto.setCreatedAt(note.getCreatedAt());
                                    return noteDto;
                                })
                                .collect(Collectors.toList());
                        dto.setNotes(noteDtos);
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all resolved cases
     */
    public List<CaseDto> getResolvedCases() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.RESOLVED)
                .map(caseEntity -> {
                    // Create CaseDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
                    CaseDto dto = new CaseDto();
                    dto.setId(caseEntity.getId());
                    dto.setAssignedTo(caseEntity.getAssignedTo());
                    dto.setStatus(caseEntity.getStatus());
                    dto.setCreatedAt(caseEntity.getCreatedAt());
                    dto.setUpdatedAt(caseEntity.getUpdatedAt());

                    // Map alert manually
                    if (caseEntity.getAlert() != null) {
                        AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
                        dto.setAlert(alertDto);
                    }

                    // Map notes manually
                    if (caseEntity.getNotes() != null) {
                        List<NoteDto> noteDtos = caseEntity.getNotes().stream()
                                .map(note -> {
                                    NoteDto noteDto = new NoteDto();
                                    noteDto.setId(note.getId());
                                    noteDto.setAuthor(note.getAuthor());
                                    noteDto.setContent(note.getContent());
                                    noteDto.setCreatedAt(note.getCreatedAt());
                                    return noteDto;
                                })
                                .collect(Collectors.toList());
                        dto.setNotes(noteDtos);
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get case by ID
     */
    public CaseDto getCaseById(Long caseId) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        // Create CaseDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
        CaseDto dto = new CaseDto();
        dto.setId(caseEntity.getId());
        dto.setAssignedTo(caseEntity.getAssignedTo());
        dto.setStatus(caseEntity.getStatus());
        dto.setCreatedAt(caseEntity.getCreatedAt());
        dto.setUpdatedAt(caseEntity.getUpdatedAt());

        // Map alert manually
        if (caseEntity.getAlert() != null) {
            AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
            dto.setAlert(alertDto);
        }

        // Map notes manually
        if (caseEntity.getNotes() != null) {
            List<NoteDto> noteDtos = caseEntity.getNotes().stream()
                    .map(note -> {
                        NoteDto noteDto = new NoteDto();
                        noteDto.setId(note.getId());
                        noteDto.setAuthor(note.getAuthor());
                        noteDto.setContent(note.getContent());
                        noteDto.setCreatedAt(note.getCreatedAt());
                        return noteDto;
                    })
                    .collect(Collectors.toList());
            dto.setNotes(noteDtos);
        }

        return dto;
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
        populateObstructedRules(transactionDto);
        
        // Get alerts for this transaction
        List<AlertDto> alerts = getAlertsForTransaction(transactionId);
        // Note: You may need to add alerts field to BaseTransactionDto if not present
        
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
                        TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                        populateObstructedRules(dto);
                        return dto;
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
                    populateObstructedRules(dto);
                    // You can add alert count or other alert-related info here if needed
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Helper method to create a properly mapped AlertDto with transaction details
     */
    private AlertDto mapAlertWithTransaction(Alert alert) {
        // Create AlertDto manually to avoid ModelMapper trying to instantiate abstract BaseTransactionDto
        AlertDto alertDto = new AlertDto();
        alertDto.setId(alert.getId());
        alertDto.setTransactionId(alert.getTransactionId());
        alertDto.setReason(alert.getReason());
        alertDto.setRiskScore(alert.getRiskScore());
        alertDto.setStatus(alert.getStatus());
        alertDto.setCreatedAt(alert.getCreatedAt());

        // Manually fetch and set transaction details using the factory
        if (alert.getTransactionId() != null) {
            try {
                Transaction transaction = transactionRepository.findById(alert.getTransactionId()).orElse(null);
                if (transaction != null) {
                    // Use the factory to create transaction DTO with proper type handling
                    BaseTransactionDto transactionDto = transactionDtoFactory.createTransactionDto(transaction);

                    // Populate obstructed rules for this transaction
                    populateObstructedRules(transactionDto);

                    // Set the transaction DTO with obstructed rules in the alert
                    alertDto.setTransaction(transactionDto);
                }
            } catch (Exception e) {
                // Log error but don't fail the entire operation
                System.err.println("Error fetching transaction for alert " + alert.getId() + ": " + e.getMessage());
            }
        }

        return alertDto;
    }
    
    /**
     * Helper method to populate obstructed rules for a transaction DTO
     */
    private void populateObstructedRules(TransactionDto transactionDto) {
        if (transactionDto != null && transactionDto.getId() != null) {
            List<RuleExecutionLog> ruleLogs = ruleExecutionLogRepository.findByTransactionIdAndMatchedTrueOrderByEvaluatedAtDesc(transactionDto.getId().toString());

            List<ObstructedRuleDto> obstructedRules = ruleLogs.stream()
                    .map(log -> new ObstructedRuleDto(
                            log.getRule().getId(),
                            log.getRule().getName(),
                            log.getRule().getAction(),
                            log.getRule().getRiskWeight(),
                            log.getRule().getPriority(),
                            log.getDetails(),
                            log.getEvaluatedAt()
                    ))
                    .collect(Collectors.toList());

            transactionDto.setObstructedRules(obstructedRules);
        } else {
            // Ensure obstructedRules is never null
            transactionDto.setObstructedRules(new java.util.ArrayList<>());
        }
    }

    /**
     * Helper method to populate obstructed rules for a base transaction DTO
     */
    private void populateObstructedRules(BaseTransactionDto transactionDto) {
        if (transactionDto != null && transactionDto.getId() != null) {
            List<RuleExecutionLog> ruleLogs = ruleExecutionLogRepository.findByTransactionIdAndMatchedTrueOrderByEvaluatedAtDesc(transactionDto.getId().toString());

            List<ObstructedRuleDto> obstructedRules = ruleLogs.stream()
                    .map(log -> new ObstructedRuleDto(
                            log.getRule().getId(),
                            log.getRule().getName(),
                            log.getRule().getAction(),
                            log.getRule().getRiskWeight(),
                            log.getRule().getPriority(),
                            log.getDetails(),
                            log.getEvaluatedAt()
                    ))
                    .collect(Collectors.toList());

            transactionDto.setObstructedRules(obstructedRules);
        } else {
            // Ensure obstructedRules is never null
            transactionDto.setObstructedRules(new java.util.ArrayList<>());
        }
    }
}

