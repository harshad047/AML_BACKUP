import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { TransactionService, TransactionDto } from '../../../core/services/transaction.service';
import { AccountService, AccountDto } from '../../../core/services/account.service';
import { ToastService } from '../../../core/services/toast.service';

// Custom Validators
class CustomValidators {
  // Validate positive amount (greater than 0)
  static positiveAmount(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values, use Validators.required for that
      }
      const numValue = Number(control.value);
      if (isNaN(numValue) || numValue <= 0) {
        return { positiveAmount: true };
      }
      return null;
    };
  }
}

@Component({
  selector: 'app-customer-new-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-new-transaction.component.html',
  styleUrls: ['./customer-new-transaction.component.css']
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

  constructor(
    private fb: FormBuilder, 
    private tx: TransactionService, 
    private accountService: AccountService,
    private router: Router,
    private location: Location,
    private toastService: ToastService
  ) {
    this.form = this.fb.group(
      {
        type: ['DEPOSIT', Validators.required],
        amount: [0, [Validators.required, CustomValidators.positiveAmount()]],
        description: [''],
        toAccountNumber: ['', Validators.required],
        fromAccountNumber: ['']
      },
      { validators: this.differentAccountsValidator() }
    );
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
      this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
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
        this.toastService.success(`Transaction #${transactionDto.id} submitted successfully!`, 5000);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err?.error?.message || 'Failed to submit transaction');
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  resetForm(): void {
    this.form.reset({
      type: 'DEPOSIT',
      amount: 0,
      description: '',
      toAccountNumber: '',
      fromAccountNumber: ''
    });
    this.error = '';
    this.success = false;
    this.created = null;
  }

  createAnother(): void {
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;

    if (fieldName === 'amount') {
      if (errors['required']) {
        return 'Amount is required';
      }
      if (errors['positiveAmount']) {
        return 'Amount must be greater than 0';
      }
    }

    // Default error handling
    if (errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    return 'Invalid input';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      type: 'Transaction type',
      amount: 'Amount',
      toAccountNumber: 'To account',
      fromAccountNumber: 'From account'
    };
    return labels[fieldName] || fieldName;
  }

  private differentAccountsValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const fg = group as FormGroup;
      const type = fg.get('type')?.value;
      if (type !== 'TRANSFER') return null;
      const from = fg.get('fromAccountNumber')?.value;
      const to = fg.get('toAccountNumber')?.value;
      if (!from || !to) return null;
      return from === to ? { sameAccount: true } : null;
    };
  }
}
