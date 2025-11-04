# AML Rule Condition Types - Complete Guide

## Overview
This document provides a comprehensive guide to all 12 condition types supported by the AML system backend.

---

## Condition Types

### 1. AMOUNT
**Purpose**: Compare transaction amount against a threshold

**Required Fields**:
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: Numeric threshold (e.g., `10000`)

**Examples**:
- Flag transactions > $10,000: `operator: >`, `value: 10000`
- Block transactions >= $50,000: `operator: >=`, `value: 50000`

---

### 2. COUNTRY_RISK
**Purpose**: Evaluate country risk score from database

**Required Fields**:
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: Risk score threshold (0-10 scale, e.g., `7`)

**Examples**:
- Flag high-risk countries (score >= 7): `operator: >=`, `value: 7`
- Block very high-risk (score >= 9): `operator: >=`, `value: 9`

---

### 3. NLP_SCORE
**Purpose**: Compare NLP sentiment/risk analysis score

**Required Fields**:
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: Score threshold (0.0-1.0, e.g., `0.8`)

**Examples**:
- Flag suspicious text (score > 0.8): `operator: >`, `value: 0.8`
- Review moderate risk (score >= 0.5): `operator: >=`, `value: 0.5`

---

### 4. KEYWORD_MATCH
**Purpose**: Match keywords in transaction description/text

**Required Fields**:
- **Operator**: 
  - `>`: Contains whole word (word boundary match)
  - `>=`: Contains substring
  - `==`: Exact match
  - `<=`: Contains, starts with, or ends with
  - `<`: Does NOT contain
- **Value**: Keyword to match (case-insensitive, e.g., `cash`, `invoice`)

**Examples**:
- Flag "cash" mentions: `operator: >`, `value: cash`
- Block "bitcoin" mentions: `operator: >=`, `value: bitcoin`
- Exclude "salary" transactions: `operator: <`, `value: salary`

---

### 5. PAST_TRANSACTIONS
**Purpose**: Analyze customer's historical transaction patterns

**Required Fields**:
- **Field**: `count` (number of transactions) or `sum` (total amount)
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: `lookbackDays|threshold`
  - `lookbackDays`: Number of days to look back (e.g., `30`, `7`, `90`)
  - `threshold`: Count or amount threshold

**Examples**:
- Flag if > 10 transactions in 30 days: `field: count`, `operator: >`, `value: 30|10`
- Flag if total > $100k in 7 days: `field: sum`, `operator: >`, `value: 7|100000`

---

### 6. VELOCITY
**Purpose**: Detect rapid transaction patterns (high frequency)

**Required Fields**:
- **Field**: `count`
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: `minAmount|minCount|windowHours|transactionType`
  - `minAmount`: Minimum transaction amount to count
  - `minCount`: Threshold count
  - `windowHours`: Time window in hours (e.g., `24`, `48`)
  - `transactionType`: `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`, `ANY`, or comma-separated (e.g., `DEPOSIT,TRANSFER`)

**Examples**:
- Flag 3+ large deposits in 24h: `field: count`, `operator: >=`, `value: 100000|3|24|DEPOSIT`
- Block 5+ transfers in 12h: `field: count`, `operator: >=`, `value: 50000|5|12|TRANSFER`

---

### 7. STRUCTURING
**Purpose**: Detect structuring/smurfing (multiple small transactions to avoid reporting)

**Required Fields**:
- **Field**: `sum`
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: `maxSingle|maxWindowSum|windowHours|transactionTypes`
  - `maxSingle`: Maximum single transaction amount (transactions below this are counted)
  - `maxWindowSum`: Threshold for total sum
  - `windowHours`: Time window in hours
  - `transactionTypes`: `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`, `ANY`, or comma-separated

**Examples**:
- Flag if deposits < $50k total >= $300k in 24h: `field: sum`, `operator: >=`, `value: 50000|300000|24|DEPOSIT`
- Detect smurfing pattern: `field: sum`, `operator: >=`, `value: 10000|100000|48|ANY`

---

### 8. BEHAVIORAL_DEVIATION
**Purpose**: Detect unusual behavior compared to customer's historical pattern

**Required Fields**:
- **Field**: `amount_percentile`
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: `lookbackDays|percentile`
  - `lookbackDays`: Historical period to analyze (e.g., `90`, `180`)
  - `percentile`: Percentile threshold (e.g., `95`, `99`)

**Examples**:
- Flag if amount >= 95th percentile of last 90 days: `field: amount_percentile`, `operator: >=`, `value: 90|95`
- Block extreme outliers (99th percentile): `field: amount_percentile`, `operator: >=`, `value: 180|99`

---

### 9. AMOUNT_BALANCE_RATIO
**Purpose**: Compare transaction amount to account balance

