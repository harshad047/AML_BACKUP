import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../core/services/compliance.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionDto } from '../../core/models/compliance.models';

@Component({
  selector: 'app-transaction-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './transaction-review.component.html',
  styleUrls: ['./transaction-review.component.css']
})
export class TransactionReviewComponent implements OnInit {
  activeTab = 'review';
  
  reviewTransactions: TransactionDto[] = [];
  flaggedTransactions: TransactionDto[] = [];
  blockedTransactions: TransactionDto[] = [];
  allTransactions: TransactionDto[] = [];
  filteredTransactions: TransactionDto[] = [];
  
  selectedTransaction: TransactionDto | null = null;
  
  // Track transactions with active cases
  transactionsWithCases: Set<number> = new Set();
  
  loading = false;
  loadingMessage = '';
  error: string | null = null;
  
  // Filters
  typeFilter = '';
  riskFilter = '';
  searchTerm = '';
  
  // Rejection
  rejectionReason = '';
  transactionToReject: TransactionDto | null = null;

  constructor(
    private complianceService: ComplianceService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    // Load all transaction types
    Promise.all([
      this.complianceService.getTransactionsForReview().toPromise(),
      this.complianceService.getFlaggedTransactions().toPromise(),
      this.complianceService.getBlockedTransactions().toPromise(),
      this.complianceService.getAllTransactions().toPromise()
    ]).then(([review, flagged, blocked, all]) => {
      this.reviewTransactions = review || [];
      this.flaggedTransactions = flagged || [];
      this.blockedTransactions = blocked || [];
      this.allTransactions = all || [];
      this.applyFilters();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading transactions:', error);
      this.error = 'Failed to load transactions';
      this.loading = false;
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let transactions: TransactionDto[] = [];
    
    switch (this.activeTab) {
      case 'review':
        transactions = this.reviewTransactions;
        break;
      case 'flagged':
        transactions = this.flaggedTransactions;
        break;
      case 'blocked':
        transactions = this.blockedTransactions;
        break;
      case 'all':
        transactions = this.allTransactions;
        break;
    }

    this.filteredTransactions = transactions.filter(transaction => {
      // Type filter
      if (this.typeFilter && transaction.transactionType !== this.typeFilter) {
        return false;
      }

      // Risk filter
      if (this.riskFilter) {
        const riskScore = transaction.combinedRiskScore || 0;
        switch (this.riskFilter) {
          case 'high':
            if (riskScore < 80) return false;
            break;
          case 'medium':
            if (riskScore < 60 || riskScore >= 80) return false;
            break;
          case 'low':
            if (riskScore >= 60) return false;
            break;
        }
      }

      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return transaction.id.toString().includes(searchLower) ||
               transaction.transactionReference.toLowerCase().includes(searchLower) ||
               (transaction.description && transaction.description.toLowerCase().includes(searchLower)) ||
               (transaction.fromAccountNumber && transaction.fromAccountNumber.toLowerCase().includes(searchLower)) ||
               (transaction.toAccountNumber && transaction.toAccountNumber.toLowerCase().includes(searchLower));
      }

      return true;
    });
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'review': return 'Transactions for Review';
      case 'flagged': return 'Flagged Transactions';
      case 'blocked': return 'Blocked Transactions';
      case 'all': return 'All Transactions';
      default: return 'Transactions';
    }
  }

