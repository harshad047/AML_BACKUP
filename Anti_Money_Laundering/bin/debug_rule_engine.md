# 🔧 Rule Engine Debug Guide

## 🚨 **Issues Found & Fixed:**

### **1. Missing Debug Logs**
- ✅ Added detailed logging to all evaluators
- ✅ Shows actual vs expected values for each condition
- ✅ Shows rule matching results

### **2. KeywordMatchEvaluator Enhancement**
- ✅ Added support for different operators (CONTAINS, EQUALS, STARTS_WITH, ENDS_WITH)
- ✅ Better text cleaning and matching
- ✅ Debug output for keyword matching

### **3. Country Risk Data Missing**
- ✅ Created `country_risk_setup.sql` to add test data
- ✅ Added proper error handling when country data is missing

## 📊 **Your Rules Analysis:**

### **Rule 2: "High NLP Risk Score" (Should Trigger)**
```sql
Rule ID: 2, Weight: 90
Condition: nlpScore >= 80
```
**Expected**: Your transaction should have NLP score ~100+ due to keywords:
- "money laundering" (+35)
- "shell company" (+35) 
- "suspicious" (+35)
- "large" (+18)
- "cash" (+35)
- "payment" (+18)

### **Rule 6: "Terrorism Financing" (Should Trigger)**
```sql
Rule ID: 6, Weight: 100
Condition: nlpScore >= 90
```
**Expected**: Should trigger with high NLP score

### **Other Rules (May Not Trigger):**
- **Rule 1**: Needs country risk data + amount > 1000
- **Rule 3**: Needs "urgent transfer" keyword + amount > 5000
- **Rule 4**: Needs "offshore account" keyword
- **Rule 5**: Needs "cash pickup" keyword + amount < 10000
- **Rule 7**: Needs past transaction history

## 🧪 **Test Steps:**

### **Step 1: Setup Data**
```sql
-- Run these SQL scripts:
source country_risk_setup.sql;
```

### **Step 2: Test Transaction**
```json
POST /api/transactions/transfer
{
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075", 
  "amount": 25000.00,
  "currency": "USD",
  "description": "Large cash payment to shell company for money laundering services and suspicious business activities"
}
```

### **Step 3: Expected Console Output**
```
Transaction processing - Customer ID: 1, Email: john.doe@example.com, Name: John Doe
High-risk keyword found: money laundering (+35 points)
High-risk keyword found: shell company (+35 points)
High-risk keyword found: suspicious (+35 points)
Medium-risk keyword found: large (+18 points)
High-risk keyword found: cash (+35 points)
Medium-risk keyword found: payment (+18 points)
Basic NLP Score: 100, Description: Large cash payment to shell company...

Rule Engine - Found 7 active rules
Evaluating rule: High-Risk Country Transfer (Weight: 70)
  Evaluating condition: COUNTRY_RISK with evaluator: CountryRiskEvaluator
    CountryRiskEvaluator: US risk=20 >= 80 = false
  Condition failed: COUNTRY_RISK
  Rule NOT matched: High-Risk Country Transfer

Evaluating rule: High NLP Risk Score (Weight: 90)
  Evaluating condition: NLP_SCORE with evaluator: NlpScoreEvaluator
    NlpScoreEvaluator: 100 >= 80 = true
  Condition passed: NLP_SCORE
  Rule MATCHED: High NLP Risk Score

Evaluating rule: Terrorism Financing (Weight: 100)
  Evaluating condition: NLP_SCORE with evaluator: NlpScoreEvaluator
    NlpScoreEvaluator: 100 >= 90 = true
  Condition passed: NLP_SCORE
  Rule MATCHED: Terrorism Financing

Rule Engine Final Score: 99 (Combined Prob: 0.99)
Combined Risk Score: 99 (NLP: 100, Rule: 99)
```

### **Step 4: Expected Final Result**
```json
{
  "id": 4,
  "transactionType": "TRANSFER",
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075",
  "amount": 25000.00,
  "currency": "USD", 
  "description": "Large cash payment to shell company for money laundering services and suspicious business activities",
  "status": "BLOCKED",
  "combinedRiskScore": 99,
  "createdAt": "2025-10-04T10:13:00"
}
```

## 🎯 **What Should Happen Now:**

1. **NLP Score**: ~100 (multiple high-risk keywords)
2. **Rule Engine Score**: ~99 (multiple high-weight rules triggered)
3. **Combined Score**: ~99 ((100 + 99) / 2)
4. **Status**: "BLOCKED" (score >= 90)
5. **Alert Created**: High-risk alert should be generated

Try the transaction again and check the console logs to see the detailed rule evaluation process!