**Required Fields**:
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: Ratio threshold (0.0-1.0, e.g., `0.8` for 80%)

**Examples**:
- Flag if transaction > 80% of balance: `operator: >`, `value: 0.8`
- Block if transaction >= 95% of balance: `operator: >=`, `value: 0.95`

---

### 10. DAILY_TOTAL
**Purpose**: Monitor total transaction volume within a time window

**Required Fields**:
- **Field**: `sum`
- **Operator**: `>`, `>=`, `<`, `<=`, `==`
- **Value**: `threshold|windowHours|transactionTypes`
  - `threshold`: Total amount threshold
  - `windowHours`: Time window in hours (e.g., `24`, `48`)
  - `transactionTypes`: `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`, `ANY`, or comma-separated

**Examples**:
- Flag if daily total >= $500k: `field: sum`, `operator: >=`, `value: 500000|24|ANY`
- Monitor transfer volume: `field: sum`, `operator: >=`, `value: 250000|24|TRANSFER`

---

### 11. NEW_COUNTERPARTY
**Purpose**: Flag transactions to new/unknown recipients

**Required Fields**:
- **Operator**: `>=` (applied to amount comparison)
- **Value**: `lookbackDays|minAmount|transactionTypes`
  - `lookbackDays`: Period to check for prior interactions (e.g., `30`, `90`)
  - `minAmount`: Minimum transaction amount to flag
  - `transactionTypes`: `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`, `ANY`, or comma-separated

**Examples**:
- Flag transfers >= $50k to new recipients: `operator: >=`, `value: 30|50000|TRANSFER`
- Monitor new counterparties: `operator: >=`, `value: 90|25000|ANY`

---

### 12. PATTERN_DEPOSIT_WITHDRAW
**Purpose**: Detect layering patterns (deposit followed by withdrawal)

**Required Fields**:
- **Operator**: `>=` (for pair count)
- **Value**: `requiredPairs|amountMultiplier`
  - `requiredPairs`: Number of deposit-withdraw pairs to trigger (e.g., `3`)
  - `amountMultiplier`: Minimum withdrawal as multiple of deposit (e.g., `1.0` = 100%, `0.9` = 90%)

**Examples**:
- Flag 3+ deposit-withdraw pairs in 24h: `operator: >=`, `value: 3|1.0`
- Detect layering pattern: `operator: >=`, `value: 2|0.9`

---

## Database Format

All conditions are stored in the `rule_condition` table with the following structure:

```sql
CREATE TABLE rule_condition (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- Enum: AMOUNT, COUNTRY_RISK, etc.
    field VARCHAR(100),         -- Optional: depends on condition type
    operator VARCHAR(10),       -- >, >=, <, <=, ==
    value VARCHAR(500),         -- Format varies by type
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (rule_id) REFERENCES rule(id)
);
```

## Value Format Summary

| Condition Type | Value Format | Example |
|----------------|--------------|---------|
| AMOUNT | `threshold` | `10000` |
| COUNTRY_RISK | `riskScore` | `7` |
| NLP_SCORE | `score` | `0.8` |
| KEYWORD_MATCH | `keyword` | `cash` |
| PAST_TRANSACTIONS | `lookbackDays\|threshold` | `30\|10` |
| VELOCITY | `minAmount\|minCount\|windowHours\|type` | `100000\|3\|24\|DEPOSIT` |
| STRUCTURING | `maxSingle\|maxSum\|windowHours\|types` | `50000\|300000\|24\|DEPOSIT` |
| BEHAVIORAL_DEVIATION | `lookbackDays\|percentile` | `90\|95` |
| AMOUNT_BALANCE_RATIO | `ratio` | `0.8` |
| DAILY_TOTAL | `threshold\|windowHours\|types` | `500000\|24\|ANY` |
| NEW_COUNTERPARTY | `lookbackDays\|minAmount\|types` | `30\|50000\|TRANSFER` |
| PATTERN_DEPOSIT_WITHDRAW | `requiredPairs\|multiplier` | `3\|1.0` |

---

## Implementation Notes

1. **Pipe-Delimited Values**: Many condition types use pipe (`|`) as a delimiter for multiple parameters
2. **Transaction Types**: Can be `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`, `ANY`, or comma-separated list
3. **Case Sensitivity**: Keywords are case-insensitive, transaction types are uppercase
4. **Validation**: Frontend should validate value format before submission
5. **Dynamic Forms**: UI should show/hide fields based on selected condition type

---

## Frontend Integration

The frontend should:
1. Display appropriate input fields based on selected condition type
2. Validate value format before submission
3. Provide helpful tooltips/examples for each type
4. Format values correctly (pipe-delimited where needed)
5. Allow editing of existing conditions with proper parsing

---

*Last Updated: 2025-01-04*
