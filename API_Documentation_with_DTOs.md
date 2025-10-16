# AML Banking System - Complete API Documentation with DTOs

## Overview
This document provides a comprehensive mapping of all API endpoints in the Anti Money Laundering Banking System with their corresponding DTOs, request/response formats, and role-based access control.

## Base URL
```
http://localhost:8080
```

## Authentication
All protected endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request DTO**: `LoginDto`
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response**: `AuthResponse`
```json
{
  "token": "string",
  "role": "string",
  "username": "string"
}
```

### 1.2 Send Forgot Password OTP
- **Endpoint**: `POST /api/auth/forgot-password/send-otp`
- **Access**: Public
- **Parameters**: `email` (query parameter)

### 1.3 Verify Forgot Password OTP
- **Endpoint**: `POST /api/auth/forgot-password/verify-otp`
- **Access**: Public
- **Parameters**: `email`, `otp` (query parameters)

### 1.4 Reset Password
- **Endpoint**: `POST /api/auth/forgot-password/reset`
- **Access**: Public
- **Request DTO**: `ForgotPasswordResetRequest`
```json
{
  "email": "string",
  "otp": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

---

## 2. Registration APIs (`/api/register`)

### 2.1 Register Customer
- **Endpoint**: `POST /api/register`
- **Access**: Public
- **Request DTO**: `RegistrationRequest`
```json
{
  "firstName": "string",
  "middleName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dob": "string",
  "password": "string",
  "role": "CUSTOMER",
  "street": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "recaptchaToken": "string"
}
```

### 2.2 Send Registration OTP
- **Endpoint**: `POST /api/register/send-otp`
- **Access**: Public
- **Parameters**: `email` (query parameter)

### 2.3 Verify Registration OTP
- **Endpoint**: `POST /api/register/verify-otp`
- **Access**: Public
- **Parameters**: `email`, `otp` (query parameters)

### 2.4 Check Registration Status
- **Endpoint**: `POST /api/register/check-status`
- **Access**: Public
- **Parameters**: `email` (query parameter)

### 2.5 Upload Registration Documents
- **Endpoint**: `POST /api/register/{customerId}/documents`
- **Access**: Public
- **Content-Type**: `multipart/form-data`
- **Parameters**: 
  - `file` (multipart file)
  - `docType` (string): PASSPORT, NATIONAL_ID, PROOF_OF_ADDRESS, BANK_STATEMENT

---

## 3. Bank Account APIs (`/api/accounts`)

### 3.1 Create Bank Account
- **Endpoint**: `POST /api/accounts`
- **Access**: CUSTOMER role required
- **Request DTO**: `CreateAccountDto`
```json
{
  "accountType": "SAVINGS|CHECKING|BUSINESS",
  "currency": "string",
  "initialBalance": "decimal"
}
```
- **Response**: `BankAccountDto`

### 3.2 Get User Accounts
- **Endpoint**: `GET /api/accounts`
- **Access**: CUSTOMER role required
- **Response**: `List<BankAccountDto>`

---

## 4. Transaction APIs (`/api/transactions`)

### 4.1 Deposit Money
- **Endpoint**: `POST /api/transactions/deposit`
- **Access**: CUSTOMER role required
- **Request DTO**: `DepositDto`
```json
{
  "toAccountNumber": "string",
  "amount": "decimal",
  "currency": "string",
  "description": "string"
}
```
- **Response**: `TransactionDto`

### 4.2 Withdraw Money
- **Endpoint**: `POST /api/transactions/withdraw`
- **Access**: CUSTOMER role required
- **Request DTO**: `WithdrawalDto`
```json
{
  "fromAccountNumber": "string",
  "amount": "decimal",
  "currency": "string",
  "description": "string"
}
```
- **Response**: `TransactionDto`

### 4.3 Transfer Money
- **Endpoint**: `POST /api/transactions/transfer`
- **Access**: CUSTOMER role required
- **Request DTO**: `TransferDto`
```json
{
  "fromAccountNumber": "string",
  "toAccountNumber": "string",
  "amount": "decimal",
  "currency": "string",
  "description": "string",
  "receiverCountryCode": "string"
}
```
- **Response**: `TransactionDto`

### 4.4 Intercurrency Transfer
- **Endpoint**: `POST /api/transactions/intercurrency-transfer`
- **Access**: CUSTOMER role required
- **Request DTO**: `IntercurrencyTransferDto`
```json
{
  "fromAccountNumber": "string",
  "toAccountNumber": "string",
  "amount": "decimal",
  "fromCurrency": "string",
  "toCurrency": "string",
  "description": "string",
  "receiverCountryCode": "string"
}
```
- **Response**: `TransactionDto`

### 4.5 Calculate Currency Conversion
- **Endpoint**: `POST /api/transactions/currency-conversion/calculate`
- **Access**: CUSTOMER role required
- **Request DTO**: `CurrencyConversionDto`
```json
{
  "fromCurrency": "string",
  "toCurrency": "string",
  "amount": "decimal"
}
```
- **Response**: `CurrencyConversionDto` (with calculated fields)

### 4.6 Get Transaction History
- **Endpoint**: `GET /api/transactions/history`
- **Access**: CUSTOMER role required
- **Response**: `List<TransactionDto>`

### 4.7 Get Account Transaction History
- **Endpoint**: `GET /api/transactions/history/{accountNumber}`
- **Access**: CUSTOMER role required
- **Response**: `List<TransactionDto>`

### 4.8 Get Account Balance
- **Endpoint**: `GET /api/transactions/balance/{accountNumber}`
- **Access**: CUSTOMER role required
- **Response**: `BalanceDto`

### 4.9 Get Transaction Status
- **Endpoint**: `GET /api/transactions/status/{transactionId}`
- **Access**: CUSTOMER role required
- **Response**: `TransactionDto`

---

## 5. Admin APIs (`/api/admin`)

### 5.1 User Management

#### 5.1.1 Get All Users
- **Endpoint**: `GET /api/admin/users`
- **Access**: ADMIN role required
- **Response**: `List<UserDto>`

#### 5.1.2 Create User
- **Endpoint**: `POST /api/admin/users`
- **Access**: ADMIN role required
- **Request DTO**: `CreateUserDto`
```json
{
  "firstName": "string",
  "lastName": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "ADMIN|OFFICER|CUSTOMER"
}
```
- **Response**: `UserDto`

### 5.2 Account Management

#### 5.2.1 Get Pending Accounts
- **Endpoint**: `GET /api/admin/accounts/pending`
- **Access**: ADMIN role required
- **Response**: `List<BankAccountDto>`

#### 5.2.2 Approve Account
- **Endpoint**: `POST /api/admin/accounts/{id}/approve`
- **Access**: ADMIN role required
- **Response**: `BankAccountDto`

#### 5.2.3 Reject Account
- **Endpoint**: `POST /api/admin/accounts/{id}/reject`
- **Access**: ADMIN role required
- **Response**: `BankAccountDto`

#### 5.2.4 Get All Accounts
- **Endpoint**: `GET /api/admin/accounts`
- **Access**: ADMIN role required
- **Response**: `List<BankAccountDto>`

#### 5.2.5 Get Account by ID
- **Endpoint**: `GET /api/admin/accounts/{id}`
- **Access**: ADMIN role required
- **Response**: `BankAccountDto`

#### 5.2.6 Suspend Account
- **Endpoint**: `POST /api/admin/accounts/{id}/suspend`
- **Access**: ADMIN role required
- **Response**: `BankAccountDto`

#### 5.2.7 Activate Account
- **Endpoint**: `POST /api/admin/accounts/{id}/activate`
- **Access**: ADMIN role required
- **Response**: `BankAccountDto`

### 5.3 KYC Document Management

#### 5.3.1 Get Pending KYC Documents
- **Endpoint**: `GET /api/admin/kyc/documents/pending`
- **Access**: ADMIN role required
- **Response**: `List<DocumentDTO>`

#### 5.3.2 Verify KYC Document
- **Endpoint**: `POST /api/admin/kyc/documents/{documentId}/verify`
- **Access**: ADMIN role required
- **Response**: `DocumentDTO`

#### 5.3.3 Reject KYC Document
- **Endpoint**: `POST /api/admin/kyc/documents/{documentId}/reject`
- **Access**: ADMIN role required
- **Response**: `DocumentDTO`

### 5.4 Rules & Keywords Management

#### 5.4.1 Get All Rules
- **Endpoint**: `GET /api/admin/rules`
- **Access**: ADMIN role required
- **Response**: `List<RuleDto>`

#### 5.4.2 Create Rule
- **Endpoint**: `POST /api/admin/rules`
- **Access**: ADMIN role required
- **Request DTO**: `RuleDto`
- **Response**: `RuleDto`

#### 5.4.3 Update Rule
- **Endpoint**: `PUT /api/admin/rules/{id}`
- **Access**: ADMIN role required
- **Request DTO**: `RuleDto`
- **Response**: `RuleDto`

#### 5.4.4 Delete Rule
- **Endpoint**: `DELETE /api/admin/rules/{id}`
- **Access**: ADMIN role required

#### 5.4.5 Get All Keywords
- **Endpoint**: `GET /api/admin/keywords`
- **Access**: ADMIN role required
- **Response**: `List<SuspiciousKeywordDto>`

#### 5.4.6 Add Keyword
- **Endpoint**: `POST /api/admin/keywords`
- **Access**: ADMIN role required
- **Request DTO**: `SuspiciousKeywordDto`
- **Response**: `SuspiciousKeywordDto`

### 5.5 Country Risk Management

#### 5.5.1 Get Country Risks
- **Endpoint**: `GET /api/admin/country-risks`
- **Access**: ADMIN role required
- **Response**: `List<CountryRiskDto>`

#### 5.5.2 Create Country Risk
- **Endpoint**: `POST /api/admin/country-risks`
- **Access**: ADMIN role required
- **Request DTO**: `CountryRiskDto`
- **Response**: `CountryRiskDto`

#### 5.5.3 Update Country Risk
- **Endpoint**: `PUT /api/admin/country-risks/{id}`
- **Access**: ADMIN role required
- **Request DTO**: `CountryRiskDto`
- **Response**: `CountryRiskDto`

#### 5.5.4 Delete Country Risk
- **Endpoint**: `DELETE /api/admin/country-risks/{id}`
- **Access**: ADMIN role required

### 5.6 Compliance Officer Management

#### 5.6.1 Create Compliance Officer
- **Endpoint**: `POST /api/admin/compliance-officers`
- **Access**: ADMIN role required
- **Request DTO**: `CreateUserDto`
- **Response**: `UserDto`

#### 5.6.2 Add Compliance Officer
- **Endpoint**: `POST /api/admin/compliance-officers/{userId}`
- **Access**: ADMIN role required
- **Response**: `UserDto`

#### 5.6.3 Remove Compliance Officer
- **Endpoint**: `POST /api/admin/compliance-officers/{userId}/remove`
- **Access**: ADMIN role required
- **Response**: `UserDto`

#### 5.6.4 Get Compliance Officers
- **Endpoint**: `GET /api/admin/compliance-officers`
- **Access**: ADMIN role required
- **Response**: `List<UserDto>`

### 5.7 Customer Blocking

#### 5.7.1 Block Customer
- **Endpoint**: `POST /api/admin/customers/{userId}/block`
- **Access**: ADMIN role required
- **Parameters**: `reason` (optional query parameter)
- **Response**: `UserDto`

#### 5.7.2 Unblock Customer
- **Endpoint**: `POST /api/admin/customers/{userId}/unblock`
- **Access**: ADMIN role required
- **Response**: `UserDto`

#### 5.7.3 Get Blocked Customers
- **Endpoint**: `GET /api/admin/customers/blocked`
- **Access**: ADMIN role required
- **Response**: `List<UserDto>`

### 5.8 Audit Logs

#### 5.8.1 Get All Audit Logs
- **Endpoint**: `GET /api/admin/audit-logs`
- **Access**: ADMIN role required
- **Response**: `List<AuditLog>`

#### 5.8.2 Get Audit Logs by Username
- **Endpoint**: `GET /api/admin/audit-logs/user/{username}`
- **Access**: ADMIN role required
- **Response**: `List<AuditLog>`

#### 5.8.3 Get Audit Logs by Action
- **Endpoint**: `GET /api/admin/audit-logs/action/{action}`
- **Access**: ADMIN role required
- **Response**: `List<AuditLog>`

---

## 6. Compliance APIs (`/api/compliance`)

### 6.1 Alert Management

#### 6.1.1 Get All Open Alerts
- **Endpoint**: `GET /api/compliance/alerts`
- **Access**: OFFICER role required
- **Response**: `List<AlertDto>`

#### 6.1.2 Get Alert by ID
- **Endpoint**: `GET /api/compliance/alerts/{id}`
- **Access**: OFFICER role required
- **Response**: `AlertDto`

#### 6.1.3 Create Case from Alert
- **Endpoint**: `POST /api/compliance/alerts/{id}/case`
- **Access**: OFFICER role required
- **Response**: `CaseDto`

### 6.2 Transaction Management

#### 6.2.1 Get Flagged Transactions
- **Endpoint**: `GET /api/compliance/transactions/flagged`
- **Access**: OFFICER role required
- **Response**: `List<TransactionDto>`

#### 6.2.2 Get All Transactions
- **Endpoint**: `GET /api/compliance/transactions/all`
- **Access**: OFFICER role required
- **Response**: `List<TransactionDto>`

#### 6.2.3 Get Blocked Transactions
- **Endpoint**: `GET /api/compliance/transactions/blocked`
- **Access**: OFFICER role required
- **Response**: `List<TransactionDto>`

#### 6.2.4 Get Transactions for Review
- **Endpoint**: `GET /api/compliance/transactions/review`
- **Access**: OFFICER role required
- **Response**: `List<TransactionDto>`

#### 6.2.5 Approve Transaction
- **Endpoint**: `POST /api/compliance/transactions/{transactionId}/approve`
- **Access**: OFFICER role required
- **Response**: `TransactionDto`

#### 6.2.6 Reject Transaction
- **Endpoint**: `POST /api/compliance/transactions/{transactionId}/reject`
- **Access**: OFFICER role required
- **Parameters**: `reason` (optional query parameter)
- **Response**: `TransactionDto`

### 6.3 Case Management

#### 6.3.1 Get Cases Under Investigation
- **Endpoint**: `GET /api/compliance/cases/under-investigation`
- **Access**: OFFICER role required
- **Response**: `List<CaseDto>`

#### 6.3.2 Get Resolved Cases
- **Endpoint**: `GET /api/compliance/cases/resolved`
- **Access**: OFFICER role required
- **Response**: `List<CaseDto>`

#### 6.3.3 Get Case by ID
- **Endpoint**: `GET /api/compliance/cases/{caseId}`
- **Access**: OFFICER role required
- **Response**: `CaseDto`

#### 6.3.4 Add Note to Case
- **Endpoint**: `POST /api/compliance/cases/{id}/notes`
- **Access**: OFFICER role required
- **Request DTO**: `NoteDto`
```json
{
  "content": "string"
}
```
- **Response**: `CaseDto`

---

## 7. Customer APIs (`/api/customer`)

### 7.1 Get Customer Profile
- **Endpoint**: `GET /api/customer/profile`
- **Access**: CUSTOMER role required
- **Response**: `Customer` entity

### 7.2 Update Customer Profile
- **Endpoint**: `PUT /api/customer/profile`
- **Access**: CUSTOMER role required
- **Request DTO**: `ProfileUpdateRequest`
```json
{
  "firstName": "string",
  "middleName": "string",
  "lastName": "string",
  "phone": "string",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string"
  }
}
```
- **Response**: `Customer` entity

### 7.3 Get KYC Status
- **Endpoint**: `GET /api/customer/kyc-status`
- **Access**: CUSTOMER role required
- **Response**: `KycStatusResponse`
```json
{
  "kycStatus": "string",
  "message": "string"
}
```

### 7.4 Send Change Password OTP
- **Endpoint**: `POST /api/customer/change-password/send-otp`
- **Access**: CUSTOMER role required

### 7.5 Change Password
- **Endpoint**: `POST /api/customer/change-password`
- **Access**: CUSTOMER role required
- **Request DTO**: `ChangePasswordRequest`
```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "otp": "string"
}
```

---

## 8. Document APIs (`/api/documents`)

### 8.1 Upload Document
- **Endpoint**: `POST /api/documents/upload`
- **Access**: CUSTOMER role required
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file` (multipart file)
  - `docType` (string): Document type

