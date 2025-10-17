import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountService, CreateAccountRequest, AccountDto } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-open-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-3">
      <h3 class="mb-3">Open a Bank Account</h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card p-3">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Account Type</label>
            <select class="form-select" formControlName="accountType">
              <option value="SAVINGS">Savings</option>
              <option value="CURRENT">Current</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Initial Deposit</label>
            <input type="number" class="form-control" formControlName="initialDeposit" min="0" step="0.01" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Currency</label>
            <input type="text" class="form-control" formControlName="currency" placeholder="e.g. INR, USD" />
          </div>
        </div>

        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
          <div *ngIf="error" class="text-danger">{{ error }}</div>
          <div *ngIf="success" class="text-success">Account created successfully!</div>
        </div>
      </form>

      <div *ngIf="created" class="card p-3 mt-3">
        <h5 class="mb-2">New Account</h5>
        <div>Account Number: <strong>{{ created.accountNumber }}</strong></div>
        <div>Type: {{ created.accountType }}</div>
        <div>Balance: {{ created.balance }} {{ created.currency }}</div>
      </div>
    </div>
  `
})
export class CustomerOpenAccountComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;
  created: AccountDto | null = null;

  constructor(private fb: FormBuilder, private accounts: AccountService) {
    this.form = this.fb.group({
      accountType: ['SAVINGS', Validators.required],
      initialDeposit: [0, [Validators.required, Validators.min(0)]],
      currency: ['INR']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = false;

    const req: CreateAccountRequest = this.form.value as CreateAccountRequest;
    this.accounts.createAccount(req).subscribe({
      next: (resp) => {
        this.loading = false;
        // Support ApiResponse wrapper { success, data, message } or direct AccountDto
        const dto = (resp as any)?.data ?? (resp as any);
        this.created = dto as AccountDto;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create account';
      }
    });
  }
}
