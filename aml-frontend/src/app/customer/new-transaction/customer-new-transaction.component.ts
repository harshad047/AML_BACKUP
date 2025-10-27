import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { AccountService, AccountDto } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-new-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-3">
      <h3 class="mb-3">New Transaction</h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card p-3">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Type</label>
            <select class="form-select" formControlName="type">
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Amount</label>
            <input type="number" class="form-control" formControlName="amount" min="0" step="0.01" />
          </div>
          <!-- Currency auto-detected from account by backend -->
          <!-- Account identifiers per type -->
          <div class="col-md-6" *ngIf="form.value.type === 'DEPOSIT'">
            <label class="form-label">To Account</label>
            <select class="form-select" formControlName="toAccountNumber">
              <option [ngValue]="''" disabled>Select account</option>
              <option *ngFor="let acc of activeAccounts" [ngValue]="acc.accountNumber">
                {{ acc.accountNumber }} — {{ acc.accountType }} ({{ acc.currency }})
              </option>
            </select>
            <small class="text-muted" *ngIf="activeAccounts.length === 0">
              No active accounts available. Please ensure your account is approved and active.
            </small>
          </div>
          <div class="col-md-6" *ngIf="form.value.type === 'WITHDRAWAL'">
            <label class="form-label">From Account</label>
            <select class="form-select" formControlName="fromAccountNumber">
              <option [ngValue]="''" disabled>Select account</option>
              <option *ngFor="let acc of activeAccounts" [ngValue]="acc.accountNumber">
                {{ acc.accountNumber }} — {{ acc.accountType }} ({{ acc.currency }})
              </option>
            </select>
            <small class="text-muted" *ngIf="activeAccounts.length === 0">
              No active accounts available. Please ensure your account is approved and active.
            </small>
          </div>
          <div class="col-md-6" *ngIf="form.value.type === 'TRANSFER'">
            <label class="form-label">From Account</label>
            <select class="form-select" formControlName="fromAccountNumber">
              <option [ngValue]="''" disabled>Select account</option>
              <option *ngFor="let acc of activeAccounts" [ngValue]="acc.accountNumber">
                {{ acc.accountNumber }} — {{ acc.accountType }} ({{ acc.currency }})
              </option>
            </select>
            <small class="text-muted" *ngIf="activeAccounts.length === 0">
              No active accounts available. Please ensure your account is approved and active.
            </small>
          </div>
          <div class="col-md-6" *ngIf="form.value.type === 'TRANSFER'">
            <label class="form-label">To Account Number</label>
            <input type="text" class="form-control" formControlName="toAccountNumber" placeholder="e.g. ACC987" />
          </div>
          <div class="col-md-12">
            <label class="form-label">Description (optional)</label>
            <input type="text" class="form-control" formControlName="description" />
          </div>
        </div>

        <div class="mt-3 d-flex gap-2 align-items-center">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Submitting...' : 'Submit' }}
          </button>
          <div *ngIf="error" class="text-danger">{{ error }}</div>
          <div *ngIf="success" class="text-success">Transaction submitted!</div>
        </div>
      </form>

      <div *ngIf="created" class="card p-3 mt-3">
        <h5 class="mb-2">Created Transaction</h5>
        <div>Transaction Type: {{ created.transactionType }}</div>
        <div>Amount: {{ created.amount }}</div>
        <div>Status: {{ created.status }}</div>
        <div>Date: {{ created.createdAt }}</div>
      </div>
    </div>
  `
})
export class CustomerNewTransactionComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;
  created: TransactionDto | null = null;
  accounts: AccountDto[] = [];
  
  // Computed property to get only ACTIVE accounts
  get activeAccounts(): AccountDto[] {
    return this.accounts.filter(acc => 
      acc.status === 'ACTIVE' && acc.approvalStatus === 'APPROVED'
    );
  }

  constructor(private fb: FormBuilder, private tx: TransactionService, private accountService: AccountService) {
    this.form = this.fb.group({
      type: ['DEPOSIT', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      description: [''],
      toAccountNumber: ['', Validators.required],
      fromAccountNumber: ['']
    });
  }

  ngOnInit(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accountsData) => {
        // Backend returns AccountDto[] directly
        this.accounts = Array.isArray(accountsData) ? accountsData : [];
        console.log('Total accounts loaded:', this.accounts.length);
        console.log('Active accounts:', this.activeAccounts.length);
      },
      error: () => {
        this.accounts = [];
      }
    });

    this.form.get('type')?.valueChanges.subscribe((val: string) => {
      // Require appropriate account fields depending on type
      this.form.get('toAccountNumber')?.clearValidators();
      this.form.get('fromAccountNumber')?.clearValidators();

      if (val === 'DEPOSIT') {
        this.form.get('toAccountNumber')?.setValidators([Validators.required]);
        // Currency auto-detected from account by backend
      } else if (val === 'WITHDRAWAL') {
        this.form.get('fromAccountNumber')?.setValidators([Validators.required]);
        // Currency auto-detected from account by backend
      } else if (val === 'TRANSFER') {
        this.form.get('fromAccountNumber')?.setValidators([Validators.required]);
        this.form.get('toAccountNumber')?.setValidators([Validators.required]);
        // Currency auto-detected from fromAccount by backend
      }

      this.form.get('toAccountNumber')?.updateValueAndValidity();
      this.form.get('fromAccountNumber')?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = false;
    const v = this.form.value;
    let request$;
    if (v.type === 'DEPOSIT') {
      // POST /api/transactions/deposit { toAccountNumber, amount, description? }
      // Currency auto-detected from toAccount by backend
      request$ = this.tx.deposit({
        toAccountNumber: v.toAccountNumber,
        amount: Number(v.amount),
        description: v.description
      });
    } else if (v.type === 'WITHDRAWAL') {
      // POST /api/transactions/withdraw { fromAccountNumber, amount, description? }
      request$ = this.tx.withdraw({
        fromAccountNumber: v.fromAccountNumber,
        amount: Number(v.amount),
        description: v.description
      });
    } else {
      // TRANSFER: POST /api/transactions/transfer { fromAccountNumber, toAccountNumber, amount, description? }
      // Currency auto-detected from fromAccount by backend
      request$ = this.tx.transfer({
        fromAccountNumber: v.fromAccountNumber,
        toAccountNumber: v.toAccountNumber,
        amount: Number(v.amount),
        description: v.description
      });
    }

    request$.subscribe({
      next: (transactionDto) => {
        this.loading = false;
        // Backend returns TransactionDto directly
        this.created = transactionDto;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to submit transaction';
      }
    });
  }
}
