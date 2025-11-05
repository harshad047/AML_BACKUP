# Rule Conditions Modal Implementation

## Overview
Successfully implemented a clickable condition count badge that opens a modal displaying all conditions for a specific rule.

---

## Backend Changes

### 1. **Added Missing API Endpoint**

#### IAdminService.java
```java
// Added method signature
RuleDto getRuleById(Long id);
```

#### AdminServiceImpl.java
```java
public RuleDto getRuleById(Long id) {
    Rule rule = ruleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Rule", "id", id));
    return mapRuleToDto(rule);
}
```

#### AdminController.java
```java
@GetMapping("/rules/{id}")
public ResponseEntity<RuleDto> getRuleById(@PathVariable Long id) {
    return ResponseEntity.ok(adminService.getRuleById(id));
}
```

**New Endpoint**: `GET /api/admin/rules/{id}`
- Returns single rule with all conditions
- Includes full condition details (type, field, operator, value, active status)

---

## Frontend Changes

### 1. **AdminService Enhancement**

#### admin.service.ts
```typescript
getRuleById(id: number): Observable<RuleDto> {
  return this.http.get<RuleDto>(`${this.apiUrl}/rules/${id}`);
}
```

### 2. **RulesComponent Updates**

#### rules.component.ts

**New Properties:**
```typescript
// Condition view modal
showConditionsModal = false;
selectedRuleForConditions: RuleDto | null = null;
loadingConditions = false;
```

**New Methods:**
```typescript
// View conditions modal
viewConditions(rule: RuleDto): void {
  this.loadingConditions = true;
  this.showConditionsModal = true;
  
  // Fetch rule details with conditions from backend
  this.adminService.getRuleById(rule.id!).subscribe({
    next: (ruleDetails) => {
      this.selectedRuleForConditions = ruleDetails;
      this.loadingConditions = false;
    },
    error: (err) => {
      this.toastService.error(err.error?.message || 'Failed to load rule conditions');
      this.loadingConditions = false;
      this.closeConditionsModal();
    }
  });
}

closeConditionsModal(): void {
  this.showConditionsModal = false;
  this.selectedRuleForConditions = null;
}

getConditionTypeLabel(type: string): string {
  const condType = this.conditionTypes.find(ct => ct.value === type);
  return condType ? condType.label : type;
}
```

### 3. **HTML Template Updates**

#### Clickable Condition Badge
**Before:**
```html
<span class="badge bg-light text-dark border" 
      title="Click Edit to view condition details"
      style="cursor: help;">
  {{ rule.conditions ? rule.conditions.length : 0 }} 
  <i class="fas fa-info-circle ms-1"></i>
</span>
```

**After:**
```html
<span class="badge bg-primary text-white" 
      [class.bg-secondary]="!rule.conditions || rule.conditions.length === 0"
      [title]="rule.conditions && rule.conditions.length > 0 ? 'Click to view conditions' : 'No conditions'"
      [style.cursor]="rule.conditions && rule.conditions.length > 0 ? 'pointer' : 'default'"
      (click)="rule.conditions && rule.conditions.length > 0 && viewConditions(rule)">
  {{ rule.conditions ? rule.conditions.length : 0 }} 
  <i class="fas fa-eye ms-1" *ngIf="rule.conditions && rule.conditions.length > 0"></i>
</span>
```

