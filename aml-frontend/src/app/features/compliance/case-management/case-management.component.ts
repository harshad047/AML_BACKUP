import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../../core/services/compliance.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { CaseDto, NoteDto, AddNoteRequest } from '../../../shared/models/compliance.models';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './case-management.component.html',
  styleUrls: ['./case-management.component.css']
})
export class CaseManagementComponent implements OnInit {
  activeTab = 'active';
  viewMode: 'grid' | 'table' = 'grid'; // New: view mode toggle
  
  activeCases: CaseDto[] = [];
  resolvedCases: CaseDto[] = [];
  filteredCases: CaseDto[] = [];
  paginatedCases: CaseDto[] = []; // For table view pagination
  
  selectedCase: CaseDto | null = null;
  
  loading = false;
  error: string | null = null;
  
  // Filters
  searchTerm = '';
  dateFilter = '';
  
  // Pagination for table view
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];
  
  // Add Note
  showAddNoteForm = false;
  newNoteContent = '';

  // Transaction History
  showTransactionHistory = false;
  transactionHistory: any[] = [];
  loadingHistory = false;

  // Modals for case actions
  showApproveModal = false;
  showRejectModal = false;
  caseToApprove: CaseDto | null = null;
  caseToReject: CaseDto | null = null;
  rejectionReason = '';

  constructor(
    private complianceService: ComplianceService,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.loading = true;
    this.error = null;

    // Get current user's email
    const currentUser = this.authService.getCurrentUser();
    const currentUserEmail = currentUser?.email;

    if (!currentUserEmail) {
      this.error = 'Unable to identify current user';
      this.loading = false;
      return;
    }

    Promise.all([
      this.complianceService.getCasesUnderInvestigation().toPromise(),
      this.complianceService.getResolvedCases().toPromise()
    ]).then(([active, resolved]) => {
      // Filter cases to show only those assigned to current user
      this.activeCases = (active || []).filter(c => c.assignedTo === currentUserEmail);
      this.resolvedCases = (resolved || []).filter(c => c.assignedTo === currentUserEmail);
      
      this.applyFilters();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading cases:', error);
      this.error = 'Failed to load cases';
      this.loading = false;
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let cases: CaseDto[] = [];
    
    switch (this.activeTab) {
      case 'active':
        cases = this.activeCases;
        break;
      case 'resolved':
        cases = this.resolvedCases;
        break;
    }

    this.filteredCases = cases.filter(caseItem => {
      // Search term filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = 
          caseItem.id.toString().includes(searchLower) ||
          caseItem.assignedTo.toLowerCase().includes(searchLower) ||
          caseItem.alert.reason.toLowerCase().includes(searchLower) ||
          caseItem.alert.id.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Date filter
      if (this.dateFilter) {
        const caseDate = new Date(caseItem.createdAt).toDateString();
        const filterDate = new Date(this.dateFilter).toDateString();
        if (caseDate !== filterDate) return false;
      }

      return true;
    });
    
    // Sort by latest first (newest to oldest)
    this.filteredCases.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Update pagination if in table view
    if (this.viewMode === 'table') {
      this.currentPage = 1;
      this.updatePagination();
    }
  }

  // Toggle view mode between grid and table
  toggleViewMode(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
    if (mode === 'table') {
      this.updatePagination();
    }
  }

  // Pagination methods for table view
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCases.length / this.itemsPerPage);
    this.updatePageNumbers();
    this.paginateCases();
  }

  updatePageNumbers(): void {
    this.pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  paginateCases(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCases = this.filteredCases.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePageNumbers();
      this.paginateCases();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  changeItemsPerPage(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getStartItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredCases.length);
  }

  getCaseCardClass(status: string): string {
    switch (status) {
      case 'UNDER_INVESTIGATION': return 'case-card-active';
      case 'RESOLVED': return 'case-card-resolved';
      case 'CLOSED': return 'case-card-closed';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'UNDER_INVESTIGATION': return 'bg-warning';
      case 'RESOLVED': return 'bg-success';
      case 'CLOSED': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getRiskScoreClass(riskScore: number): string {
    if (riskScore >= 80) return 'bg-danger';
    if (riskScore >= 60) return 'bg-warning';
    if (riskScore >= 40) return 'bg-info';
    return 'bg-success';
  }

  getAlertStatusClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-warning';
      case 'ESCALATED': return 'bg-info';
      case 'RESOLVED': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getTransactionStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'COMPLETED': return 'bg-success';
      case 'FLAGGED': return 'bg-warning';
      case 'BLOCKED': return 'bg-danger';
      case 'APPROVED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  viewCaseDetails(caseItem: CaseDto): void {
    // Load full case details
    this.complianceService.getCaseById(caseItem.id).subscribe({
      next: (fullCase) => {
        this.selectedCase = fullCase;
        this.showAddNoteForm = false;
        this.newNoteContent = '';
        // Show Bootstrap modal
        const modalElement = document.getElementById('caseDetailsModal');
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();
        } else {
          console.error('Modal element not found');
        }
      },
      error: (error) => {
        console.error('Error loading case details:', error);
        this.error = 'Failed to load case details';
      }
    });
  }

  addNote(caseItem: CaseDto): void {
    this.viewCaseDetails(caseItem);
    // The form will be shown in the modal
  }

  viewTransactionHistory(transaction: any): void {
    // Toggle the transaction history section
    this.showTransactionHistory = !this.showTransactionHistory;
    
    // If opening, fetch transaction history
    if (this.showTransactionHistory) {
      this.loadingHistory = true;
      this.transactionHistory = [];
      
      // Determine which accounts to search for
      const accountsToSearch: string[] = [];
      if (transaction.fromAccountNumber) {
        accountsToSearch.push(transaction.fromAccountNumber);
      }
      if (transaction.toAccountNumber) {
        accountsToSearch.push(transaction.toAccountNumber);
      }
      
      if (accountsToSearch.length === 0) {
        this.loadingHistory = false;
        return;
      }
      
      // Fetch all transactions and filter by account numbers
      this.complianceService.getAllTransactions().subscribe({
        next: (allTransactions) => {
          // If both accounts exist, get 5 transactions per account
          if (transaction.fromAccountNumber && transaction.toAccountNumber) {
            const fromAccountTxns = allTransactions
              .filter(t => 
                t.id !== transaction.id && 
                ((t.toAccountNumber && t.toAccountNumber === transaction.fromAccountNumber) || 
                 (t.fromAccountNumber && t.fromAccountNumber === transaction.fromAccountNumber))
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            
            const toAccountTxns = allTransactions
              .filter(t => 
                t.id !== transaction.id && 
                ((t.toAccountNumber && t.toAccountNumber === transaction.toAccountNumber) || 
                 (t.fromAccountNumber && t.fromAccountNumber === transaction.toAccountNumber))
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            
            // Combine and remove duplicates, then sort by date
            const combinedTxns = [...fromAccountTxns, ...toAccountTxns];
            const uniqueTxns = Array.from(new Map(combinedTxns.map(t => [t.id, t])).values());
            this.transactionHistory = uniqueTxns
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else {
            // Single account - get 5 transactions
            this.transactionHistory = allTransactions
              .filter(t => 
                t.id !== transaction.id && 
                ((t.toAccountNumber && accountsToSearch.includes(t.toAccountNumber)) || 
                 (t.fromAccountNumber && accountsToSearch.includes(t.fromAccountNumber)))
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
          }
          this.loadingHistory = false;
        },
        error: (error) => {
          console.error('Error loading transaction history:', error);
          this.transactionHistory = [];
          this.loadingHistory = false;
        }
      });
    }
  }

  saveNote(): void {
    if (!this.selectedCase || !this.newNoteContent.trim()) return;

    const request: AddNoteRequest = {
      content: this.newNoteContent.trim()
    };

    this.complianceService.addNoteToCase(this.selectedCase.id, request).subscribe({
      next: (updatedCase) => {
        this.selectedCase = updatedCase;
        this.newNoteContent = '';
        this.showAddNoteForm = false;
        // Refresh the cases list
        this.loadCases();
      },
      error: (error) => {
        console.error('Error adding note:', error);
        this.error = 'Failed to add note to case';
      }
    });
  }

  cancelAddNote(): void {
    this.showAddNoteForm = false;
    this.newNoteContent = '';
  }

  trackByNoteId(index: number, note: NoteDto): number {
    return note.id;
  }

  generateSAR(caseItem: CaseDto): void {
    // Navigate to SAR report page with the transaction ID
    if (caseItem.alert && caseItem.alert.transaction) {
      this.router.navigate(['/compliance/sar-report', caseItem.alert.transaction.id]);
    } else {
      this.toastService.error('Transaction information not available for this case.');
    }
  }

  approveCaseFromCard(caseItem: CaseDto): void {
    this.caseToApprove = caseItem;
    this.showApproveModal = true;
  }

  confirmApproveCase(): void {
    if (!this.caseToApprove) return;
    this.showApproveModal = false;
    this.loading = true;
    const caseItem = this.caseToApprove;
    
    if (caseItem.alert && caseItem.alert.transaction) {
      // Approve the transaction
      this.complianceService.approveTransaction(caseItem.alert.transaction.id).subscribe({
        next: (approvedTransaction) => {
          // Add a note about the approval
          const approvalNote = {
            content: `Case approved. Transaction ${approvedTransaction.id} has been approved and processed. Case resolved.`
          };
          
          this.complianceService.addNoteToCase(caseItem.id, approvalNote).subscribe({
            next: () => {
              this.loading = false;
              this.toastService.success('Case approved successfully! Transaction has been approved and case is resolved.', 6000);
              
              // Refresh cases
              this.loadCases();
            },
            error: (error) => {
              this.loading = false;
              console.error('Error adding approval note:', error);
              this.toastService.warning('Transaction approved but failed to add note. Please refresh the page.', 6000);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error approving transaction:', error);
          this.toastService.error('Failed to approve transaction. Please try again.');
        }
      });
    }
  }

  rejectCaseFromCard(caseItem: CaseDto): void {
    this.caseToReject = caseItem;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  confirmRejectCase(): void {
    if (!this.caseToReject || !this.rejectionReason.trim()) {
      this.toastService.warning('Rejection reason is required.');
      return;
    }
    this.showRejectModal = false;
    this.loading = true;
    const caseItem = this.caseToReject;
    const reason = this.rejectionReason;
    
    if (caseItem.alert && caseItem.alert.transaction) {
      // Reject the transaction
      this.complianceService.rejectTransaction(caseItem.alert.transaction.id, reason).subscribe({
        next: (rejectedTransaction) => {
          // Add a note about the rejection
          const rejectionNote = {
            content: `Case rejected. Transaction ${rejectedTransaction.id} has been rejected. Reason: ${reason}. Case resolved.`
          };
          
          this.complianceService.addNoteToCase(caseItem.id, rejectionNote).subscribe({
            next: () => {
              this.loading = false;
              this.toastService.success('Case rejected successfully! Transaction has been rejected and case is resolved.', 6000);
              
              // Refresh cases
              this.loadCases();
            },
            error: (error) => {
              this.loading = false;
              console.error('Error adding rejection note:', error);
              this.toastService.warning('Transaction rejected but failed to add note. Please refresh the page.', 6000);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error rejecting transaction:', error);
          this.toastService.error('Failed to reject transaction. Please try again.');
        }
      });
    }
  }

  approveCase(caseId: number): void {
    this.caseToApprove = this.selectedCase;
    this.showApproveModal = true;
  }

  confirmApproveCaseDetail(): void {
    if (!this.caseToApprove) return;
    this.showApproveModal = false;
    this.loading = true;
    const selectedCase = this.caseToApprove;
    const caseId = this.caseToApprove.id;
    
    if (selectedCase && selectedCase.alert.transaction) {
      // First approve the transaction
      this.complianceService.approveTransaction(selectedCase.alert.transaction.id).subscribe({
        next: (approvedTransaction) => {
          // Add a note about the approval
          const approvalNote = {
            content: `Case approved. Transaction ${approvedTransaction.id} has been approved and processed. Case resolved.`
          };
          
          this.complianceService.addNoteToCase(caseId, approvalNote).subscribe({
            next: () => {
              this.loading = false;
              this.toastService.success('Case approved successfully! Transaction has been approved and case is resolved.', 6000);
              
              // Update local state
              if (selectedCase) {
                selectedCase.status = 'RESOLVED';
                selectedCase.alert.status = 'RESOLVED';
              }
              
              // Refresh cases
              this.loadCases();
              this.selectedCase = null;
            },
            error: (error) => {
              this.loading = false;
              console.error('Error adding approval note:', error);
              this.toastService.warning('Transaction approved but failed to add note. Please refresh the page.', 6000);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error approving transaction:', error);
          this.toastService.error('Failed to approve transaction. Please try again.');
        }
      });
    }
  }

  rejectCase(caseId: number): void {
    this.caseToReject = this.selectedCase;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  confirmRejectCaseDetail(): void {
    if (!this.caseToReject || !this.rejectionReason.trim()) {
      this.toastService.warning('Rejection reason is required.');
      return;
    }
    this.showRejectModal = false;
    this.loading = true;
    const selectedCase = this.caseToReject;
    const caseId = this.caseToReject.id;
    const reason = this.rejectionReason;
    
    if (selectedCase && selectedCase.alert.transaction) {
      // First reject the transaction
      this.complianceService.rejectTransaction(selectedCase.alert.transaction.id, reason).subscribe({
        next: (rejectedTransaction) => {
          // Add a note about the rejection
          const rejectionNote = {
            content: `Case rejected. Transaction ${rejectedTransaction.id} has been rejected. Reason: ${reason}. Case resolved.`
          };
          
          this.complianceService.addNoteToCase(caseId, rejectionNote).subscribe({
            next: () => {
              this.loading = false;
              this.toastService.success('Case rejected successfully! Transaction has been rejected and case is resolved.', 6000);
              
              // Update local state
              if (selectedCase) {
                selectedCase.status = 'RESOLVED';
                selectedCase.alert.status = 'RESOLVED';
              }
              
              // Refresh cases
              this.loadCases();
              this.selectedCase = null;
            },
            error: (error) => {
              this.loading = false;
              console.error('Error adding rejection note:', error);
              this.toastService.warning('Transaction rejected but failed to add note. Please refresh the page.', 6000);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error rejecting transaction:', error);
          this.toastService.error('Failed to reject transaction. Please try again.');
        }
      });
    }
  }
}
