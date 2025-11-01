import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { AdminService, RuleDto, RuleConditionDto } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

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
      field: ['amount', Validators.required],
      operator: ['>', Validators.required],
      value: ['', Validators.required],
      active: [true]
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
        const conditionGroup = this.fb.group({
          type: [cond.type || 'AMOUNT', Validators.required],
          field: [cond.field, Validators.required],
          operator: [cond.operator, Validators.required],
          value: [cond.value, Validators.required],
          active: [cond.active !== undefined ? cond.active : true]
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
    if (!confirm(`Are you sure you want to delete rule "${rule.name}"?`)) return;

    this.adminService.deleteRule(rule.id!).subscribe({
      next: () => {
        this.toastService.success(`Rule "${rule.name}" deleted successfully`, 5000);
        this.loadRules();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete rule');
      }
    });
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
}