#### New Conditions Modal
```html
<!-- View Conditions Modal -->
<div class="modal" [class.show]="showConditionsModal" ...>
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <!-- Modal Header -->
      <div class="modal-header bg-gradient-primary text-white">
        <h5 class="modal-title">
          <i class="fas fa-list-check me-2"></i>Rule Conditions
        </h5>
        <button type="button" class="btn-close btn-close-white" (click)="closeConditionsModal()"></button>
      </div>
      
      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Loading State -->
        <div *ngIf="loadingConditions" class="text-center py-5">
          <div class="spinner-border text-primary mb-3"></div>
          <p class="text-muted">Loading conditions...</p>
        </div>

        <!-- Rule Details Card -->
        <div *ngIf="!loadingConditions && selectedRuleForConditions">
          <div class="card mb-4 border-0 bg-light">
            <!-- Rule name, description, priority, action, risk weight, status -->
          </div>

          <!-- Conditions List -->
          <div class="mb-3">
            <h6 class="mb-3">
              <i class="fas fa-filter me-2 text-primary"></i>
              Conditions ({{ selectedRuleForConditions.conditions?.length || 0 }})
            </h6>

            <!-- Individual Condition Cards -->
            <div *ngFor="let condition of selectedRuleForConditions.conditions; let i = index" 
                 class="card mb-3 border"
                 [class.border-success]="condition.active"
                 [class.border-secondary]="!condition.active">
              <div class="card-body">
                <!-- Condition type, field, operator, value -->
                <!-- Condition description -->
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer border-0">
        <button type="button" class="btn btn-secondary" (click)="closeConditionsModal()">
          <i class="fas fa-times me-2"></i>Close
        </button>
        <button type="button" class="btn btn-primary" 
                (click)="editRule(selectedRuleForConditions!); closeConditionsModal()">
          <i class="fas fa-edit me-2"></i>Edit Rule
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## Features Implemented

### 1. **Clickable Condition Count Badge**
- ✅ Badge changes color based on condition count (primary if > 0, secondary if 0)
- ✅ Shows eye icon when conditions exist
- ✅ Cursor changes to pointer on hover
- ✅ Click opens modal to view conditions
- ✅ Disabled click when no conditions exist

### 2. **Conditions Modal**
- ✅ **Loading State**: Shows spinner while fetching data
- ✅ **Rule Summary Card**: Displays rule name, description, priority, action, risk weight, and status
- ✅ **Conditions List**: Shows all conditions with:
  - Condition number badge
  - Condition type label (human-readable)
  - Field (if applicable)
  - Operator (with custom labels)
  - Value (formatted for complex types)
  - Active/Inactive status badge
  - Condition description
- ✅ **Color-Coded Borders**: Green for active, gray for inactive conditions
- ✅ **Empty State**: Shows message when no conditions exist
- ✅ **Quick Edit**: Button to directly edit the rule from modal

### 3. **Data Flow**
1. User clicks on condition count badge
2. Frontend calls `GET /api/admin/rules/{id}`
3. Backend fetches rule with all conditions from database
4. Frontend displays conditions in modal
5. User can view details or click "Edit Rule" to modify

---

## UI/UX Enhancements

### Visual Improvements
- **Badge Styling**: Blue badge for rules with conditions, gray for rules without
- **Icon Change**: Info icon → Eye icon (more intuitive for viewing)
- **Hover Effects**: Pointer cursor indicates clickability
- **Color Coding**: Active conditions have green borders, inactive have gray borders
- **Responsive Design**: Modal is scrollable and works on all screen sizes

### User Experience
- **Loading Feedback**: Spinner shows while data is being fetched
- **Error Handling**: Toast notifications for errors
- **Quick Actions**: Direct "Edit Rule" button in modal
- **Clear Information**: All condition details displayed in organized cards
- **Formatted Values**: Complex condition values are formatted for readability

---

## Technical Details

### API Endpoint
```
GET /api/admin/rules/{id}
```

**Response:**
```json
{
  "id": 1,
  "name": "High Value Transaction",
  "description": "Flags transactions above $15,000",
  "priority": 10,
  "action": "BLOCK",
  "riskWeight": 90,
  "active": true,
  "conditions": [
    {
      "id": 1,
      "type": "AMOUNT",
      "field": "",
      "operator": ">",
      "value": "15000",
      "active": true
    },
    {
      "id": 2,
      "type": "COUNTRY_RISK",
      "field": "",
      "operator": ">=",
      "value": "7",
      "active": true
    }
  ]
}
```

### Condition Types Supported
1. **AMOUNT** - Amount Threshold
2. **COUNTRY_RISK** - Country Risk Score
3. **NLP_SCORE** - NLP Risk Score
4. **KEYWORD_MATCH** - Keyword Match
5. **PAST_TRANSACTIONS** - Past Transactions
6. **VELOCITY** - Transaction Velocity
7. **STRUCTURING** - Structuring Detection
8. **BEHAVIORAL_DEVIATION** - Behavioral Deviation
9. **AMOUNT_BALANCE_RATIO** - Amount/Balance Ratio
10. **DAILY_TOTAL** - Daily Total
11. **NEW_COUNTERPARTY** - New Counterparty
12. **PATTERN_DEPOSIT_WITHDRAW** - Deposit-Withdraw Pattern

---

## Benefits

### For Administrators
- ✅ **Quick View**: See all rule conditions without editing
- ✅ **Better Overview**: Understand rule logic at a glance
- ✅ **Efficient Workflow**: View → Edit flow is seamless
- ✅ **Clear Status**: Active/inactive conditions clearly marked

### For System
- ✅ **Efficient API**: Single endpoint to fetch rule with conditions
- ✅ **Reduced Load**: Only fetches data when needed (on-demand)
- ✅ **Better UX**: No need to open edit form just to view conditions
- ✅ **Maintainable**: Clean separation of view and edit functionality

---

## Testing Checklist

- [ ] Click on condition count badge opens modal
- [ ] Modal shows loading spinner initially
- [ ] Rule details display correctly
- [ ] All conditions are listed with correct information
- [ ] Active/inactive status badges show correctly
- [ ] Condition borders are color-coded properly
- [ ] Complex condition values are formatted correctly
- [ ] "Edit Rule" button opens edit form
- [ ] "Close" button closes modal
- [ ] Error handling works (try with invalid rule ID)
- [ ] Modal is responsive on mobile devices
- [ ] Badge is not clickable when no conditions exist

---

## Summary

**Implementation Complete** ✅

- **Backend**: Added `GET /api/admin/rules/{id}` endpoint
- **Frontend**: Clickable condition badge with modal view
- **Features**: Loading states, formatted display, quick edit
- **UX**: Professional, intuitive, responsive design

The condition count badge is now fully interactive, allowing administrators to quickly view all conditions for any rule without needing to open the edit form.
