import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AdminService, RuleDto, RuleConditionDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.css']
})
export class RulesComponent implements OnInit {
  rules: RuleDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  showCreateForm = false;
  ruleForm: FormGroup;
  savingRule = false;
  editingRule: RuleDto | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
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
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load rules';
        this.loading = false;
      }
    });
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
      field: ['amount', Validators.required],
      operator: ['>', Validators.required],
      value: ['', Validators.required]
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
          field: [cond.field, Validators.required],
          operator: [cond.operator, Validators.required],
          value: [cond.value, Validators.required]
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
        this.success = `Rule "${rule.name}" ${this.editingRule ? 'updated' : 'created'} successfully!`;
        this.savingRule = false;
        this.resetForm();
        this.showCreateForm = false;
        this.editingRule = null;
        this.loadRules();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save rule';
        this.savingRule = false;
      }
    });
  }

  toggleRuleStatus(rule: RuleDto): void {
    this.adminService.toggleRuleStatus(rule.id!, !rule.active).subscribe({
      next: () => {
        this.success = `Rule "${rule.name}" ${rule.active ? 'deactivated' : 'activated'}`;
        this.loadRules();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to toggle rule status';
      }
    });
  }

  deleteRule(rule: RuleDto): void {
    if (!confirm(`Are you sure you want to delete rule "${rule.name}"?`)) return;

    this.adminService.deleteRule(rule.id!).subscribe({
      next: () => {
        this.success = `Rule "${rule.name}" deleted successfully`;
        this.loadRules();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete rule';
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
}
