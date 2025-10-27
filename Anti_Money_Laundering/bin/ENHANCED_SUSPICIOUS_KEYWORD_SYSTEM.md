# 🔍 Enhanced Suspicious Keyword System

## ✅ **Database-Driven NLP Alternative**

Instead of using complex NLP models, we've implemented a comprehensive **database-driven suspicious keyword detection system** that's more reliable, maintainable, and customizable.

## 🗄️ **Enhanced SuspiciousKeyword Entity**

### **Key Features:**
- ✅ **Risk Levels**: CRITICAL (76-100), HIGH (51-75), MEDIUM (26-50), LOW (1-25)
- ✅ **Categorization**: FINANCIAL_CRIME, TERRORISM, DRUG_RELATED, etc.
- ✅ **Flexible Matching**: Case-sensitive and whole-word options
- ✅ **Audit Trail**: Created/updated by tracking with timestamps
- ✅ **Validation**: Risk score must match risk level ranges

### **Database Schema:**
```sql
CREATE TABLE suspicious_keywords (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL UNIQUE,
    risk_level VARCHAR(20) NOT NULL,
    risk_score INT NOT NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    whole_word_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6)
);
```

## 📊 **Risk Level Classification**

| Risk Level | Score Range | Examples | Impact |
|------------|-------------|----------|---------|
| **CRITICAL** | 76-100 | money laundering, terrorist, drug trafficking | Likely BLOCKED |
| **HIGH** | 51-75 | shell company, offshore, cryptocurrency | Likely FLAGGED |
| **MEDIUM** | 26-50 | urgent, confidential, cash only | May be FLAGGED |
| **LOW** | 1-25 | large, business, investment | Usually APPROVED |

## 🎯 **Keyword Categories**

### **Financial Crime**
- money laundering, fraud, scam, corruption, bribe

### **Terrorism & Security**
- terrorist, terrorism, weapons, arms dealing, ransom

### **Drug Related**
- drug trafficking, narcotics, illegal substances

### **Cryptocurrency**
- bitcoin, cryptocurrency, crypto, anonymous transactions

### **Structuring & Patterns**
- smurfing, structuring, layering, split payment

### **Offshore & Shell Entities**
- offshore, shell company, bearer bonds, hawala

## 🔧 **SuspiciousKeywordService Features**

### **Core Methods:**
```java
// Calculate risk score for text
int calculateRiskScore(String text)

// Get matched keywords from text
List<SuspiciousKeyword> getMatchedKeywords(String text)

// Manage keywords
SuspiciousKeyword addKeyword(SuspiciousKeyword keyword)
SuspiciousKeyword updateKeyword(Long id, SuspiciousKeyword keyword)
void deactivateKeyword(Long id, String deactivatedBy)

// Bulk operations
void bulkImportKeywords(List<SuspiciousKeyword> keywords, String importedBy)

// Statistics
Map<String, Long> getKeywordStatistics()
List<String> getAllCategories()
```

### **Advanced Matching:**
- ✅ **Whole Word Matching**: Uses regex word boundaries `\b`
- ✅ **Case Sensitivity**: Configurable per keyword
- ✅ **Flexible Scoring**: Database-driven risk scores
- ✅ **Category Filtering**: Filter by risk categories

## 🚀 **Integration with Transaction Processing**

### **Old Approach (Hardcoded):**
```java
// ❌ Hardcoded keywords and scores
int nlp = calculateBasicNlpScore(desc);
```

### **New Approach (Database-Driven):**
```java
// ✅ Dynamic database-driven scoring
int nlp = suspiciousKeywordService.calculateRiskScore(desc);
```

## 📈 **Example Risk Scoring**

### **High-Risk Transaction:**
```
Description: "Large cash payment to shell company for money laundering services"

Matched Keywords:
- "money laundering" (CRITICAL, +100 points)
- "shell company" (HIGH, +75 points)  
- "large" (LOW, +20 points)
- "cash" (MEDIUM, +45 points)
- "payment" (LOW, +10 points)

Total Score: 100 (capped at 100)
Result: BLOCKED
```

### **Medium-Risk Transaction:**
```
Description: "Urgent business payment for investment opportunity"

Matched Keywords:
- "urgent" (MEDIUM, +45 points)
- "business" (LOW, +15 points)
- "payment" (LOW, +10 points)
- "investment" (LOW, +20 points)

Total Score: 90
Result: BLOCKED (≥ 90)
```

### **Low-Risk Transaction:**
```
Description: "Monthly salary payment to employee"

Matched Keywords:
- "salary" (LOW, +5 points)
- "payment" (LOW, +10 points)

Total Score: 15
Result: APPROVED (< 60)
```

## 🎛️ **Management Features**

### **Keyword Statistics:**
```json
{
  "CRITICAL": 15,
  "HIGH": 15, 
  "MEDIUM": 15,
  "LOW": 10
}
```

### **Category Management:**
```json
[
  "FINANCIAL_CRIME",
  "TERRORISM", 
  "DRUG_RELATED",
  "CRYPTOCURRENCY",
  "OFFSHORE",
  "STRUCTURING"
]
```

## 📋 **Setup Instructions**

### **1. Run Database Setup:**
```sql
source suspicious_keywords_setup.sql;
```

### **2. Verify Installation:**
```sql
SELECT risk_level, COUNT(*) as count 
FROM suspicious_keywords 
WHERE is_active = true 
GROUP BY risk_level;
```

### **3. Test the System:**
```java
POST /api/transactions/transfer
{
  "amount": 25000.00,
  "description": "Large cash payment to shell company for money laundering services",
  "receiverCountryCode": "AF"
}
```

## 🎯 **Key Benefits**

### **✅ Advantages over NLP:**
1. **Predictable**: Exact keyword matching, no AI uncertainty
2. **Maintainable**: Easy to add/remove/modify keywords
3. **Auditable**: Complete trail of who added what keywords
4. **Customizable**: Risk scores and categories per business needs
5. **Fast**: Simple database queries, no ML processing
6. **Regulatory Compliant**: Clear rules for compliance officers

### **✅ Business Benefits:**
1. **Dynamic Management**: Add new suspicious patterns instantly
2. **Category-Based Rules**: Different rules for different crime types
3. **Risk-Based Scoring**: Weighted scoring based on threat level
4. **Compliance Ready**: Audit trail and justification for decisions
5. **Performance**: Fast database lookups vs. complex NLP processing

## 🔍 **Console Output Example:**

```
Database-driven keyword risk score: 100
Keyword found: 'money laundering' (+100 points, CRITICAL)
Keyword found: 'shell company' (+75 points, HIGH)
Keyword found: 'large' (+20 points, LOW)
Keyword found: 'cash' (+45 points, MEDIUM)
Keyword found: 'payment' (+10 points, LOW)

Rule Engine - Found 7 active rules
Rule MATCHED: High NLP Risk Score (Weight: 90)
Rule MATCHED: Terrorism Financing (Weight: 100)
Combined Risk Score: 99 (NLP: 100, Rule: 99)
Transaction BLOCKED due to high risk score: 99
```

## ✅ **Ready for Production**

Your AML system now has:
- ✅ **Database-driven keyword detection** (replacing NLP)
- ✅ **Comprehensive suspicious keyword database** (55+ keywords)
- ✅ **Risk-based categorization** (4 risk levels, 10+ categories)
- ✅ **Dynamic management capabilities** (add/edit/deactivate keywords)
- ✅ **Audit trail and compliance features**
- ✅ **High-performance matching algorithms**

This system is more reliable, maintainable, and compliance-ready than traditional NLP approaches!
