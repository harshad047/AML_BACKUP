import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
// Import CurrencyPipe for use in the component logic
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService, TransactionDto } from '../../../core/services/transaction.service';
import { AccountService, AccountDto } from '../../../core/services/account.service';
import { HelpdeskApiService } from '../../../core/services/helpdesk.service';
import { ToastService } from '../../../core/services/toast.service';

// Import jsPDF and the autoTable plugin
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Use Bootstrap modal via global (no TS import needed)
declare var bootstrap: any;

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-transactions.component.html',
  styleUrls: ['./customer-transactions.component.css'],
  // Add DatePipe and CurrencyPipe to providers to inject them
  providers: [DatePipe, CurrencyPipe]
})
export class CustomerTransactionsComponent implements OnInit, OnChanges {
  // --- START: Original Properties ---
  @Input() accountNumber?: string;
  @Input() accounts: AccountDto[] = [];
  selectedAccountNumber: string = '';
  transactions: TransactionDto[] = [];
  allTransactions: TransactionDto[] = [];
  loading = false;
  error = '';
  filterStatus: 'all' | 'approved' | 'flagged' | 'blocked' | 'pending' = 'all';
  selectedTransaction: TransactionDto | null = null;
  ticketTransaction: TransactionDto | null = null;
  ticketForm: FormGroup;
  ticketSuccess = '';
  ticketError = '';
  submittingTicket = false;
  // --- END: Original Properties ---
  
  // --- START: Statement Modal State ---
  // Account picked specifically for statement; defaults to current page filter
  statementAccountNumber: string = '';
  // Temporary date strings bound to date inputs (yyyy-MM-dd)
  tempDateFrom: string | null = null;
  tempDateTo: string | null = null;
  // --- END: Statement Modal State ---

  constructor(
    private tx: TransactionService,
    private accountService: AccountService,
    private fb: FormBuilder,
    private helpdeskService: HelpdeskApiService,
    private toastService: ToastService,
    // --- START: New Injections for PDF ---
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
    // --- END: New Injections for PDF ---
  ) {
    // This is from your original code
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  // --- START: Original Methods ---
  ngOnInit(): void {
    this.fetch();
    this.fetchAccounts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accounts'] && this.accounts && this.accounts.length > 0 && !this.selectedAccountNumber) {
      // Do not auto-select to avoid surprising the user; keep "All accounts" default
    }
    if (changes['accountNumber'] && this.accountNumber && !this.selectedAccountNumber) {
      // If a specific accountNumber input is provided, use it unless user selected a different one
      this.selectedAccountNumber = this.accountNumber;
    }
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    // 🔽 UPDATED: Simplified fetch logic to use selectedAccountNumber
    const effectiveAccount = this.selectedAccountNumber;
    const obs = (effectiveAccount && effectiveAccount !== '')
      ? this.tx.getHistoryByAccount(effectiveAccount)
      : this.tx.getHistory();
    // 🔼
      
    obs.subscribe({
      next: (transactionsData: TransactionDto[]) => {
        // ... (rest of fetch method is the same)
        this.loading = false;
        this.allTransactions = Array.isArray(transactionsData) ? transactionsData : [];
        this.transactions = [...this.allTransactions];
        this.updateFilteredTransactions();
      },
      error: (err: any) => {
        // ... (rest of error handling is the same)
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load transactions';
        this.allTransactions = [];
        this.transactions = [];
      }
    });
  }

  // 🔽 NEW METHOD: Add this to handle account selection
  onAccountChange(): void {
    this.fetch(); // Re-fetch transactions for the selected account
  }

