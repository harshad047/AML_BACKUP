package com.tss.aml.controller;

import com.tss.aml.dto.AlertDto;
import com.tss.aml.dto.BaseTransactionDto;
import com.tss.aml.dto.CaseDto;
import com.tss.aml.dto.NoteDto;
import com.tss.aml.dto.TransactionDto;
import com.tss.aml.service.ComplianceService;
import com.tss.aml.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('OFFICER', 'ROLE_OFFICER', 'ADMIN', 'SUPER_ADMIN', 'ROLE_SUPER_ADMIN')")
public class ComplianceController {

    private final ComplianceService complianceService;
    private final TransactionService transactionService;

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDto>> getAllOpenAlerts() {
        return ResponseEntity.ok(complianceService.getAllOpenAlerts());
    }

    @GetMapping("/alerts/{id}")
    public ResponseEntity<AlertDto> getAlertById(@PathVariable Long id) {
        return ResponseEntity.ok(complianceService.getAlertById(id));
    }

    @PostMapping("/alerts/{id}/case")
    public ResponseEntity<CaseDto> createCaseFromAlert(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(complianceService.createCaseFromAlert(id, username));
    }

    @PostMapping("/cases/{id}/notes")
    public ResponseEntity<CaseDto> addNoteToCase(@PathVariable Long id, @RequestBody NoteDto noteDto, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(complianceService.addNoteToCase(id, username, noteDto.getContent()));
    }

    @PostMapping("/transactions/{transactionId}/approve")
    public ResponseEntity<TransactionDto> approveTransaction(@PathVariable Long transactionId, Authentication authentication) {
        String officerEmail = authentication.getName();
        TransactionDto approvedTransaction = transactionService.approveTransaction(transactionId, officerEmail);
        return ResponseEntity.ok(approvedTransaction);
    }
    
    @PostMapping("/transactions/{transactionId}/reject")
    public ResponseEntity<TransactionDto> rejectTransaction(
            @PathVariable Long transactionId, 
            @RequestParam(required = false, defaultValue = "Rejected by compliance officer") String reason,
            Authentication authentication) {
        String officerEmail = authentication.getName();
        TransactionDto rejectedTransaction = transactionService.rejectTransaction(transactionId, officerEmail, reason);
        return ResponseEntity.ok(rejectedTransaction);
    }
    
    @GetMapping("/transactions/flagged")
    public ResponseEntity<List<TransactionDto>> getFlaggedTransactions() {
        List<TransactionDto> flaggedTransactions = complianceService.getFlaggedTransactions();
        return ResponseEntity.ok(flaggedTransactions);
    }

    @GetMapping("/transactions/all")
    public ResponseEntity<List<TransactionDto>> getAllTransactions() {
        List<TransactionDto> all = complianceService.getAllTransactions();
        return ResponseEntity.ok(all);
    }
    
    @GetMapping("/transactions/blocked")
    public ResponseEntity<List<TransactionDto>> getBlockedTransactions() {
        List<TransactionDto> blockedTransactions = complianceService.getBlockedTransactions();
        return ResponseEntity.ok(blockedTransactions);
    }
    
    @GetMapping("/transactions/review")
    public ResponseEntity<List<TransactionDto>> getTransactionsForReview() {
        List<TransactionDto> transactionsForReview = complianceService.getTransactionsForReview();
        return ResponseEntity.ok(transactionsForReview);
    }
    
    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<TransactionDto> getTransactionDetails(@PathVariable Long transactionId) {
        TransactionDto transaction = complianceService.getTransactionById(transactionId);
        return ResponseEntity.ok(transaction);
    }
    
    // Case Management Endpoints
    
    @GetMapping("/cases/under-investigation")
    public ResponseEntity<List<CaseDto>> getCasesUnderInvestigation() {
        List<CaseDto> cases = complianceService.getCasesUnderInvestigation();
        return ResponseEntity.ok(cases);
    }
    
    @GetMapping("/cases/resolved")
    public ResponseEntity<List<CaseDto>> getResolvedCases() {
        List<CaseDto> cases = complianceService.getResolvedCases();
        return ResponseEntity.ok(cases);
    }
    
    @GetMapping("/cases/{caseId}")
    public ResponseEntity<CaseDto> getCaseById(@PathVariable Long caseId) {
        CaseDto caseDto = complianceService.getCaseById(caseId);
        return ResponseEntity.ok(caseDto);
    }
    
    // Enhanced Alert and Transaction Mapping Endpoints
    
    @GetMapping("/transactions/{transactionId}/alerts")
    public ResponseEntity<List<AlertDto>> getAlertsForTransaction(@PathVariable Long transactionId) {
        List<AlertDto> alerts = complianceService.getAlertsForTransaction(transactionId);
        return ResponseEntity.ok(alerts);
    }
    
    @GetMapping("/transactions/{transactionId}/with-alerts")
    public ResponseEntity<TransactionDto> getTransactionWithAlerts(@PathVariable Long transactionId) {
        TransactionDto transaction = complianceService.getTransactionWithAlerts(transactionId);
        return ResponseEntity.ok(transaction);
    }
    
    @GetMapping("/transactions/with-alerts")
    public ResponseEntity<List<TransactionDto>> getTransactionsWithAlerts() {
        List<TransactionDto> transactions = complianceService.getTransactionsWithAlerts();
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/transactions/flagged-with-alerts")
    public ResponseEntity<List<TransactionDto>> getFlaggedTransactionsWithAlerts() {
        List<TransactionDto> transactions = complianceService.getFlaggedTransactionsWithAlerts();
        return ResponseEntity.ok(transactions);
    }
    
    // Optimized endpoints with clean DTOs (no null fields)
    
    @GetMapping("/transactions/flagged/optimized")
    public ResponseEntity<List<BaseTransactionDto>> getFlaggedTransactionsOptimized() {
        List<BaseTransactionDto> transactions = complianceService.getFlaggedTransactionsOptimized();
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/transactions/blocked/optimized")
    public ResponseEntity<List<BaseTransactionDto>> getBlockedTransactionsOptimized() {
        List<BaseTransactionDto> transactions = complianceService.getBlockedTransactionsOptimized();
        return ResponseEntity.ok(transactions);
    }
}