### 8.2 Get My Documents
- **Endpoint**: `GET /api/documents/my`
- **Access**: CUSTOMER role required
- **Response**: `List<Document>`

---

## 9. Currency APIs (`/api/currency`)

### 9.1 Get Supported Currency Pairs
- **Endpoint**: `GET /api/currency/supported-pairs`
- **Access**: Public
- **Response**: `List<String>`

### 9.2 Calculate Currency Conversion
- **Endpoint**: `POST /api/currency/conversion/calculate`
- **Access**: CUSTOMER role required
- **Request DTO**: `CurrencyConversionDto`
- **Response**: `CurrencyConversionDto` (with calculated fields)

### 9.3 Check Currency Pair Support
- **Endpoint**: `GET /api/currency/supported/{fromCurrency}/{toCurrency}`
- **Access**: CUSTOMER role required
- **Response**: `Boolean`

---

## 10. Customer Alert APIs (`/api/customer/alerts`)

### 10.1 Get My Alerts
- **Endpoint**: `GET /api/customer/alerts`
- **Access**: CUSTOMER role required
- **Response**: `List<AlertDto>`

### 10.2 Get Alert Details
- **Endpoint**: `GET /api/customer/alerts/{alertId}`
- **Access**: CUSTOMER role required
- **Response**: `AlertDto`

