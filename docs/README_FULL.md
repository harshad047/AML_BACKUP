# Anti-Money Laundering (AML) Monitoring System — Full Execution Guide

This document explains the full project execution flow across the Angular frontend and Spring Boot backend, the role-specific features (Customer, Admin, Compliance), the transaction lifecycles (deposit, withdrawal, same-currency and inter-currency transfers), the risk engine (rules + NLP keywords), and the alert/case management process.

Use this as the definitive guide for onboarding, debugging, and extending the system.

- Project root: AML_BACKUP/
- Frontend: aml-frontend/
- Backend: Anti_Money_Laundering/

Links:
- Database overview: ../db.png
- Sequence overview: ../sequence.png

# 1. Architecture Overview

- Frontend: Angular 17, Material Design 3, RxJS, standalone components, feature-first structure.
- Backend: Spring Boot 3.x, Java 17, Spring Security (JWT), JPA, ModelMapper.
- Database: MySQL.
- Storage: Cloudinary (documents).
- Roles: CUSTOMER, ADMIN, COMPLIANCE (guards and route-level authorization).
- Communication: REST (JSON), Bearer tokens.

# 2. Environment & Setup

- Backend
  - Java 17+, Maven 3.6+
  - MySQL 8+ running, schema: aml
  - Configure environment properties (DB, JWT, SMTP, Cloudinary) in application.properties using env variables.
  - Run: mvn clean install && mvn spring-boot:run (http://localhost:8080)

- Frontend
  - Node 18+, Angular CLI 17+
  - Run: npm install && ng serve (http://localhost:4200)

# 3. High-level Flow of Execution

- Authentication
  - Login returns JWT; frontend stores token and sets auth header on API calls.
  - Role-based routing determines primary dashboard and access scope.

- Transaction submission (Customer)
  - Customer uses New Transaction UI to submit DEPOSIT/WITHDRAWAL/TRANSFER.
  - UI validates form (amount > 0, accounts required, different accounts for transfer).
  - Submits to /api/transactions/* (see Endpoints section).

- Backend processing
  - Controller accepts DTO, forwards to TransactionServiceImpl.
  - Pre-checks: account approval status, account active, funds sufficiency.
  - Risk assessment: NLP keyword score + Rule Engine probabilistic score.
  - Decision: APPROVED, FLAGGED, or BLOCKED based on combined thresholds.
  - Persist transaction status; create alert if risk threshold exceeded.
  - If APPROVED, execute balance updates immediately; if FLAGGED/BLOCKED no fund movement.

- Compliance review (FLAGGED/BLOCKED)
  - Alert appears in compliance dashboard.
  - Officer can approve (execute funds movement, resolve alert/case) or reject (resolve alert/case, no movement).

# 4. Frontend Flow (Angular)

- Core building blocks
  - AuthService: JWT login, token storage, role extract; HTTP interceptors attach token.
  - Guards: route protection by role (Customer/Admin/Compliance).
  - TransactionService: deposit/withdraw/transfer/intercurrency-transfer and helpers (history, balance, conversion preview).
  - AccountService: list user accounts, balances.

- New Transaction UI
  - Component: features/customer/new-transaction/CustomerNewTransactionComponent
  - Validates fields depending on type (toAccount for deposit, fromAccount for withdrawal, both for transfer).
  - Displays currency symbol based on selected account; backend is the source of truth for currency.
  - Calls:
    - POST /api/transactions/deposit
    - POST /api/transactions/withdraw
    - POST /api/transactions/transfer
    - POST /api/transactions/intercurrency-transfer (optional explicit use; also auto-detected by backend)
  - Success/Failure surfaced via toast; response contains TransactionDto with status and (if applicable) alert link.

- Admin & Compliance UIs
  - Admin: customer approvals, users, rules, statistics, reports/analytics.
  - Compliance: alert queues, case management, investigation notes, approve/reject transactions.

# 5. Backend Flow (Spring Boot)

- Controllers expose REST endpoints; all transaction endpoints require CUSTOMER authority.
- TransactionServiceImpl orchestrates:
  - Account validations
  - Risk assessment (nlp + rules)
  - Transaction persistence (initially PENDING, updated after risk)
  - Alert creation for risky transactions
  - Balance updates for APPROVED outcomes
  - Manual approval/rejection paths (compliance)

- CurrencyExchangeService
  - Calculates conversion rate, charges, total debit for inter-currency transfers
  - Validates sufficient funds including charges
  - Supports listing supported currency pairs

- RuleEngineServiceImpl
  - Loads active rules ordered by priority
  - Evaluates conditions via pluggable evaluators (AND logic within a rule)
  - Risk aggregation via noisy-OR over rule risk weights → probability → 0–100 score
  - BLOCK rules short-circuit evaluation
  - Execution logs written to aml_rule_execution_log

# 6. Role-specific Features and Permissions

- Customer
  - Register with document capture; OTP verification; account remains disabled until admin approval.
  - Login and view dashboard with accounts, balances, and transaction history.
  - Initiate transactions:
    - Deposit to own approved, active accounts.
    - Withdraw from own approved, active accounts (with sufficient funds).
    - Transfer between own accounts; backend auto-detects inter-currency and routes accordingly.
    - Inter-currency transfer preview (conversion calculator) to see rate/charges.
  - View-only documents after registration (KYC under review).
  - Cannot transact if account is not APPROVED/ACTIVE.

- Admin
  - Approve/reject customer registrations (enables accounts).
  - Manage users and roles.
  - Configure and monitor rules (where implemented via UI); inspect audit logs and system statistics.
  - Reports & analytics (top customers, volumes, currencies, account distributions).

- Compliance Officer
  - View alert queue generated by the rule engine and NLP thresholds.
  - Create and manage investigation cases from alerts; add notes.
  - Approve/Reject flagged or blocked transactions:
    - Approve → executes funds movement, resolves alert and closes associated case.
    - Reject → marks transaction rejected, resolves alert and closes associated case.
  - Review rule execution logs and reasoning (matched rules, weights, conditions).

# 7. Transaction Lifecycles

- Common Validations
  - Accounts involved must be APPROVED and ACTIVE.
  - For withdrawals/transfers: sufficient funds.

- Risk Assessment (all types)
  - NLP keyword risk via SuspiciousKeywordService (database-driven list) → integer 0–100.
  - Rule engine risk using noisy-OR aggregation of matched rules → integer 0–100.
  - Combined “dominant-risk” logic:
    - weightedAverage = 0.6 * ruleScore + 0.4 * nlp
    - combined = max(weightedAverage, max(ruleScore, nlp))
    - Decision thresholds:
      - combined ≥ 90 → BLOCKED
      - combined ≥ 60 → FLAGGED
      - else → APPROVED
  - For combined ≥ 60, Alert is created and linked to the transaction.

- Deposit
  - No debit account; credit toAccount on APPROVED only.
  - FLAGGED/BLOCKED → persist transaction but do not move funds.

- Withdrawal
  - Validate funds; debit fromAccount on APPROVED only.
  - FLAGGED/BLOCKED → no funds moved.

- Same-currency Transfer
  - Auto-detect currency (defaults from sender account); auto-detect receiver country if not provided.
  - On APPROVED: debit sender, credit receiver with same amount.
  - FLAGGED/BLOCKED → no funds moved.

# 8. Inter-currency Transfer

- Triggered via:
  - Explicit POST /api/transactions/intercurrency-transfer
  - Or automatic routing when /transfer detects different currencies between accounts

- Validations
  - Both accounts APPROVED and ACTIVE.
  - Currencies must differ.
  - Minimum amount equivalent to 10,000 INR (sender amount normalized to INR for this validation).

- Conversion Mechanics (CurrencyExchangeService)
  - Calculate conversion charges in original currency.
  - Amount-after-charges converted to target currency.
  - Total debit equals original amount (charges included in original debit; conversion applies to net amount).
  - Validate sufficient funds including charges.

- Funds Movement (APPROVED only)
  - Debit sender by total debit amount in original currency.
  - Credit receiver by converted amount in target currency.

- Risk for Inter-currency
  - Enhanced description includes conversion details.
  - Amount normalized to INR for rule evaluation where possible.
  - Same dominant-risk thresholds (≥90 BLOCKED, ≥60 FLAGGED).

# 9. Alerts, Manual Review, and Cases

- Alert Creation
  - For combined ≥ 60; includes reason and detailed scores (NLP, rules, combined).

- Compliance Actions
  - Create case from alert (status ESCALATED), add notes.
  - Approve transaction:
    - Transaction → APPROVED, execute funds movement.
    - Alert → RESOLVED; associated case → RESOLVED.
  - Reject transaction:
    - Transaction → REJECTED (no movement).
    - Alert → RESOLVED (reason appended); associated case → RESOLVED.

# 10. Data Model Touchpoints

- aml_transaction: records status, amounts, currency, risk scores, references; for inter-currency stores original/converted amounts, rate, and charges.
- aml_alert: created for risky transactions; linked back to transaction.
- aml_cases: optional escalation for alerts; includes notes.
- aml_bank_account: balance, currency, approval and active status.
- aml_rule, aml_rule_condition: rules and their logical conditions.
- aml_rule_execution_log: logs which rules were matched and details.
- aml_country_risk: used to factor geographic risk.
- aml_currency_exchange: exchange rates and charge policy.
- aml_suspicious_keywords: NLP keyword list with weights.

# 11. REST API (Key Endpoints)

- Authentication
  - POST /api/auth/login
  - POST /api/auth/register
  - POST /api/auth/verify-otp

- Transactions (CUSTOMER)
  - POST /api/transactions/deposit
  - POST /api/transactions/withdraw
  - POST /api/transactions/transfer
  - POST /api/transactions/intercurrency-transfer
  - POST /api/transactions/currency-conversion/calculate (preview)
  - GET /api/transactions/history
  - GET /api/transactions/history/{accountNumber}
  - GET /api/transactions/balance/{accountNumber}
  - GET /api/transactions/status/{transactionId}

- Admin
  - GET /api/admin/customers/pending
  - POST /api/admin/customers/{id}/approve
  - POST /api/admin/customers/{id}/reject
  - Other user and statistics endpoints as provided by controllers.

- Compliance
  - GET /api/compliance/alerts
  - POST /api/compliance/cases
  - Case notes management endpoints.
  - Transaction approval/rejection endpoints (where exposed in controller) — service methods: approveTransaction, rejectTransaction.

# 12. End-to-end Sequences

- Customer → New Transfer (same currency)
  - UI validates → POST /transfer → Service pre-checks → processTransaction → ruleEngine.evaluate + NLP → decision
  - APPROVED: debit/credit → Transaction status APPROVED, no alert
  - FLAGGED/BLOCKED: Transaction saved, alert created, no funds moved

- Customer → Inter-currency Transfer
  - UI may call conversion preview → Submit
  - Backend enforces min 10,000 INR → calculates charges/rate → processIntercurrencyTransaction → decision
  - APPROVED: debit total in source currency, credit converted in target currency
  - FLAGGED/BLOCKED: saved + alert; no funds moved

# 13. Troubleshooting

- 400 Bad Request on registration: verify DTO field name alignment with backend.
- 401 on document upload during registration: use post-OTP authenticated upload phase.
- 404 after login: ensure frontend transforms backend login payload to expected format and routes correctly.
- Insufficient funds: check total debit for inter-currency includes charges.
- Account inactive/unapproved: Admin approval required before any customer transactions.
- Inter-currency min threshold: ensure sender amount (converted to INR) ≥ 10,000.

# 14. Security Notes

- JWT token is required for all protected endpoints; ensure token is attached.
- Spring Security checks role authorities (ROLE_CUSTOMER/CUSTOMER etc.).
- Never log sensitive data; current logs focus on risk calculations and IDs.

# 15. Extensibility

- Add new rule types: implement RuleEvaluator and register via RuleEvaluatorFactory.
- Add currencies: seed aml_currency_exchange with new pairs and charges.
- UI: add new widgets to compliance and admin dashboards; use existing services.

# 16. Glossary

- NLP Score: Suspicious keyword score derived from transaction description.
- Rule Score: Probabilistic aggregation of matched rules (noisy-OR), mapped to 0–100.
- Combined Score: Dominant-risk logic; governs APPROVED/FLAGGED/BLOCKED.
- Alert: Created when combined ≥ 60; feeds compliance workflow.
- Case: Escalation artifact containing notes and assignment.

---

For a lighter overview, see the root README.md. This document is the detailed, execution-focused reference for developers and auditors.
