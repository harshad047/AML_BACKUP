import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { AdminService, RuleDto, RuleConditionDto } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.css']
})
export class RulesComponent implements OnInit {
  rules: RuleDto[] = [];
  filteredRules: RuleDto[] = [];
  paginatedRules: RuleDto[] = [];
  loading = false;
  error = '';
  success = '';

  // Condition type configurations
  conditionTypes = [
    { value: 'AMOUNT', label: 'Amount Threshold' },
    { value: 'COUNTRY_RISK', label: 'Country Risk Score' },
    { value: 'NLP_SCORE', label: 'NLP Risk Score' },
    { value: 'KEYWORD_MATCH', label: 'Keyword Match' },
    { value: 'PAST_TRANSACTIONS', label: 'Past Transactions' },
    { value: 'VELOCITY', label: 'Transaction Velocity' },
    { value: 'STRUCTURING', label: 'Structuring Detection' },
    { value: 'BEHAVIORAL_DEVIATION', label: 'Behavioral Deviation' },
    { value: 'AMOUNT_BALANCE_RATIO', label: 'Amount/Balance Ratio' },
    { value: 'DAILY_TOTAL', label: 'Daily Total' },
    { value: 'NEW_COUNTERPARTY', label: 'New Counterparty' },
    { value: 'PATTERN_DEPOSIT_WITHDRAW', label: 'Deposit-Withdraw Pattern' }
  ];

  transactionTypes = ['DEPOSIT', 'TRANSFER', 'WITHDRAWAL', 'ANY'];
  
  // Search and pagination
  searchTerm = '';
  actionFilter = 'ALL';
  statusFilter = 'ALL';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  
  // Delete confirmation modal
  showDeleteModal = false;
  ruleToDelete: RuleDto | null = null;
  
  // Condition view modal
  showConditionsModal = false;
  selectedRuleForConditions: RuleDto | null = null;
  loadingConditions = false;