### 10.3 Get Alerts for Transaction
- **Endpoint**: `GET /api/customer/alerts/transaction/{transactionId}`
- **Access**: CUSTOMER role required
- **Response**: `List<AlertDto>`

---

## Role-Based Access Summary

| Role | Access Level | Description |
|------|-------------|-------------|
| **Public** | No authentication required | Login, registration, password reset |
| **CUSTOMER** | Customer role required | Banking operations, profile management, KYC |
| **OFFICER** | Compliance officer role required | Transaction monitoring, alerts, case management |
| **ADMIN** | Admin role required | User management, account approval, system configuration |

## Common DTOs Structure

### AccountType Enum
- `SAVINGS`
- `CHECKING` 
- `BUSINESS`

### DocumentType Enum
- `PASSPORT`
- `NATIONAL_ID`
- `PROOF_OF_ADDRESS`
- `BANK_STATEMENT`

### KYC Status Enum
- `PENDING`
- `UNDER_REVIEW`
- `APPROVED`
- `REJECTED`

### Transaction Status Enum
- `PENDING`
- `COMPLETED`
- `FAILED`
- `BLOCKED`
- `FLAGGED`

### Account Status Enum
- `SUSPENDED`
- `PENDING`
- `ACTIVE`
- `BLOCKED`

## Error Responses

All endpoints return standard HTTP status codes with error messages in JSON format:

```json
{
  "error": "string",
  "message": "string",
  "timestamp": "string"
}
```

## Notes

1. **JWT Token**: Required for all protected endpoints. Obtain from login endpoint.
2. **File Uploads**: Use `multipart/form-data` content type for document uploads.
3. **Validation**: All request DTOs include validation annotations for required fields.
4. **Currency Support**: System supports multiple currencies with automatic conversion.
5. **AML Compliance**: All transactions go through risk assessment and compliance checks.
6. **Audit Trail**: All operations are logged for compliance and audit purposes.
