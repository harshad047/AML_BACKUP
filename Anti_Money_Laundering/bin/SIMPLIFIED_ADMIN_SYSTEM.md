# 🛡️ Simplified Admin Management System

## ✅ **Updated Admin Permissions & Role Structure**

### **🎯 Role Simplification:**

| **Role** | **Description** | **Permissions** |
|----------|-----------------|-----------------|
| **ADMIN** | System Administrator | View everything, Block users, Manage officers |
| **COMPLIANCE_OFFICER** | AML Compliance Officer | Handle alerts, Approve/Reject transactions |
| **USER** | Regular Bank User | Normal banking operations |

### **🔒 Admin Restrictions:**
- ❌ **Cannot create or update users** (handled by separate user management)
- ❌ **Cannot manage alerts** (only officers handle alerts)
- ✅ **Can view everything** (read-only access to all data)
- ✅ **Can block users** (based on past activity analysis)
- ✅ **Can manage officers** (create, update, activate/deactivate)
- ✅ **Can manage system configuration** (keywords, rules, country risks)

## 👨‍💼 **Officer Management (Simplified)**

### **Single Officer Role: COMPLIANCE_OFFICER**
- No hierarchy (no senior/junior officers)
- All officers have same permissions
- Handle transaction approvals and alerts

### **Officer Management Endpoints:**
```
GET    /api/admin/officers                    - View all officers
POST   /api/admin/officers                    - Create new officer
PUT    /api/admin/officers/{id}               - Update officer
POST   /api/admin/officers/{id}/activate      - Activate officer
POST   /api/admin/officers/{id}/deactivate    - Deactivate officer
```

### **Create Officer Example:**
```json
POST /api/admin/officers
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@bank.com",
  "employeeId": "EMP001",
  "department": "Compliance",
  "position": "AML Officer"
  // role is automatically set to COMPLIANCE_OFFICER
}
```

## 👥 **User Management (Limited)**

### **Admin User Permissions:**
- ✅ **View all users** (read-only)
- ✅ **View user activity** (transaction history for blocking decisions)
- ✅ **Block users** (based on suspicious activity)
- ✅ **Unblock users** (if needed)
- ❌ **Cannot create users** (handled elsewhere)
- ❌ **Cannot update user details** (handled elsewhere)

### **User Activity Analysis:**
```
GET /api/admin/users/{userId}/activity
```

**Response Example:**
```json
{
  "userId": 123,
  "userEmail": "user@example.com",
  "customerId": 456,
  "totalTransactions": 25,
  "flaggedTransactions": 3,
  "blockedTransactions": 1,
  "highRiskTransactions": 5,
  "recommendation": "HIGH_RISK - Consider blocking",
  "recentTransactions": [
    {
      "id": 789,
      "amount": 25000.00,
      "status": "FLAGGED",
      "combinedRiskScore": 85,
      "description": "Large cash transfer"
    }
  ]
}
```

### **Blocking Decision Logic:**
- **HIGH_RISK**: Blocked transactions > 0 OR Flagged transactions > 2
- **MEDIUM_RISK**: Flagged transactions > 0 OR High-risk transactions > 1
- **LOW_RISK**: Clean transaction history

## 📊 **Admin Dashboard (Read-Only)**

### **Dashboard Statistics:**
```json
GET /api/admin/dashboard
{
  "totalUsers": 150,
  "totalCustomers": 1200,
  "totalTransactions": 5000,
  "flaggedTransactions": 45,
  "blockedTransactions": 12,
  "highRiskTransactions": 78,
  "activeAlerts": 23,
  "totalKeywords": 55,
  "activeRules": 7,
  "keywordStatistics": {
    "CRITICAL": 15,
    "HIGH": 15,
    "MEDIUM": 15,
    "LOW": 10
  }
}
```

## 🔍 **System Configuration Management**

### **Admin Can Manage:**

#### **1. Suspicious Keywords**
- ✅ Add, update, activate/deactivate keywords
- ✅ Manage risk levels and categories
- ✅ View keyword statistics

#### **2. AML Rules**
- ✅ Create, update, activate/deactivate rules
- ✅ Manage rule conditions and weights
- ✅ Monitor rule performance

#### **3. Country Risk Scores**
- ✅ Add, update, delete country risks
- ✅ Manage risk classifications
- ✅ View high-risk countries

#### **4. Bank Accounts**
- ✅ View all accounts
- ✅ Approve/reject pending accounts
- ✅ Suspend/activate accounts

## 🚫 **What Admin CANNOT Do**

### **User Management Restrictions:**
- ❌ Create new users (handled by registration service)
- ❌ Update user profiles (users manage their own)
- ❌ Delete users (only block/unblock)

### **Alert Management Restrictions:**
- ❌ Handle alerts (only officers can do this)
- ❌ Assign alerts to officers
- ❌ Close or escalate alerts

### **Transaction Restrictions:**
- ❌ Approve/reject transactions (only officers)
- ❌ Process transactions manually
- ❌ Modify transaction details

## 🎯 **Typical Admin Workflow**

### **1. Monitor Dashboard**
```bash
GET /api/admin/dashboard
```

### **2. Review Suspicious Users**
```bash
GET /api/admin/users/{userId}/activity
```

### **3. Block High-Risk User**
```bash
POST /api/admin/users/{userId}/block?reason=Multiple suspicious transactions detected
```

### **4. Create New Officer**
```bash
POST /api/admin/officers
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@bank.com",
  "employeeId": "EMP002",
  "department": "Compliance",
  "position": "Senior AML Officer"
}
```

### **5. Add High-Risk Keyword**
```bash
POST /api/admin/keywords
{
  "keyword": "shell company",
  "riskLevel": "HIGH",
  "riskScore": 75,
  "category": "SHELL_ENTITIES"
}
```

### **6. Update Country Risk**
```bash
PUT /api/admin/country-risks/{id}
{
  "countryName": "High Risk Country",
  "riskScore": 95,
  "notes": "Increased risk due to regulatory changes"
}
```

## 🔐 **Security & Access Control**

### **Role-Based Access:**
```java
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
```

### **Admin-Only Endpoints:**
- All `/api/admin/*` endpoints require ADMIN role
- Officer management requires ADMIN role
- System configuration requires ADMIN role
- User blocking requires ADMIN role

### **Officer-Only Functions:**
- Transaction approval/rejection
- Alert handling and resolution
- Case management

## ✅ **Implementation Summary**

### **✅ Completed Features:**
1. **Simplified role structure** (ADMIN, COMPLIANCE_OFFICER, USER)
2. **Limited admin permissions** (view + block users, manage officers)
3. **Officer management** (create, update, activate/deactivate)
4. **User activity analysis** for blocking decisions
5. **Read-only dashboard** with comprehensive statistics
6. **System configuration management** (keywords, rules, countries)

### **🚫 Removed Features:**
1. User creation/update by admin
2. Alert management by admin
3. Transaction processing by admin
4. Complex officer hierarchy

### **🎯 Clear Separation of Concerns:**
- **Admin**: System oversight and configuration
- **Officers**: Transaction and alert handling
- **Users**: Normal banking operations

Your AML system now has **simplified, focused admin functionality** with clear role boundaries and appropriate restrictions!
