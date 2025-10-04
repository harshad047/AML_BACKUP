# 🌍 Transfer with Receiver Country Code - Test Examples

## ✅ **Implementation Complete**

Now only **transfers** ask for `receiverCountryCode`, while deposits and withdrawals use the customer's country from their address.

## 🧪 **Test Scenarios**

### **Scenario 1: High-Risk Country Transfer (Should Trigger Rule 1)**

**POST** `/api/transactions/transfer`
```json
{
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075",
  "amount": 25000.00,
  "currency": "USD",
  "description": "Large cash payment to shell company for money laundering services and suspicious business activities",
  "receiverCountryCode": "AF"
}
```

**Expected Results:**
- **Country Risk**: Afghanistan (AF) = 95 (≥ 80) ✅
- **Amount**: 25000 (> 1000) ✅
- **NLP Score**: ~100 (multiple high-risk keywords)
- **Rules Triggered**:
  - Rule 1: "High-Risk Country Transfer" (Weight: 70)
  - Rule 2: "High NLP Risk Score" (Weight: 90)
  - Rule 6: "Terrorism Financing" (Weight: 100)
- **Final Status**: "BLOCKED" (score ≥ 90)

### **Scenario 2: Medium-Risk Country Transfer**

**POST** `/api/transactions/transfer`
```json
{
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075",
  "amount": 15000.00,
  "currency": "USD",
  "description": "Business investment payment",
  "receiverCountryCode": "AO"
}
```

**Expected Results:**
- **Country Risk**: Angola (AO) = 80 (≥ 80) ✅
- **Amount**: 15000 (> 1000) ✅
- **NLP Score**: ~28 (medium-risk keywords)
- **Rules Triggered**:
  - Rule 1: "High-Risk Country Transfer" (Weight: 70)
- **Final Status**: "FLAGGED" (score ≥ 60)

### **Scenario 3: Low-Risk Country Transfer**

**POST** `/api/transactions/transfer`
```json
{
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075",
  "amount": 5000.00,
  "currency": "USD",
  "description": "Regular business payment",
  "receiverCountryCode": "US"
}
```

**Expected Results:**
- **Country Risk**: US = 20 (< 80) ❌
- **Amount**: 5000 (> 1000) ✅
- **NLP Score**: ~28 (low-medium risk)
- **Rules Triggered**: None (Rule 1 fails country check)
- **Final Status**: "APPROVED" (low score)

### **Scenario 4: Transfer Without Country Code (Fallback)**

**POST** `/api/transactions/transfer`
```json
{
  "fromAccountNumber": "AC-327026",
  "toAccountNumber": "AC-840075",
  "amount": 25000.00,
  "currency": "USD",
  "description": "Large cash payment to shell company for money laundering services"
}
```

**Expected Results:**
- **Country Code**: Falls back to customer's address country
- **Behavior**: Same as deposit/withdrawal logic

## 📊 **Expected Console Output**

```
Transaction processing - Customer ID: 1, Email: john.doe@example.com, Name: John Doe
High-risk keyword found: money laundering (+35 points)
High-risk keyword found: shell company (+35 points)
High-risk keyword found: suspicious (+35 points)
Medium-risk keyword found: large (+18 points)
High-risk keyword found: cash (+35 points)
Medium-risk keyword found: payment (+18 points)
Basic NLP Score: 100, Description: Large cash payment to shell company...
Receiver country code: AF (from request: AF)

Rule Engine - Found 7 active rules
Evaluating rule: High-Risk Country Transfer (Weight: 70)
  Evaluating condition: COUNTRY_RISK with evaluator: CountryRiskEvaluator
    CountryRiskEvaluator: AF risk=95 >= 80 = true
  Condition passed: COUNTRY_RISK
  Evaluating condition: AMOUNT with evaluator: AmountEvaluator
    AmountEvaluator: 25000.0 > 1000 = true
  Condition passed: AMOUNT
  Rule MATCHED: High-Risk Country Transfer

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

Rule Engine Final Score: 99+ (Multiple high-weight rules triggered)
Combined Risk Score: 99+ (NLP: 100, Rule: 99+)
```

## 🎯 **Key Benefits**

1. **✅ Realistic AML Compliance**: Checks destination country risk for transfers
2. **✅ Flexible**: Optional field - falls back to customer country if not provided
3. **✅ Targeted**: Only applies to transfers (most relevant for cross-border compliance)
4. **✅ Comprehensive**: Combines country risk + amount + NLP analysis
5. **✅ Debuggable**: Clear logging shows which country code is being used

## 🚀 **Ready to Test**

Your AML system now properly handles:
- **Transfers**: Uses `receiverCountryCode` from request
- **Deposits/Withdrawals**: Uses customer's address country
- **Rule Engine**: Evaluates country risk + amount + keywords
- **Risk Scoring**: Combines multiple factors for accurate assessment

Test with Afghanistan (AF) or Angola (AO) to see high-risk country rules trigger!
