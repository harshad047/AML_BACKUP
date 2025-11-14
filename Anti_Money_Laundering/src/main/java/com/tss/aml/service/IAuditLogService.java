
package com.tss.aml.service;

import java.util.List;

import com.tss.aml.entity.AuditLog;

public interface IAuditLogService {

	void logAction(String action, String details);

	void logUserAction(String username, String action, String details);

	void logLogin(String username, String ipAddress);

	void logLoginAsync(String username, String ipAddress);

	void logLogout(String username);

	void logUserCreation(String createdBy, String newUsername, String role);

	void logUserUpdate(String updatedBy, String targetUsername, String changes);

	void logUserDeletion(String deletedBy, String deletedUsername);

	void logAccountCreation(String username, String accountNumber);

	void logAccountApproval(String approvedBy, String accountNumber, String accountOwner);

	void logAccountRejection(String rejectedBy, String accountNumber, String accountOwner, String reason);

	void logAccountSuspension(String suspendedBy, String accountNumber, String accountOwner);

	void logAccountActivation(String activatedBy, String accountNumber, String accountOwner);

	void logCustomerBlocked(String blockedBy, String customerUsername, String reason);

	void logCustomerUnblocked(String unblockedBy, String customerUsername);

	void logRuleCreation(String createdBy, String ruleName);

	void logRuleUpdate(String updatedBy, String ruleName, String changes);

	void logRuleDeletion(String deletedBy, String ruleName);

	void logTransactionProcessed(String username, String transactionId, String amount, String status);

	void logSuspiciousActivity(String detectedFor, String activityType, String details);

	void logComplianceOfficerAdded(String addedBy, String officerUsername);

	void logComplianceOfficerRemoved(String removedBy, String officerUsername);

	void logPasswordChange(String username);

	void logEmailSent(String recipient, String emailType);

	List<AuditLog> getAllAuditLogs();

	List<AuditLog> getAuditLogsByUsername(String username);

	List<AuditLog> getAuditLogsByAction(String action);
}
