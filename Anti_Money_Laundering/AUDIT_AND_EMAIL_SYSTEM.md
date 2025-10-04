# AML System - Audit Logging and Email Notification System

## Overview

This document describes the comprehensive audit logging and email notification system implemented for the Anti-Money Laundering (AML) application. The system ensures all user actions are tracked and appropriate email notifications are sent for key events.

## Features Implemented

### 1. Comprehensive Audit Logging System

#### AuditLogService
- **Location**: `src/main/java/com/tss/aml/service/AuditLogService.java`
- **Purpose**: Centralized service for logging all user actions and system events
- **Key Methods**:
  - `logLogin()` - Logs user login events
  - `logAccountCreation()` - Logs bank account creation
  - `logAccountApproval()` - Logs account approval actions
  - `logAccountRejection()` - Logs account rejection actions
  - `logAccountSuspension()` - Logs account suspension
  - `logAccountActivation()` - Logs account activation
  - `logUserCreation()` - Logs new user creation
  - `logComplianceOfficerAdded()` - Logs compliance officer assignments
  - `logComplianceOfficerRemoved()` - Logs compliance officer removals
  - `logCustomerBlocked()` - Logs customer blocking actions
  - `logCustomerUnblocked()` - Logs customer unblocking actions
  - `logRuleCreation()` - Logs AML rule creation
  - `logEmailSent()` - Logs email notifications sent

#### Enhanced AuditLogRepository
- **Location**: `src/main/java/com/tss/aml/repository/AuditLogRepository.java`
- **New Query Methods**:
  - `findByUsernameOrderByTimestampDesc()` - Get logs by username
  - `findByActionOrderByTimestampDesc()` - Get logs by action type
  - `findByTimestampBetweenOrderByTimestampDesc()` - Get logs by date range
  - `findTop100ByOrderByTimestampDesc()` - Get recent 100 logs

### 2. Enhanced Email Notification System

#### EmailService Enhancements
- **Location**: `src/main/java/com/tss/aml/service/EmailService.java`
- **New Email Templates**:
  - **Login Success Email**: Sent on every successful login
  - **Bank Account Creation Request**: Sent when account creation is requested
  - **Account Approval Email**: Sent when account is approved
  - **Account Rejection Email**: Sent when account is rejected
  - **Account Suspension Email**: Sent when account is suspended
  - **Account Activation Email**: Sent when account is reactivated
  - **Compliance Officer Added**: Sent when user is assigned compliance officer role
  - **Compliance Officer Removed**: Sent when compliance officer role is revoked

#### Email Features
- **HTML Templates**: All emails use professional HTML templates
- **Audit Integration**: All sent emails are logged in audit system
- **Error Handling**: Email failures don't break application flow
- **Personalization**: Emails include user names, account numbers, timestamps

### 3. Admin Controls for Compliance Officers

#### New AdminService Methods
- **Location**: `src/main/java/com/tss/aml/service/AdminService.java`
- **Methods**:
  - `addComplianceOfficer(Long userId)` - Promote user to compliance officer
  - `removeComplianceOfficer(Long userId)` - Demote compliance officer to customer
  - `getComplianceOfficers()` - List all compliance officers
  - `blockCustomer(Long userId, String reason)` - Block customer and suspend accounts
  - `unblockCustomer(Long userId)` - Unblock customer
  - `getBlockedCustomers()` - List all blocked customers

#### Enhanced UserRepository
- **Location**: `src/main/java/com/tss/aml/repository/UserRepository.java`
- **New Query Methods**:
  - `findByRole(Role role)` - Find users by role
  - `findByIsEnabledFalse()` - Find blocked users
  - `findByIsEnabledTrue()` - Find active users

### 4. Customer Blocking Functionality

#### Features
- **User Blocking**: Admins can block/unblock customers
- **Account Suspension**: When customer is blocked, all their accounts are suspended
- **Audit Trail**: All blocking/unblocking actions are logged
- **Admin Protection**: Admin users cannot be blocked
- **Reason Tracking**: Optional reason can be provided for blocking

### 5. Enhanced Admin Controller

#### New API Endpoints
- **Location**: `src/main/java/com/tss/aml/controller/AdminController.java`

