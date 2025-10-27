# Anti-Money Laundering (AML) System

This is a comprehensive Anti-Money Laundering (AML) system designed to detect and prevent financial crimes. The application is built with Java and the Spring Boot framework, providing a robust and scalable solution for monitoring transactions and ensuring compliance with AML regulations.

## Project Structure

The project follows a standard layered architecture, with distinct packages for different functionalities:

- `controller`: Defines the REST API endpoints for interacting with the system.
- `service`: Contains the core business logic for transaction monitoring, risk assessment, and user management.
- `repository`: Manages data access and communication with the database.
- `entity`: Represents the database schema and data models.
- `security`: Handles user authentication, authorization, and other security-related features.
- `config`: Contains application-level configurations.
- `dto`: Data Transfer Objects (DTOs) for clean and efficient data exchange between layers.
- `util`: Includes utility classes and helper functions.

## Core Features

- **User Authentication**: Secure user authentication and role-based access control.
- **Transaction Monitoring**: Real-time monitoring of financial transactions to identify suspicious activities.
- **Risk Assessment**: A sophisticated risk assessment engine to evaluate the risk associated with transactions and customers.
- **Case Management**: A system for creating and managing cases for suspicious transactions that require further investigation.
- **Reporting**: Generation of reports for regulatory compliance and internal audits.

## API Endpoints

### Admin Controller (`/api/admin`)

- `GET /users`: Get all users.
- `POST /users`: Create a new user.
- `GET /rules`: Get all rules.
- `POST /rules`: Create a new rule.
- `GET /keywords`: Get all suspicious keywords.
- `POST /keywords`: Add a new suspicious keyword.
- `GET /accounts/pending`: Get all pending bank accounts.
- `POST /accounts/{id}/approve`: Approve a bank account.
- `POST /accounts/{id}/reject`: Reject a bank account.
- `GET /accounts`: Get all bank accounts.
- `GET /accounts/{id}`: Get a bank account by ID.
- `POST /accounts/{id}/suspend`: Suspend a bank account.
- `POST /accounts/{id}/activate`: Activate a bank account.
- `POST /compliance-officers`: Create a compliance officer.
- `POST /compliance-officers/{userId}`: Add a compliance officer role to a user.
- `POST /compliance-officers/{userId}/remove`: Remove a compliance officer role from a user.
- `GET /compliance-officers`: Get all compliance officers.
- `POST /customers/{userId}/block`: Block a customer.
- `POST /customers/{userId}/unblock`: Unblock a customer.
- `GET /customers/blocked`: Get all blocked customers.
- `GET /audit-logs`: Get all audit logs.
- `GET /audit-logs/user/{username}`: Get audit logs for a specific user.
- `GET /audit-logs/action/{action}`: Get audit logs for a specific action.

### Auth Controller (`/api/auth`)

- `POST /login`: Authenticate a user and get a JWT token.

### Bank Account Controller (`/api/accounts`)

- `POST /`: Create a new bank account.
- `GET /`: Get all bank accounts for the authenticated user.

### Compliance Controller (`/api/compliance`)

- `GET /alerts`: Get all open alerts.
- `GET /alerts/{id}`: Get an alert by ID.
- `POST /alerts/{id}/case`: Create a case from an alert.
- `POST /cases/{id}/notes`: Add a note to a case.
- `POST /transactions/{transactionId}/approve`: Approve a transaction.
- `POST /transactions/{transactionId}/reject`: Reject a transaction.
- `GET /transactions/flagged`: Get all flagged transactions.
- `GET /transactions/blocked`: Get all blocked transactions.
- `GET /transactions/review`: Get all transactions for review.
- `GET /transactions/{transactionId}`: Get transaction details by ID.
- `GET /cases/under-investigation`: Get all cases under investigation.
- `GET /cases/resolved`: Get all resolved cases.
- `GET /cases/{caseId}`: Get a case by ID.

### Customer Alert Controller (`/api/customer/alerts`)

- `GET /`: Get all alerts for the authenticated customer.
- `GET /{alertId}`: Get alert details by ID.
- `GET /transaction/{transactionId}`: Get all alerts for a specific transaction.

### Customer Controller (`/api/customer`)

- `GET /profile`: Get the profile of the authenticated customer.
- `GET /kyc-status`: Get the KYC status of the authenticated customer.

### Document Controller (`/api/documents`)

