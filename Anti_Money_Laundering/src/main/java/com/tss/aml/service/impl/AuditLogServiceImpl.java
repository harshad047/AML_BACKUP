package com.tss.aml.service.impl;

import com.tss.aml.entity.AuditLog;
import com.tss.aml.repository.AuditLogRepository;
import com.tss.aml.service.IAuditLogService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements IAuditLogService{

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String action, String details) {
        try {
            String username = getCurrentUsername();
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(username);
            auditLog.setAction(action);
            auditLog.setDetails(details);
            auditLog.setTimestamp(LocalDateTime.now());
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created: {} - {} - {}", username, action, details);
        } catch (Exception e) {
            log.error("Failed to create audit log for action: {}", action, e);
        }
    }

    @Transactional
    public void logUserAction(String username, String action, String details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(username);
            auditLog.setAction(action);
            auditLog.setDetails(details);
            auditLog.setTimestamp(LocalDateTime.now());
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created: {} - {} - {}", username, action, details);
        } catch (Exception e) {
            log.error("Failed to create audit log for user: {} action: {}", username, action, e);
        }
    }

    public void logLogin(String username, String ipAddress) {
        logUserAction(username, "LOGIN", 
            String.format("User logged in from IP: %s at %s", 
                ipAddress != null ? ipAddress : "unknown", LocalDateTime.now()));
    }
    
    // Async version for login - doesn't block the login response
    @Async("taskExecutor")
    @Transactional
    public void logLoginAsync(String username, String ipAddress) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUsername(username);
            auditLog.setAction("LOGIN");
            auditLog.setDetails(String.format("User logged in from IP: %s at %s", 
                ipAddress != null ? ipAddress : "unknown", LocalDateTime.now()));
            auditLog.setTimestamp(LocalDateTime.now());
            
            auditLogRepository.save(auditLog);
            log.info("Audit log created (async): {} - LOGIN - IP: {}", username, ipAddress);
        } catch (Exception e) {
            log.error("Failed to create async audit log for login: {}", username, e);
        }
    }

    public void logLogout(String username) {
        logUserAction(username, "LOGOUT", 
            String.format("User logged out at %s", LocalDateTime.now()));
    }

    public void logUserCreation(String createdBy, String newUsername, String role) {
        logUserAction(createdBy, "USER_CREATED", 
            String.format("Created new user: %s with role: %s", newUsername, role));
    }

    public void logUserUpdate(String updatedBy, String targetUsername, String changes) {
        logUserAction(updatedBy, "USER_UPDATED", 
            String.format("Updated user: %s. Changes: %s", targetUsername, changes));
    }

    public void logUserDeletion(String deletedBy, String deletedUsername) {
        logUserAction(deletedBy, "USER_DELETED", 
            String.format("Deleted user: %s", deletedUsername));
    }

    public void logAccountCreation(String username, String accountNumber) {
        logUserAction(username, "ACCOUNT_CREATED", 
            String.format("Bank account created: %s", accountNumber));
    }

    public void logAccountApproval(String approvedBy, String accountNumber, String accountOwner) {
        logUserAction(approvedBy, "ACCOUNT_APPROVED", 
            String.format("Approved bank account: %s for user: %s", accountNumber, accountOwner));
    }

    public void logAccountRejection(String rejectedBy, String accountNumber, String accountOwner, String reason) {
        logUserAction(rejectedBy, "ACCOUNT_REJECTED", 
            String.format("Rejected bank account: %s for user: %s. Reason: %s", 
                accountNumber, accountOwner, reason != null ? reason : "Not specified"));
    }

    public void logAccountSuspension(String suspendedBy, String accountNumber, String accountOwner) {
        logUserAction(suspendedBy, "ACCOUNT_SUSPENDED", 
            String.format("Suspended bank account: %s for user: %s", accountNumber, accountOwner));
    }

    public void logAccountActivation(String activatedBy, String accountNumber, String accountOwner) {
        logUserAction(activatedBy, "ACCOUNT_ACTIVATED", 
            String.format("Activated bank account: %s for user: %s", accountNumber, accountOwner));
    }

    public void logCustomerBlocked(String blockedBy, String customerUsername, String reason) {
        logUserAction(blockedBy, "CUSTOMER_BLOCKED", 
            String.format("Blocked customer: %s. Reason: %s", customerUsername, reason));
    }

    public void logCustomerUnblocked(String unblockedBy, String customerUsername) {
        logUserAction(unblockedBy, "CUSTOMER_UNBLOCKED", 
            String.format("Unblocked customer: %s", customerUsername));
    }

    public void logRuleCreation(String createdBy, String ruleName) {
        logUserAction(createdBy, "RULE_CREATED", 
            String.format("Created new rule: %s", ruleName));
    }

    public void logRuleUpdate(String updatedBy, String ruleName, String changes) {
        logUserAction(updatedBy, "RULE_UPDATED", 
            String.format("Updated rule: %s. Changes: %s", ruleName, changes));
    }

    public void logRuleDeletion(String deletedBy, String ruleName) {
        logUserAction(deletedBy, "RULE_DELETED", 
            String.format("Deleted rule: %s", ruleName));
    }

    public void logTransactionProcessed(String username, String transactionId, String amount, String status) {
        logUserAction(username, "TRANSACTION_PROCESSED", 
            String.format("Transaction %s processed. Amount: %s, Status: %s", 
                transactionId, amount, status));
    }

    public void logSuspiciousActivity(String detectedFor, String activityType, String details) {
        logUserAction("SYSTEM", "SUSPICIOUS_ACTIVITY_DETECTED", 
            String.format("Suspicious activity detected for user: %s. Type: %s. Details: %s", 
                detectedFor, activityType, details));
    }

    public void logComplianceOfficerAdded(String addedBy, String officerUsername) {
        logUserAction(addedBy, "COMPLIANCE_OFFICER_ADDED", 
            String.format("Added compliance officer: %s", officerUsername));
    }

    public void logComplianceOfficerRemoved(String removedBy, String officerUsername) {
        logUserAction(removedBy, "COMPLIANCE_OFFICER_REMOVED", 
            String.format("Removed compliance officer: %s", officerUsername));
    }

    public void logPasswordChange(String username) {
        logUserAction(username, "PASSWORD_CHANGED", 
            String.format("User changed password at %s", LocalDateTime.now()));
    }

    public void logEmailSent(String recipient, String emailType) {
        logAction("EMAIL_SENT", 
            String.format("Email sent to: %s, Type: %s", recipient, emailType));
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    public List<AuditLog> getAuditLogsByUsername(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username);
    }

    public List<AuditLog> getAuditLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }
}