  fetchAccounts(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accountsData: AccountDto[]) => {
        this.accounts = Array.isArray(accountsData) ? accountsData : [];
      },
      error: (err: any) => {
        console.error('Failed to load accounts:', err);
        this.accounts = [];
      }
    });
  }

  onFilterChange(value: string): void {
    this.filterStatus = value as 'all' | 'approved' | 'flagged' | 'blocked' | 'pending';
    this.updateFilteredTransactions();
  }

  private updateFilteredTransactions(): void {
    if (this.filterStatus === 'all') {
      this.transactions = [...this.allTransactions];
    } else if (this.filterStatus === 'approved') {
      this.transactions = this.allTransactions.filter(t => {
        const s = t.status?.toLowerCase();
        return s === 'completed' || s === 'success' || s === 'approved';
      });
    } else if (this.filterStatus === 'flagged') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'flagged');
    } else if (this.filterStatus === 'blocked') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'blocked');
    } else if (this.filterStatus === 'pending') {
      this.transactions = this.allTransactions.filter(t => t.status?.toLowerCase() === 'pending');
    }
  }

  statusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'bg-success';
    if (s === 'pending') return 'bg-warning';
    if (s === 'rejected' || s === 'failed') return 'bg-danger';
    if (s === 'flagged') return 'bg-info';
    if (s === 'blocked') return 'bg-danger';
    return 'bg-secondary';
  }

  getTransactionType(transaction: TransactionDto): string {
    // Handle different possible field names for transaction type
    return transaction.transactionType ||
      (transaction as any).type ||
      (transaction as any).operationType ||
      (transaction as any).txType ||
      'Unknown';
  }

  getStatusText(transaction: TransactionDto): string {
    return transaction.status || 'Unknown';
  }

  // Statistics methods
  getTotalTransactions(): number {
    return this.allTransactions.length;
  }

  getApprovedTransactions(): number {
    return this.allTransactions.filter(t => {
      const s = t.status?.toLowerCase();
      return s === 'completed' || s === 'success' || s === 'approved';
    }).length;
  }

  getFlaggedTransactionsOnly(): number {
    return this.allTransactions.filter(t => t.status?.toLowerCase() === 'flagged').length;
  }

  getBlockedTransactions(): number {
    return this.allTransactions.filter(t => t.status?.toLowerCase() === 'blocked').length;
  }

  // Transaction type icon methods
  getTypeIcon(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'fa-arrow-down';
    if (type.includes('WITHDRAWAL')) return 'fa-arrow-up';
    if (type.includes('TRANSFER')) return 'fa-exchange-alt';
    if (type.includes('INTERCURRENCY')) return 'fa-globe';
    return 'fa-money-bill-wave';
  }

  getTypeIconClass(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'icon-deposit';
    if (type.includes('WITHDRAWAL')) return 'icon-withdrawal';
    if (type.includes('TRANSFER')) return 'icon-transfer';
    if (type.includes('INTERCURRENCY')) return 'icon-intercurrency';
    return 'icon-default';
  }

  getAmountClass(transaction: TransactionDto): string {
    const type = this.getTransactionType(transaction).toUpperCase();
    if (type.includes('DEPOSIT')) return 'amount-positive';
    if (type.includes('WITHDRAWAL')) return 'amount-negative';
    return 'amount-neutral';
  }

  hasObstructedRules(): boolean {
    const tx: any = this.selectedTransaction as any;
    const list = tx && Array.isArray(tx.obstructedRules) ? tx.obstructedRules : [];
    return list.length > 0;
  }

  getObstructedRules(): any[] {
    const tx: any = this.selectedTransaction as any;
    return tx && Array.isArray(tx.obstructedRules) ? tx.obstructedRules : [];
  }

  // Risk score methods
  getRiskScore(transaction: any): string {
    if (transaction.combinedRiskScore !== undefined && transaction.combinedRiskScore !== null) {
      return transaction.combinedRiskScore.toString();
    }
    return 'N/A';
  }

  getRiskScoreClass(transaction: any): string {
    const score = transaction.combinedRiskScore;
    if (score === undefined || score === null) return 'risk-na';
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  getRuleActionClass(action: string): string {
    const a = action?.toUpperCase();
    if (a === 'BLOCK') return 'bg-danger';
    if (a === 'FLAG') return 'bg-warning';
    if (a === 'REVIEW') return 'bg-info';
    return 'bg-secondary';
  }

  // Modal methods
  viewTransactionDetails(transaction: TransactionDto): void {
    this.selectedTransaction = transaction;
    // Use Bootstrap's modal API
    const modalElement = document.getElementById('transactionModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Helpdesk methods
  canRaiseTicket(transaction: TransactionDto): boolean {
    const status = transaction.status?.toLowerCase();
    const type = this.getTransactionType(transaction).toUpperCase();

    // Only allow tickets for flagged/blocked DEPOSIT or WITHDRAWAL transactions
    const isValidStatus = status === 'flagged' || status === 'blocked';
    const isValidType = type.includes('DEPOSIT') || type.includes('WITHDRAWAL');

    return isValidStatus && isValidType;
  }

  openTicketModal(transaction: TransactionDto): void {
    this.ticketTransaction = transaction;
    this.ticketSuccess = '';
    this.ticketError = '';
    this.ticketForm.reset({
      subject: `Issue with Transaction #${transaction.id}`,
      message: ''
    });
    const modalElement = document.getElementById('ticketModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  submitTicket(): void {
    if (this.ticketForm.invalid || !this.ticketTransaction) return;

    this.submittingTicket = true;
    this.ticketError = '';
    this.ticketSuccess = '';

    const { subject, message } = this.ticketForm.value;

    this.helpdeskService.createTicket(this.ticketTransaction.id, { subject, message }).subscribe({
      next: (ticket) => {
        this.submittingTicket = false;
        this.ticketSuccess = `Ticket #${ticket.id} created successfully!`;
        this.ticketForm.reset();
        setTimeout(() => {
          const modalElement = document.getElementById('ticketModal');
          if (modalElement) {
            const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
          }
        }, 2000);
      },
      error: (err) => {
        this.submittingTicket = false;
        this.ticketError = err?.error?.message || 'Failed to create ticket';
      }
    });
  }
  // --- END: Original Methods ---


  // --- START: New PDF Generation Method ---
  generatePDFStatement(): void {
    // Build filtered data for statement using modal selections
    const pageAccount = this.selectedAccountNumber || '';
    const effectiveAccountNumber = (this.statementAccountNumber ?? '').trim() !== ''
      ? (this.statementAccountNumber as string)
      : pageAccount;

    // Start with all transactions available in memory
    let data = [...this.allTransactions];

    // Filter by account if specified
    if (effectiveAccountNumber && effectiveAccountNumber !== '') {
      data = data.filter(t => (t as any).fromAccountNumber === effectiveAccountNumber || (t as any).toAccountNumber === effectiveAccountNumber || (t as any).accountNumber === effectiveAccountNumber);
    }

    // Filter by current status filter on page
    if (this.filterStatus !== 'all') {
      data = data.filter(t => (t.status || '').toLowerCase() === this.filterStatus);
    }

    // Apply date range from modal if provided
    let dateFromLabel = '';
    let dateToLabel = '';
    const from = this.tempDateFrom ? new Date(this.tempDateFrom + 'T00:00:00') : null;
    const to = this.tempDateTo ? new Date(this.tempDateTo + 'T23:59:59') : null;
    if (from) {
      dateFromLabel = this.datePipe.transform(from, 'mediumDate') || '';
      data = data.filter(t => new Date(t.createdAt) >= from);
    }
    if (to) {
      dateToLabel = this.datePipe.transform(to, 'mediumDate') || '';
      data = data.filter(t => new Date(t.createdAt) <= to);
    }

    if (data.length === 0) {
      // Show feedback to user
      this.toastService.warning('No transactions found for the selected account and date range.');
      return;
    }

    const doc = new jsPDF();
    const filterText = this.filterStatus.charAt(0).toUpperCase() + this.filterStatus.slice(1);

    const effectiveAccountLabel = effectiveAccountNumber && effectiveAccountNumber !== ''
      ? effectiveAccountNumber
      : 'All Accounts';

    // 1. Set Title and Header Info
    doc.setFontSize(18);
    doc.text('Account Statement', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Account Number: ${effectiveAccountLabel}`, 14, 32);
    doc.text(`Generated On: ${this.datePipe.transform(new Date(), 'longDate')}`, 14, 38);
    doc.text(`Filtered By: ${filterText} Transactions`, 14, 44);
    if (dateFromLabel || dateToLabel) {
      const range = `${dateFromLabel || 'Start'} to ${dateToLabel || 'End'}`;
      doc.text(`Date Range: ${range}`, 14, 50);
    }
    // Currency note
    doc.text('All amounts are in INR (₹)', 14, dateFromLabel || dateToLabel ? 56 : 50);
    const startY = (dateFromLabel || dateToLabel) ? 62 : 56;

    // 2. Define Table Columns
    const head = [['Date', 'Type', 'Description', 'Status', 'Amount']];

    // 3. Map Transaction Data to Table Rows
    const body = data.map(t => [
      this.datePipe.transform(t.createdAt, 'dd-MMM-yyyy, h:mm a') || '-',
      this.getTransactionType(t),
      t.description || '-',
      this.getStatusText(t),
      this.currencyPipe.transform(t.amount, 'INR', '', '1.2-2') || '-'
    ]);

    // 4. Generate the table using autoTable
    autoTable(doc, {
      head,
      body,
      startY,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 110, 253],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        4: { halign: 'right' }
      },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.setTextColor(150);
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 28, doc.internal.pageSize.height - 10);
      }
    });

    // 5. Save the PDF
    const accountFilePart = effectiveAccountLabel === 'All Accounts' ? 'all' : effectiveAccountLabel;
    const datePart = this.tempDateFrom || this.tempDateTo
      ? `${this.tempDateFrom || 'start'}_${this.tempDateTo || 'end'}`
      : this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    doc.save(`statement-${accountFilePart}-${datePart}.pdf`);
  }
  // --- END: New PDF Generation Method ---

  // --- START: Statement Modal Methods ---
  openStatementModal(): void {
    // Default modal selections from current page filter
    this.statementAccountNumber = this.selectedAccountNumber || '';
    // Do not alter temp dates here; keep user entries until cleared
    const el = document.getElementById('statementModal');
    if (el && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
    }
  }

  clearTempDates(): void {
    this.tempDateFrom = null;
    this.tempDateTo = null;
  }

  applyDatesAndGenerate(): void {
    // Close modal then generate
    const el = document.getElementById('statementModal');
    if (el && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.hide();
    }
    // Generate with current modal selections
    this.generatePDFStatement();
  }
  // --- END: Statement Modal Methods ---
}