- `POST /upload`: Upload a document.

### Registration Controller (`/api/register`)

- `POST /`: Register a new customer.
- `POST /verify-otp`: Verify the OTP sent to the user's email.
- `POST /{customerId}/documents`: Upload documents for a customer.

### Transaction Controller (`/api/transactions`)

- `POST /deposit`: Deposit money into an account.
- `POST /withdraw`: Withdraw money from an account.
- `POST /transfer`: Transfer money between accounts.
- `GET /history`: Get the transaction history for the authenticated user.
- `GET /history/{accountNumber}`: Get the transaction history for a specific account.
- `GET /balance/{accountNumber}`: Get the balance of a specific account.
- `GET /status/{transactionId}`: Get the status of a specific transaction.

## Business Logic (`service` layer)

This section provides an overview of the core business logic implemented in the service layer.

### AdminService
Handles all administrative functionalities, including:
- User management (creating users, assigning roles).
- Rule management for the transaction monitoring system.
- Managing suspicious keywords.
- Overseeing bank accounts (approving, rejecting, suspending, activating).
- Managing compliance officers.
- Blocking and unblocking customers.

### AlertService
Manages alerts generated by the system. It allows customers to view alerts related to their own transactions, ensuring data privacy and security.

### AuditLogService
Provides a comprehensive logging mechanism for all significant actions within the application. It records user actions, account management events, rule changes, and transaction processing, which is crucial for compliance and security auditing.

### AuthService
Handles user authentication. It validates user credentials and generates a JWT token upon successful login. It also logs login events and sends a notification email to the user.

### BankAccountService
Manages customer bank accounts. It handles the creation of new accounts, which are initially set to a `PENDING` status, and allows users to retrieve a list of their accounts.

### ComplianceService
Provides functionalities for compliance officers, including:
- Viewing open alerts.
- Creating investigation cases from alerts.
- Adding notes to cases.
- Reviewing transactions that have been flagged or blocked by the system.

### RegistrationService
Manages the customer registration process. It handles the creation of new customer and user accounts, sends an OTP for email verification, and manages the uploading of KYC documents.

### TransactionService
Processes all financial transactions (deposits, withdrawals, and transfers). It performs a pre-transaction risk assessment using the `RuleEngineService` and `SuspiciousKeywordService`. Based on a combined risk score, a transaction is either `APPROVED`, `FLAGGED` for manual review, or `BLOCKED`.

## Data Model (`entity` layer)

This section describes the database schema and the relationships between the different entities.

- **User**: Represents an authenticated user in the system, with roles such as `CUSTOMER`, `OFFICER`, `ADMIN`, or `SUPER_ADMIN`.
- **Customer**: Contains detailed information about a customer, including personal details and an embedded `Address`. Each customer has a `KycStatus` and is linked to their `Documents`.
- **Address**: An embeddable entity that stores the physical address of a customer.
- **BankAccount**: Represents a customer's bank account. It is linked to a `User` and has an `AccountType`, `AccountStatus`, and `ApprovalStatus`.
- **Transaction**: Records all financial transactions. It includes details such as the transaction type, amount, risk scores, and the accounts involved.
- **Alert**: Created when a transaction's risk score exceeds a predefined threshold. It is linked to a `Transaction` and has a status of `OPEN`, `RESOLVED`, or `ESCALATED`.
- **Case**: An investigation case generated from an `Alert`. It is assigned to a compliance officer and contains `InvestigationNotes`.
- **InvestigationNote**: A note added by a compliance officer during the investigation of a `Case`.
- **AuditLog**: Logs all significant actions performed in the system for security and compliance auditing.
- **Rule**: Defines a specific rule for the transaction monitoring engine, containing one or more `RuleConditions`.
- **RuleCondition**: A specific condition within a `Rule`, such as checking the transaction amount or country risk.
- **CountryRisk**: Stores the risk score associated with different countries, used by the rule engine.
- **SuspiciousKeyword**: A list of keywords that are considered suspicious. These are used to calculate a risk score for transactions based on their description.
- **Document**: Represents a KYC document uploaded by a customer. It is linked to a `Customer` and has a `DocumentStatus`.

## Project Documentation Complete

This `README.md` file now provides a comprehensive overview of the Anti-Money Laundering system, including its architecture, API endpoints, business logic, and data model. If you have any further questions or need more details on a specific part of the application, feel free to ask!
