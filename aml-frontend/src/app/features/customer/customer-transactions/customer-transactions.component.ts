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

  // Filter accounts to show only ACTIVE and SUSPENDED (exclude PENDING)
  getActiveAndSuspendedAccounts(): AccountDto[] {
    return this.accounts.filter(acc => 
      acc.status === 'ACTIVE' || acc.status === 'SUSPENDED'
    );
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
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const effectiveAccountLabel = effectiveAccountNumber && effectiveAccountNumber !== ''
      ? effectiveAccountNumber
      : 'All Accounts';

    // 1. Professional Header with Branding
    // Header background
    doc.setFillColor(13, 110, 253); // Primary blue color
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Company/App Name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSPECT', 14, 15);

    // Tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Anti-Money Laundering Banking System', 14, 22);

    // Statement Title
    doc.setFontSize(11);
    doc.text('ACCOUNT STATEMENT', 14, 29);

    // Add decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(14, 31, pageWidth - 14, 31);

    // 2. Statement Information Section
    let yPos = 45;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Left column - Account Info
    doc.setFont('helvetica', 'bold');
    doc.text('Account Number:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(effectiveAccountLabel, 55, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Statement Period:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    if (dateFromLabel || dateToLabel) {
      const range = `${dateFromLabel || 'Beginning'} to ${dateToLabel || 'Present'}`;
      doc.text(range, 55, yPos);
    } else {
      doc.text('All Transactions', 55, yPos);
    }

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Filter:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${filterText} Transactions`, 55, yPos);

    // Right column - Generation Info
    const rightX = pageWidth - 70;
    yPos = 45;
    doc.setFont('helvetica', 'bold');
    doc.text('Generated On:', rightX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(this.datePipe.transform(new Date(), 'dd MMM yyyy, h:mm a') || '', rightX + 30, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Currency:', rightX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('INR (₹)', rightX + 30, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Records:', rightX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.length.toString(), rightX + 30, yPos);

    // Add separator line
    yPos += 4;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, yPos, pageWidth - 14, yPos);

    const startY = yPos + 6;

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

    // 4. Generate the table using autoTable with enhanced styling
    autoTable(doc, {
      head,
      body,
      startY,
      theme: 'striped',
      headStyles: {
        fillColor: [13, 110, 253],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 38 },  // Date
        1: { cellWidth: 32 },  // Type
        2: { cellWidth: 55 },  // Description
        3: { cellWidth: 28, halign: 'center' },  // Status
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }  // Amount
      },
      margin: { top: 35, bottom: 30, left: 14, right: 14 },
      didDrawPage: (data: { pageNumber: number }) => {
        // Footer section
        const footerY = pageHeight - 20;
        
        // Footer separator line
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.5);
        doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
        
        // Footer content
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        
        // Left side - Company info
        doc.text('TRANSPECT - AML Banking System', 14, footerY);
        doc.text('Secure • Compliant • Transparent', 14, footerY + 4);
        
        // Center - Disclaimer
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        const disclaimerText = 'This is a system-generated statement and does not require a signature.';
        const textWidth = doc.getTextWidth(disclaimerText);
        doc.text(disclaimerText, (pageWidth - textWidth) / 2, footerY + 8);
        
        // Right side - Page number
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageText = `Page ${data.pageNumber} of ${pageCount}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - 14 - pageTextWidth, footerY);
        
        // Confidential notice
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const confText = 'CONFIDENTIAL - For account holder use only';
        const confTextWidth = doc.getTextWidth(confText);
        doc.text(confText, pageWidth - 14 - confTextWidth, footerY + 4);
      }
    });

    // 5. Add summary section after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Calculate totals
    const totalAmount = data.reduce((sum, t) => sum + (t.amount || 0), 0);
    const approvedCount = data.filter(t => t.status?.toLowerCase() === 'approved').length;
    const flaggedCount = data.filter(t => t.status?.toLowerCase() === 'flagged').length;
    const blockedCount = data.filter(t => t.status?.toLowerCase() === 'blocked').length;
    
    // Summary box
    if (finalY < pageHeight - 60) {
      doc.setDrawColor(13, 110, 253);
      doc.setLineWidth(0.5);
      doc.line(14, finalY, pageWidth - 14, finalY);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Summary', 14, finalY + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Transactions: ${data.length}`, 14, finalY + 15);
      doc.text(`Approved: ${approvedCount}`, 14, finalY + 21);
      doc.text(`Flagged: ${flaggedCount}`, 70, finalY + 21);
      doc.text(`Blocked: ${blockedCount}`, 120, finalY + 21);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Amount: ${this.currencyPipe.transform(totalAmount, 'INR', 'symbol', '1.2-2')}`, 14, finalY + 27);
    }

    // 6. Save the PDF with professional filename
    const accountFilePart = effectiveAccountLabel === 'All Accounts' ? 'AllAccounts' : effectiveAccountLabel.replace(/[^a-zA-Z0-9]/g, '');
    const datePart = this.datePipe.transform(new Date(), 'yyyyMMdd-HHmmss');
    doc.save(`TRANSPECT-Statement-${accountFilePart}-${datePart}.pdf`);
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