##### Compliance Officer Management
- `POST /api/admin/compliance-officers/{userId}` - Add compliance officer
- `POST /api/admin/compliance-officers/{userId}/remove` - Remove compliance officer
- `GET /api/admin/compliance-officers` - List compliance officers

##### Customer Management
- `POST /api/admin/customers/{userId}/block?reason=...` - Block customer
- `POST /api/admin/customers/{userId}/unblock` - Unblock customer
- `GET /api/admin/customers/blocked` - List blocked customers

##### Audit Log Access
- `GET /api/admin/audit-logs` - Get all audit logs
- `GET /api/admin/audit-logs/user/{username}` - Get logs by username
- `GET /api/admin/audit-logs/action/{action}` - Get logs by action type

## Integration Points

### 1. Login Process Enhancement
- **AuthService**: Updated to send login success emails and log login events
- **Automatic Email**: Every successful login triggers an email notification
- **IP Tracking**: Login events include IP address information

### 2. Bank Account Lifecycle
- **Creation**: Account creation requests trigger emails and audit logs
- **Approval**: Account approvals send congratulatory emails
- **Rejection**: Account rejections send notification emails with reasons
- **Suspension**: Account suspensions send warning emails
- **Activation**: Account reactivations send welcome back emails

### 3. User Management
- **User Creation**: New user creation is logged in audit system
- **Role Changes**: Compliance officer role changes trigger emails and logs
- **Account Blocking**: Customer blocking affects all user accounts

## Security Considerations

### 1. Admin-Only Operations
- All compliance officer management requires ADMIN or SUPER_ADMIN role
- Customer blocking/unblocking restricted to admin users
- Audit log access restricted to admin users

### 2. Data Protection
- Email failures don't expose sensitive information
- Audit logs capture actions without exposing passwords
- User blocking preserves data integrity

### 3. Error Handling
- Email service failures don't break core functionality
- Audit logging failures are logged but don't stop operations
- Database transaction integrity maintained

## Usage Examples

### 1. Block a Customer
```bash
POST /api/admin/customers/123/block?reason=Suspicious%20activity%20detected
```

### 2. Add Compliance Officer
```bash
POST /api/admin/compliance-officers/456
```

### 3. View Audit Logs for User
```bash
GET /api/admin/audit-logs/user/john.doe@example.com
```

### 4. Get All Login Events
```bash
GET /api/admin/audit-logs/action/LOGIN
```

## Database Schema Updates

### AuditLog Table
- Enhanced with better indexing for performance
- Supports complex queries for reporting
- Timestamp-based ordering for chronological tracking

### User Table
- `isEnabled` field used for blocking functionality
- Role-based queries for compliance officer management

### BankAccount Table
- Enhanced with user relationship queries
- Status tracking for suspension/activation

## Monitoring and Reporting

### 1. Audit Trail
- Complete audit trail of all system actions
- Searchable by user, action type, and date range
- Chronological ordering for investigation purposes

### 2. Email Tracking
- All sent emails are logged in audit system
- Failed email attempts are logged for troubleshooting
- Email types tracked for analytics

### 3. User Activity
- Login patterns tracked and logged
- Account management actions recorded
- Role changes documented with timestamps

## Future Enhancements

### 1. Advanced Reporting
- Dashboard for audit log visualization
- Email delivery statistics
- User activity analytics

### 2. Enhanced Notifications
- SMS notifications for critical events
- Push notifications for mobile apps
- Configurable notification preferences

### 3. Advanced Security
- Multi-factor authentication logging
- Suspicious activity pattern detection
- Automated blocking based on risk scores

## Troubleshooting

### 1. Email Issues
- Check email service configuration
- Verify SMTP settings
- Review audit logs for email failures

### 2. Audit Log Issues
- Check database connectivity
- Verify audit service injection
- Review application logs for errors

### 3. Permission Issues
- Verify user roles and authorities
- Check security configuration
- Review PreAuthorize annotations

## Conclusion

The enhanced AML system now provides comprehensive audit logging and email notifications for all critical operations. This ensures regulatory compliance, improves user experience, and provides administrators with powerful tools for managing compliance officers and customers.

All actions are tracked, all stakeholders are notified, and the system maintains a complete audit trail for regulatory reporting and investigation purposes.
