package com.tss.aml.controller;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.BankAccountDto;
import com.tss.aml.dto.CountryRiskDto;
import com.tss.aml.dto.CreateUserDto;
import com.tss.aml.dto.DocumentDTO;
import com.tss.aml.dto.RuleDto;
import com.tss.aml.dto.SuspiciousKeywordDto;
import com.tss.aml.dto.TransactionDto;
import com.tss.aml.dto.UserDto;
import com.tss.aml.entity.AuditLog;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Enums.DocumentStatus;
import com.tss.aml.service.AdminService;
import com.tss.aml.service.AuditLogService;
import com.tss.aml.service.DocumentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final DocumentService documentService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserDto createUserDto) {
        return new ResponseEntity<>(adminService.createUser(createUserDto), HttpStatus.CREATED);
    }

    @GetMapping("/rules")
    public ResponseEntity<List<RuleDto>> getAllRules() {
        return ResponseEntity.ok(adminService.getAllRules());
    }

    @PostMapping("/rules")
    public ResponseEntity<RuleDto> createRule(@RequestBody RuleDto ruleDto) {
        return new ResponseEntity<>(adminService.createRule(ruleDto), HttpStatus.CREATED);
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<RuleDto> updateRule(@PathVariable Long id, @RequestBody RuleDto ruleDto) {
        return ResponseEntity.ok(adminService.updateRule(id, ruleDto));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        adminService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/keywords")
    public ResponseEntity<List<SuspiciousKeywordDto>> getAllKeywords() {
        return ResponseEntity.ok(adminService.getAllKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<SuspiciousKeywordDto> addKeyword(@RequestBody SuspiciousKeywordDto keywordDto) {
        return new ResponseEntity<>(adminService.addKeyword(keywordDto), HttpStatus.CREATED);
    }

    @GetMapping("/accounts/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN') or hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BankAccountDto>> getPendingAccounts() {
        return ResponseEntity.ok(adminService.getPendingAccounts());
    }

    @PostMapping("/accounts/{id}/approve")
    public ResponseEntity<BankAccountDto> approveAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveAccount(id));
    }

    @PostMapping("/accounts/{id}/reject")
    public ResponseEntity<BankAccountDto> rejectAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.rejectAccount(id));
    }
    
    @GetMapping("/accounts")
    public ResponseEntity<List<BankAccountDto>> getAllAccounts() {
        return ResponseEntity.ok(adminService.getAllAccounts());
    }
    
    @GetMapping("/accounts/{id}")
    public ResponseEntity<BankAccountDto> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAccountById(id));
    }
    
    @PostMapping("/accounts/{id}/suspend")
    public ResponseEntity<BankAccountDto> suspendAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.suspendAccount(id));
    }
    
    @PostMapping("/accounts/{id}/activate")
    public ResponseEntity<BankAccountDto> activateAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.activateAccount(id));
    }

    // Country Risk Management
    @GetMapping("/country-risks")
    public ResponseEntity<List<CountryRiskDto>> getCountryRisks() {
        return ResponseEntity.ok(adminService.getAllCountryRisks());
    }

    @PostMapping("/country-risks")
    public ResponseEntity<CountryRiskDto> createCountryRisk(@RequestBody CountryRiskDto dto) {
        return new ResponseEntity<>(adminService.createCountryRisk(dto), HttpStatus.CREATED);
    }

    @PutMapping("/country-risks/{id}")
    public ResponseEntity<CountryRiskDto> updateCountryRisk(@PathVariable Long id, @RequestBody CountryRiskDto dto) {
        return ResponseEntity.ok(adminService.updateCountryRisk(id, dto));
    }

    @DeleteMapping("/country-risks/{id}")
    public ResponseEntity<Void> deleteCountryRisk(@PathVariable Long id) {
        adminService.deleteCountryRisk(id);
        return ResponseEntity.noContent().build();
    }

    // Admin transactions view by account number
    @GetMapping("/transactions/account/{accountNumber}")
    public ResponseEntity<List<TransactionDto>> getTransactionsByAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(adminService.getTransactionsByAccountNumber(accountNumber));
    }
    
    @GetMapping("/debug/auth")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> debugAuth(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(Map.of("error", "No authentication found"));
        }
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "authorities", authorities.stream().map(GrantedAuthority::getAuthority).toList(),
            "principal", authentication.getPrincipal().getClass().getSimpleName(),
            "authenticated", authentication.isAuthenticated()
        ));
    }
    
    // Compliance Officer Management Endpoints
    
    @PostMapping("/compliance-officers")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> createComplianceOfficer(@RequestBody CreateUserDto createUserDto) {
        return ResponseEntity.ok(adminService.createComplianceOfficer(createUserDto));
    }
    
    @PostMapping("/compliance-officers/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> addComplianceOfficer(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.addComplianceOfficer(userId));
    }
    
    @PostMapping("/compliance-officers/{userId}/remove")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> removeComplianceOfficer(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.removeComplianceOfficer(userId));
    }
    
    @GetMapping("/compliance-officers")
    public ResponseEntity<List<UserDto>> getComplianceOfficers() {
        return ResponseEntity.ok(adminService.getComplianceOfficers());
    }
    
    // Customer Blocking Endpoints
    
    @PostMapping("/customers/{userId}/block")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> blockCustomer(@PathVariable Long userId, @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(adminService.blockCustomer(userId, reason));
    }
    
    @PostMapping("/customers/{userId}/unblock")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<UserDto> unblockCustomer(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.unblockCustomer(userId));
    }
    
    @GetMapping("/customers/blocked")
    public ResponseEntity<List<UserDto>> getBlockedCustomers() {
        return ResponseEntity.ok(adminService.getBlockedCustomers());
    }
    
    // Audit Log Endpoints
    
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllAuditLogs());
    }
    
    @GetMapping("/audit-logs/user/{username}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUsername(@PathVariable String username) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByUsername(username));
    }
    
    @GetMapping("/audit-logs/action/{action}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditLogService.getAuditLogsByAction(action));
    }

    // KYC Document Verification Endpoints
    @GetMapping("/kyc/documents/pending")
    public ResponseEntity<List<DocumentDTO>> getPendingKycDocuments() {
        return ResponseEntity.ok(documentService.getDocumentsByStatus(DocumentStatus.UPLOADED));
    }

    @PostMapping("/kyc/documents/{documentId}/verify")
    public ResponseEntity<DocumentDTO> verifyKycDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(documentService.verifyDocument(documentId));
    }

    @PostMapping("/kyc/documents/{documentId}/reject")
    public ResponseEntity<DocumentDTO> rejectKycDocument(@PathVariable Long documentId) {
        return ResponseEntity.ok(documentService.rejectDocument(documentId));
    }
}