  showCreateForm = false;
  ruleForm: FormGroup;
  savingRule = false;
  editingRule: RuleDto | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.ruleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      priority: [1, [Validators.required, Validators.min(1)]],
      action: ['FLAG', Validators.required],
      riskWeight: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      active: [true],
      conditions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadRules();
  }

  get conditions(): FormArray {
    return this.ruleForm.get('conditions') as FormArray;
  }

  loadRules(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllRules().subscribe({
      next: (rules) => {
        this.rules = rules;
        this.filteredRules = [...rules];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to load rules');
        this.loading = false;
      }
    });
  }

  filterRules(): void {
    let filtered = [...this.rules];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name?.toLowerCase().includes(term) ||
        rule.description?.toLowerCase().includes(term) ||
        rule.action?.toLowerCase().includes(term) ||
        rule.id?.toString().includes(term)
      );
    }
    
    // Apply action filter
    if (this.actionFilter !== 'ALL') {
      filtered = filtered.filter(rule => rule.action === this.actionFilter);
    }
    
    // Apply status filter
    if (this.statusFilter !== 'ALL') {
      if (this.statusFilter === 'ACTIVE') {
        filtered = filtered.filter(rule => rule.active);
      } else if (this.statusFilter === 'INACTIVE') {
        filtered = filtered.filter(rule => !rule.active);
      }
    }
    
    this.filteredRules = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredRules.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRules.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRules = this.filteredRules.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingRule = null;
    if (!this.showCreateForm) {
      this.resetForm();
    } else {
      this.addCondition();
    }
  }

  resetForm(): void {
    this.ruleForm.reset({
      priority: 1,
      action: 'FLAG',
      riskWeight: 50,
      active: true
    });
    this.conditions.clear();
  }

  addCondition(): void {
    const conditionGroup = this.fb.group({
      type: ['AMOUNT', Validators.required],
      field: [''],
      operator: ['>', Validators.required],
      value: ['', Validators.required],
      active: [true],
      // Dynamic fields for complex conditions
      valueField1: [''],
      valueField2: [''],
      valueField3: [''],
      valueField4: ['']
    });
    this.conditions.push(conditionGroup);
  }

  removeCondition(index: number): void {
    this.conditions.removeAt(index);
  }

  editRule(rule: RuleDto): void {
    this.editingRule = rule;
    this.showCreateForm = true;
    
    this.ruleForm.patchValue({
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      action: rule.action,
      riskWeight: rule.riskWeight,
      active: rule.active
    });

    this.conditions.clear();
    if (rule.conditions && rule.conditions.length > 0) {
      rule.conditions.forEach(cond => {
        const config = this.getConditionConfig(cond.type || 'AMOUNT');
        const valueParts = cond.value ? cond.value.split('|') : [];
        
        const conditionGroup = this.fb.group({
          type: [cond.type || 'AMOUNT', Validators.required],
          field: [cond.field || ''],
          operator: [cond.operator, Validators.required],
          value: [cond.value, Validators.required],
          active: [cond.active !== undefined ? cond.active : true],
          // Parse complex values into individual fields
          valueField1: [valueParts[0] || ''],
          valueField2: [valueParts[1] || ''],
          valueField3: [valueParts[2] || ''],
          valueField4: [valueParts[3] || '']
        });
        this.conditions.push(conditionGroup);
      });
    } else {
      this.addCondition();
    }
  }

  onSaveRule(): void {
    if (this.ruleForm.invalid) return;

    this.savingRule = true;
    this.error = '';
    this.success = '';

    // Combine individual value fields into piped format for complex conditions
    this.conditions.controls.forEach(condition => {
      const type = condition.get('type')?.value;
      const config = this.getConditionConfig(type);
      
      if (config.valueType === 'complex' && config.valueFields) {
        const field1 = condition.get('valueField1')?.value || '';
        const field2 = condition.get('valueField2')?.value || '';
        const field3 = condition.get('valueField3')?.value || '';
        const field4 = condition.get('valueField4')?.value || '';
        
        // Build piped value based on number of fields
        const values = [field1, field2, field3, field4].filter((v, i) => i < config.valueFields.length && v);
        if (values.length > 0) {
          condition.patchValue({ value: values.join('|') });
        }
      }
    });

    const ruleDto: RuleDto = this.ruleForm.value;

    const request = this.editingRule
      ? this.adminService.updateRule(this.editingRule.id!, ruleDto)
      : this.adminService.createRule(ruleDto);

    request.subscribe({
      next: (rule) => {
        this.toastService.success(`Rule "${rule.name}" ${this.editingRule ? 'updated' : 'created'} successfully!`, 5000);
        this.savingRule = false;
        this.resetForm();
        this.showCreateForm = false;
        this.editingRule = null;
        this.loadRules();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to save rule');
        this.savingRule = false;
      }
    });
  }

  toggleRuleStatus(rule: RuleDto): void {
    this.adminService.toggleRuleStatus(rule.id!, !rule.active).subscribe({
      next: () => {
        this.toastService.success(`Rule "${rule.name}" ${rule.active ? 'deactivated' : 'activated'}`, 4000);
        this.loadRules();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to toggle rule status');
      }
    });
  }

  deleteRule(rule: RuleDto): void {
    this.ruleToDelete = rule;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.ruleToDelete) return;

    this.adminService.deleteRule(this.ruleToDelete.id!).subscribe({
      next: () => {
        this.toastService.success(`Rule "${this.ruleToDelete!.name}" deleted successfully`, 5000);
        this.closeDeleteModal();
        this.loadRules();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete rule');
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.ruleToDelete = null;
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'BLOCK': return 'bg-danger';
      case 'FLAG': return 'bg-warning';
      case 'REVIEW': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getRiskBadgeClass(riskWeight: number): string {
    if (riskWeight >= 80) return 'bg-danger';
    if (riskWeight >= 50) return 'bg-warning';
    return 'bg-success';
  }
  
  // Stats Methods
  getBlockRulesCount(): number {
    return this.rules.filter(r => r.action === 'BLOCK').length;
  }
  
  getFlagRulesCount(): number {
    return this.rules.filter(r => r.action === 'FLAG').length;
  }
  
  getActiveRulesCount(): number {
    return this.rules.filter(r => r.active).length;
  }
  
  getTotalRulesCount(): number {
    return this.rules.length;
  }

  // Dynamic condition field helpers
  getConditionConfig(type: string): any {
    const configs: any = {
      'AMOUNT': {
        needsField: false,
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'number',
        valuePlaceholder: 'Enter amount (e.g., 10000)',
        description: 'Compare transaction amount against threshold'
      },
      'COUNTRY_RISK': {
        needsField: false,
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'number',
        valuePlaceholder: 'Enter risk score (0-10, e.g., 7)',
        description: 'Evaluate country risk score from database'
      },
      'NLP_SCORE': {
        needsField: false,
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'number',
        valuePlaceholder: 'Enter score (0.0-1.0, e.g., 0.8)',
        description: 'Compare NLP sentiment/risk analysis score'
      },
      'KEYWORD_MATCH': {
        needsField: false,
        operators: ['>', '>=', '==', '<=', '<'],
        operatorLabels: {
          '>': 'Contains whole word',
          '>=': 'Contains substring',
          '==': 'Exact match',
          '<=': 'Contains/starts/ends with',
          '<': 'Does NOT contain'
        },
        valueType: 'text',
        valuePlaceholder: 'Enter keyword (e.g., cash, bitcoin)',
        description: 'Match keywords in transaction description'
      },
      'PAST_TRANSACTIONS': {
        needsField: true,
        fieldOptions: ['count', 'sum'],
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'complex',
        valueFields: ['lookbackDays', 'threshold'],
        valuePlaceholder: 'lookbackDays|threshold (e.g., 30|10 or 7|50000)',
        description: 'Analyze historical transaction patterns'
      },
      'VELOCITY': {
        needsField: true,
        fieldOptions: ['count'],
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'complex',
        valueFields: ['minAmount', 'minCount', 'windowHours', 'transactionType'],
        valueFieldTypes: ['number', 'number', 'number', 'dropdown'], // Specify field types
        valuePlaceholder: 'minAmount|minCount|windowHours|type (e.g., 100000|3|24|DEPOSIT)',
        description: 'Detect rapid transaction patterns'
      },
      'STRUCTURING': {
        needsField: true,
        fieldOptions: ['sum'],
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'complex',
        valueFields: ['maxSingle', 'maxWindowSum', 'windowHours', 'transactionTypes'],
        valueFieldTypes: ['number', 'number', 'number', 'dropdown'],
        valuePlaceholder: 'maxSingle|maxSum|windowHours|types (e.g., 50000|300000|24|DEPOSIT)',
        description: 'Detect structuring/smurfing patterns'
      },
      'BEHAVIORAL_DEVIATION': {
        needsField: true,
        fieldOptions: ['amount_percentile'],
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'complex',
        valueFields: ['lookbackDays', 'percentile'],
        valuePlaceholder: 'lookbackDays|percentile (e.g., 90|95)',
        description: 'Detect unusual behavior vs historical pattern'
      },
      'AMOUNT_BALANCE_RATIO': {
        needsField: false,
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'number',
        valuePlaceholder: 'Enter ratio (0.0-1.0, e.g., 0.8 for 80%)',
        description: 'Compare transaction amount to account balance'
      },
      'DAILY_TOTAL': {
        needsField: true,
        fieldOptions: ['sum'],
        operators: ['>', '>=', '<', '<=', '=='],
        valueType: 'complex',
        valueFields: ['threshold', 'windowHours', 'transactionTypes'],
        valueFieldTypes: ['number', 'number', 'dropdown'],
        valuePlaceholder: 'threshold|windowHours|types (e.g., 500000|24|ANY)',
        description: 'Monitor total transaction volume'
      },
      'NEW_COUNTERPARTY': {
        needsField: false,
        operators: ['>='],
        valueType: 'complex',
        valueFields: ['lookbackDays', 'minAmount', 'transactionTypes'],
        valueFieldTypes: ['number', 'number', 'dropdown'],
        valuePlaceholder: 'lookbackDays|minAmount|types (e.g., 30|50000|TRANSFER)',
        description: 'Flag transactions to new/unknown recipients'
      },
      'PATTERN_DEPOSIT_WITHDRAW': {
        needsField: false,
        operators: ['>='],
        valueType: 'complex',
        valueFields: ['requiredPairs', 'amountMultiplier'],
        valuePlaceholder: 'requiredPairs|multiplier (e.g., 3|1.0)',
        description: 'Detect layering patterns (deposit then withdrawal)'
      }
    };
    return configs[type] || {};
  }

  onConditionTypeChange(index: number): void {
    const condition = this.conditions.at(index);
    const type = condition.get('type')?.value;
    const config = this.getConditionConfig(type);

    // Set default field if needed
    if (config.needsField && config.fieldOptions && config.fieldOptions.length > 0) {
      condition.patchValue({ field: config.fieldOptions[0] });
    } else {
      condition.patchValue({ field: '' });
    }

    // Set default operator
    if (config.operators && config.operators.length > 0) {
      condition.patchValue({ operator: config.operators[0] });
    }

    // Clear all value fields
    condition.patchValue({ 
      value: '',
      valueField1: '',
      valueField2: '',
      valueField3: '',
      valueField4: ''
    });
  }

  // Sync individual value fields to main value field (for complex types)
  onValueFieldChange(index: number): void {
    const condition = this.conditions.at(index);
    const type = condition.get('type')?.value;
    const config = this.getConditionConfig(type);
    
    if (config.valueType === 'complex' && config.valueFields) {
      const field1 = condition.get('valueField1')?.value || '';
      const field2 = condition.get('valueField2')?.value || '';
      const field3 = condition.get('valueField3')?.value || '';
      const field4 = condition.get('valueField4')?.value || '';
      
      const values = [field1, field2, field3, field4].filter((v, i) => i < config.valueFields.length && v);
      condition.patchValue({ value: values.join('|') }, { emitEvent: false });
    }
  }

  getOperatorLabel(type: string, operator: string): string {
    const config = this.getConditionConfig(type);
    if (config.operatorLabels && config.operatorLabels[operator]) {
      return config.operatorLabels[operator];
    }
    return operator;
  }

  formatConditionValue(condition: any): string {
    const type = condition.type;
    const value = condition.value;

    if (!value) return '';

    const config = this.getConditionConfig(type);
    if (config.valueType === 'complex' && config.valueFields) {
      const parts = value.split('|');
      if (parts.length === config.valueFields.length) {
        return config.valueFields.map((field: string, i: number) => 
          `${field}: ${parts[i]}`
        ).join(', ');
      }
    }

    return value;
  }
  
  // View conditions modal methods
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
}
