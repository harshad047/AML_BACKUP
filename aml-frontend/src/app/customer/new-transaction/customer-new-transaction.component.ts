import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService, TransactionDto } from '../../core/services/transaction.service';
import { AccountService, AccountDto } from '../../core/services/account.service';

@Component({
  selector: 'app-customer-new-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-new-transaction.component.html'
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