  getRiskScoreClass(riskScore: number): string {
    if (riskScore >= 80) return 'risk-high';
    if (riskScore >= 60) return 'risk-medium';
    return 'risk-low';
  }

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'FLAGGED': return 'status-flagged';
      case 'BLOCKED': return 'status-blocked';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-pending';
    }
  }

  getTransactionRowClass(transaction: TransactionDto): string {
    const riskScore = transaction.combinedRiskScore || 0;
    if (riskScore >= 80) return 'transaction-row-high';
    if (riskScore >= 60) return 'transaction-row-medium';
    return 'transaction-row-low';
  }

  canApproveReject(status: string): boolean {
    return ['FLAGGED', 'BLOCKED', 'PENDING'].includes(status.toUpperCase());
  }

  canInvestigate(transaction: TransactionDto): boolean {
    return ['FLAGGED', 'BLOCKED'].includes(transaction.status.toUpperCase());
  }

  hasActiveCase(transaction: TransactionDto): boolean {
    return this.transactionsWithCases.has(transaction.id);
  }


  // Transaction actions
  viewTransactionDetails(transaction: TransactionDto): void {
    this.selectedTransaction = transaction;
    // Open Bootstrap modal
    const modalElement = document.getElementById('transactionDetailsModal');
    if (modalElement) {
      // Use Bootstrap 5 modal API
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('Modal element not found');
    }
  }

  investigateTransaction(transaction: TransactionDto): void {
    // Get alert ID from transaction
    const alertId = this.getAlertIdFromTransaction(transaction);
    
    if (!alertId) {
      this.toastService.error('No alert found for this transaction. Cannot create investigation case.');
      return;
    }

    if (!confirm(`Create investigation case for Transaction #${transaction.id}?\n\nThis will escalate the alert and start a formal investigation.`)) {
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Creating investigation case...';
    this.complianceService.createCaseFromAlert(alertId).subscribe({
      next: (caseDto) => {
        this.loading = false;
        this.loadingMessage = '';
        // Mark this transaction as having an active case
        this.transactionsWithCases.add(transaction.id);
        
        this.toastService.success(`Investigation Case #${caseDto.id} created successfully! Assigned to: ${caseDto.assignedTo}. You can now approve or reject the transaction.`, 7000);
        
        // Optionally navigate to case details
        // this.router.navigate(['/compliance/cases', caseDto.id]);
      },
      error: (error) => {
        this.loading = false;
        this.loadingMessage = '';
        console.error('Error creating case:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to create investigation case';
        this.toastService.error(errorMsg, 6000);
      }
    });
  }

  generateSAR(transaction: TransactionDto): void {
    // Navigate to SAR report page
    this.router.navigate(['/compliance/sar-report', transaction.id]);
  }

  private getAlertIdFromTransaction(transaction: TransactionDto): number | null {
    // Try to get alert ID from transaction
    // The alertId might be stored as a string in the transaction
    if ((transaction as any).alertId) {
      const alertId = parseInt((transaction as any).alertId);
      if (!isNaN(alertId)) {
        return alertId;
      }
    }
    
    // If transaction has alerts array, get the first one
    if ((transaction as any).alerts && (transaction as any).alerts.length > 0) {
      return (transaction as any).alerts[0].id;
    }
    
    // For flagged/blocked transactions, we need to fetch alerts
    // This is a fallback - ideally the transaction should have alertId
    console.warn('Alert ID not found in transaction. You may need to fetch alerts separately.');
    return null;
  }

  approveTransaction(transaction: TransactionDto): void {
    // Check if officer wants to create investigation case first
    const hasCase = this.transactionsWithCases.has(transaction.id);
    let confirmMessage = `Approve Transaction #${transaction.id}?\n\n`;
    
    if (!hasCase) {
      confirmMessage += `Note: No investigation case exists yet.\n\n`;
    }
    
    confirmMessage += `This will:\n✓ Approve the transaction\n✓ Execute the money movement\n✓ Automatically resolve any associated case\n✓ Close the alert`;
    
    if (confirm(confirmMessage)) {
      this.loading = true;
      this.loadingMessage = 'Approving transaction...';
      this.complianceService.approveTransaction(transaction.id).subscribe({
        next: (updatedTransaction) => {
          this.loading = false;
          this.loadingMessage = '';
          // Remove from active cases tracking
          this.transactionsWithCases.delete(transaction.id);
          
          this.toastService.success(`Transaction #${updatedTransaction.id} approved successfully! Status: ${updatedTransaction.status}. Money movement executed.`, 6000);
          this.loadTransactions();
        },
        error: (error) => {
          this.loading = false;
          this.loadingMessage = '';
          console.error('Error approving transaction:', error);
          const errorMsg = error.error?.message || 'Failed to approve transaction';
          this.toastService.error(errorMsg, 6000);
        }
      });
    }
  }

  rejectTransaction(transaction: TransactionDto): void {
    const reason = prompt('Please provide a detailed reason for rejecting this transaction:');
    if (!reason || reason.trim().length === 0) {
      this.toastService.warning('Rejection reason is required.');
      return;
    }
    
    const hasCase = this.transactionsWithCases.has(transaction.id);
    let confirmMessage = `Reject Transaction #${transaction.id}?\n\n📝 Reason: ${reason}\n\n`;
    
    if (!hasCase) {
      confirmMessage += `Note: No investigation case exists yet.\n\n`;
    }
    
    confirmMessage += `This will:\n✓ Reject the transaction\n✓ Automatically resolve any associated case\n✓ Close the alert with rejection reason`;
    
    if (confirm(confirmMessage)) {
      this.loading = true;
      this.loadingMessage = 'Rejecting transaction...';
      this.complianceService.rejectTransaction(transaction.id, reason).subscribe({
        next: (updatedTransaction) => {
          this.loading = false;
          this.loadingMessage = '';
          // Remove from active cases tracking
          this.transactionsWithCases.delete(transaction.id);
          
          this.toastService.success(`Transaction #${updatedTransaction.id} rejected. Status: ${updatedTransaction.status}. Reason: ${reason}`, 6000);
          this.loadTransactions();
        },
        error: (error) => {
          this.loading = false;
          this.loadingMessage = '';
          console.error('Error rejecting transaction:', error);
          const errorMsg = error.error?.message || 'Failed to reject transaction';
          this.toastService.error(errorMsg, 6000);
        }
      });
    }
  }


  confirmReject(): void {
    if (this.transactionToReject && this.rejectionReason.trim()) {
      this.complianceService.rejectTransaction(
        this.transactionToReject.id, 
        this.rejectionReason
      ).subscribe({
        next: (updatedTransaction) => {
          this.toastService.success(`Transaction ${updatedTransaction.id} has been rejected.`, 5000);
          this.loadTransactions();
          this.transactionToReject = null;
          this.rejectionReason = '';
          // Close modal logic would go here
        },
        error: (error) => {
          console.error('Error rejecting transaction:', error);
          this.toastService.error('Failed to reject transaction. Please try again.');
        }
      });
    }
  }
}
