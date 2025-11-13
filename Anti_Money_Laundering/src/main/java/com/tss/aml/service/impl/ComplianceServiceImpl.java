package com.tss.aml.service.impl;

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
public class ComplianceServiceImpl {

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

    public List<AlertDto> getAllAlerts() {
        return alertRepository.findAll().stream()
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

        CaseDto dto = new CaseDto();
        dto.setId(savedCase.getId());
        dto.setAssignedTo(savedCase.getAssignedTo());
        dto.setStatus(savedCase.getStatus());
        dto.setCreatedAt(savedCase.getCreatedAt());
        dto.setUpdatedAt(savedCase.getUpdatedAt());

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

        CaseDto dto = new CaseDto();
        dto.setId(savedCase.getId());
        dto.setAssignedTo(savedCase.getAssignedTo());
        dto.setStatus(savedCase.getStatus());
        dto.setCreatedAt(savedCase.getCreatedAt());
        dto.setUpdatedAt(savedCase.getUpdatedAt());

        if (savedCase.getAlert() != null) {
            AlertDto alertDto = mapAlertWithTransaction(savedCase.getAlert());
            dto.setAlert(alertDto);
        }

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
    
 
    public List<TransactionDto> getFlaggedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
 
    public List<BaseTransactionDto> getFlaggedTransactionsOptimized() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    BaseTransactionDto dto = transactionDtoFactory.createTransactionDto(transaction);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
  
    public List<TransactionDto> getBlockedTransactions() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("BLOCKED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
  
    public List<BaseTransactionDto> getBlockedTransactionsOptimized() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("BLOCKED").stream()
                .map(transaction -> {
                    BaseTransactionDto dto = transactionDtoFactory.createTransactionDto(transaction);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
   
    public List<TransactionDto> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(tx -> {
                    TransactionDto dto = modelMapper.map(tx, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
   
    public List<TransactionDto> getTransactionsForReview() {
        List<TransactionDto> flaggedTransactions = getFlaggedTransactions();
        List<TransactionDto> blockedTransactions = getBlockedTransactions();
        
        List<TransactionDto> allTransactions = new java.util.ArrayList<>(flaggedTransactions);
        allTransactions.addAll(blockedTransactions);
        
        allTransactions.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));
        
        return allTransactions;
    }
    

    public TransactionDto getTransactionById(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
        populateObstructedRules(dto);
        return dto;
    }
    
 
    public List<CaseDto> getCasesUnderInvestigation() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.UNDER_INVESTIGATION)
                .map(caseEntity -> {
                    CaseDto dto = new CaseDto();
                    dto.setId(caseEntity.getId());
                    dto.setAssignedTo(caseEntity.getAssignedTo());
                    dto.setStatus(caseEntity.getStatus());
                    dto.setCreatedAt(caseEntity.getCreatedAt());
                    dto.setUpdatedAt(caseEntity.getUpdatedAt());

                    if (caseEntity.getAlert() != null) {
                        AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
                        dto.setAlert(alertDto);
                    }

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
    
 
    public List<CaseDto> getResolvedCases() {
        return caseRepository.findAll().stream()
                .filter(caseEntity -> caseEntity.getStatus() == Case.CaseStatus.RESOLVED)
                .map(caseEntity -> {
                    CaseDto dto = new CaseDto();
                    dto.setId(caseEntity.getId());
                    dto.setAssignedTo(caseEntity.getAssignedTo());
                    dto.setStatus(caseEntity.getStatus());
                    dto.setCreatedAt(caseEntity.getCreatedAt());
                    dto.setUpdatedAt(caseEntity.getUpdatedAt());

                    if (caseEntity.getAlert() != null) {
                        AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
                        dto.setAlert(alertDto);
                    }

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
    

    public CaseDto getCaseById(Long caseId) {
        Case caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        CaseDto dto = new CaseDto();
        dto.setId(caseEntity.getId());
        dto.setAssignedTo(caseEntity.getAssignedTo());
        dto.setStatus(caseEntity.getStatus());
        dto.setCreatedAt(caseEntity.getCreatedAt());
        dto.setUpdatedAt(caseEntity.getUpdatedAt());

        if (caseEntity.getAlert() != null) {
            AlertDto alertDto = mapAlertWithTransaction(caseEntity.getAlert());
            dto.setAlert(alertDto);
        }

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
    

    public List<AlertDto> getAlertsForTransaction(Long transactionId) {
        return alertRepository.findByTransactionId(transactionId).stream()
                .map(this::mapAlertWithTransaction)
                .collect(Collectors.toList());
    }
    

    public TransactionDto getTransactionWithAlerts(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        
        TransactionDto transactionDto = modelMapper.map(transaction, TransactionDto.class);
        populateObstructedRules(transactionDto);
        
        List<AlertDto> alerts = getAlertsForTransaction(transactionId);
        
        return transactionDto;
    }
    

    public List<TransactionDto> getTransactionsWithAlerts() {
        List<Alert> allAlerts = alertRepository.findAll();
        
        List<Long> transactionIds = allAlerts.stream()
                .map(Alert::getTransactionId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
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
    
  
    public List<TransactionDto> getFlaggedTransactionsWithAlerts() {
        return transactionRepository.findByStatusOrderByCreatedAtDesc("FLAGGED").stream()
                .map(transaction -> {
                    TransactionDto dto = modelMapper.map(transaction, TransactionDto.class);
                    populateObstructedRules(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }
    

    private AlertDto mapAlertWithTransaction(Alert alert) {
        AlertDto alertDto = new AlertDto();
        alertDto.setId(alert.getId());
        alertDto.setTransactionId(alert.getTransactionId());
        alertDto.setReason(alert.getReason());
        alertDto.setRiskScore(alert.getRiskScore());
        alertDto.setStatus(alert.getStatus());
        alertDto.setCreatedAt(alert.getCreatedAt());

        if (alert.getTransactionId() != null) {
            try {
                Transaction transaction = transactionRepository.findById(alert.getTransactionId()).orElse(null);
                if (transaction != null) {
                    BaseTransactionDto transactionDto = transactionDtoFactory.createTransactionDto(transaction);

                    populateObstructedRules(transactionDto);

                    alertDto.setTransaction(transactionDto);
                }
            } catch (Exception e) {
                System.err.println("Error fetching transaction for alert " + alert.getId() + ": " + e.getMessage());
            }
        }

        return alertDto;
    }
    

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
            transactionDto.setObstructedRules(new java.util.ArrayList<>());
        }
    }


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
            transactionDto.setObstructedRules(new java.util.ArrayList<>());
        }
    }
}

