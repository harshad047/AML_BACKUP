import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../core/services/compliance.service';
import { CaseDto, NoteDto, AddNoteRequest } from '../../core/models/compliance.models';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Case Management</h1>
            <button class="btn btn-secondary" routerLink="/compliance">
              <i class="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="row mb-4">
        <div class="col-12">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab === 'active'" 
                      (click)="switchTab('active')">
                Active Cases ({{ activeCases.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab === 'resolved'" 
                      (click)="switchTab('resolved')">
                Resolved Cases ({{ resolvedCases.length }})
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="Search cases..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="assigneeFilter" (change)="applyFilters()">
            <option value="">All Assignees</option>
            <option *ngFor="let assignee of uniqueAssignees" [value]="assignee">
              {{ assignee }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <input type="date" class="form-control" [(ngModel)]="dateFilter" (change)="applyFilters()">
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary w-100" (click)="loadCases()">
            <i class="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="row" *ngIf="loading">
        <div class="col-12 text-center">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading cases...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="row" *ngIf="error && !loading">
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
        </div>
      </div>

      <!-- Cases Grid -->
      <div class="row" *ngIf="!loading">
        <div class="col-12" *ngIf="filteredCases.length === 0">
          <div class="text-center py-5">
            <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No cases found</h5>
            <p class="text-muted">No cases match your current filter criteria.</p>
          </div>
        </div>
        
        <div class="col-lg-6 col-xl-4 mb-4" *ngFor="let case of filteredCases">
          <div class="card h-100" [class]="getCaseCardClass(case.status)">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Case #{{ case.id }}</h6>
              <span class="badge" [ngClass]="getStatusClass(case.status)">
                {{ case.status }}
              </span>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Alert:</strong> #{{ case.alert.id }}
                <br>
                <small class="text-muted">{{ case.alert.reason }}</small>
              </div>
              
              <div class="mb-3">
                <strong>Risk Score:</strong>
                <span class="badge ms-2" [ngClass]="getRiskScoreClass(case.alert.riskScore)">
                  {{ case.alert.riskScore }}
                </span>
              </div>
              
              <div class="mb-3">
                <strong>Assigned to:</strong> {{ case.assignedTo }}
              </div>
              
              <div class="mb-3">
                <strong>Created:</strong>
                <br>
                <small>{{ case.createdAt | date:'medium' }}</small>
              </div>
              
              <div class="mb-3" *ngIf="case.notes && case.notes.length > 0">
                <strong>Latest Note:</strong>
                <br>
                <small class="text-muted">
                  {{ case.notes[case.notes.length - 1].content | slice:0:100 }}
                  <span *ngIf="case.notes[case.notes.length - 1].content.length > 100">...</span>
                </small>
              </div>
            </div>
            <div class="card-footer">
              <div class="d-flex flex-column gap-2">
                <div class="btn-group w-100">
                  <button class="btn btn-outline-primary btn-sm" 
                          (click)="viewCaseDetails(case)">
                    <i class="fas fa-eye me-1"></i>
                    View Details
                  </button>
                  <button class="btn btn-outline-success btn-sm" 
                          (click)="addNote(case)"
                          *ngIf="case.status === 'UNDER_INVESTIGATION'">
                    <i class="fas fa-plus me-1"></i>
                    Add Note
                  </button>
                </div>
                <button class="btn btn-purple btn-sm w-100" 
                        (click)="generateSAR(case)"
                        *ngIf="case.status === 'UNDER_INVESTIGATION'"
                        title="Generate Suspicious Activity Report">
                  <i class="fas fa-file-alt me-1"></i>
                  Generate SAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Case Details Modal -->
      <div class="modal fade" id="caseDetailsModal" tabindex="-1" *ngIf="selectedCase">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Case #{{ selectedCase.id }} Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <!-- Case Information -->
                <div class="col-md-6">
                  <h6>Case Information</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Case ID:</strong></td>
                      <td>{{ selectedCase.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="getStatusClass(selectedCase.status)">
                          {{ selectedCase.status }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Assigned To:</strong></td>
                      <td>{{ selectedCase.assignedTo }}</td>
                    </tr>
                    <tr>
                      <td><strong>Created:</strong></td>
                      <td>{{ selectedCase.createdAt | date:'medium' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Last Updated:</strong></td>
                      <td>{{ selectedCase.updatedAt | date:'medium' }}</td>
                    </tr>
                  </table>
                </div>

                <!-- Alert Information -->
                <div class="col-md-6">
                  <h6>Related Alert</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Alert ID:</strong></td>
                      <td>#{{ selectedCase.alert.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Transaction ID:</strong></td>
                      <td>#{{ selectedCase.alert.transactionId }}</td>
                    </tr>
                    <tr>
                      <td><strong>Reason:</strong></td>
                      <td>{{ selectedCase.alert.reason }}</td>
                    </tr>
                    <tr>
                      <td><strong>Risk Score:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="getRiskScoreClass(selectedCase.alert.riskScore)">
                          {{ selectedCase.alert.riskScore }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Alert Status:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="getAlertStatusClass(selectedCase.alert.status)">
                          {{ selectedCase.alert.status }}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Transaction Details -->
              <div class="mt-4" *ngIf="selectedCase.alert.transaction">
                <h6>Transaction Details</h6>
                <div class="row">
                  <div class="col-md-6">
                    <table class="table table-sm">
                      <tr>
                        <td><strong>Type:</strong></td>
                        <td>{{ selectedCase.alert.transaction.transactionType }}</td>
                      </tr>
                      <tr>
                        <td><strong>Amount:</strong></td>
                        <td>{{ selectedCase.alert.transaction.amount | currency:selectedCase.alert.transaction.currency }}</td>
                      </tr>
                      <tr>
                        <td><strong>From Account:</strong></td>
                        <td>{{ selectedCase.alert.transaction.fromAccountNumber || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td><strong>To Account:</strong></td>
                        <td>{{ selectedCase.alert.transaction.toAccountNumber || 'N/A' }}</td>
                      </tr>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <table class="table table-sm">
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>{{ selectedCase.alert.transaction.status }}</td>
                      </tr>
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{{ selectedCase.alert.transaction.description || 'N/A' }}</td>
                      </tr>
                      <tr>
                        <td><strong>Reference:</strong></td>
                        <td>{{ selectedCase.alert.transaction.transactionReference }}</td>
                      </tr>
                      <tr>
                        <td><strong>Created:</strong></td>
                        <td>{{ selectedCase.alert.transaction.createdAt | date:'short' }}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Investigation Notes -->
              <div class="mt-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6>Investigation Notes ({{ selectedCase.notes?.length || 0 }})</h6>
                  <button class="btn btn-sm btn-outline-primary" 
                          (click)="showAddNoteForm = !showAddNoteForm"
                          *ngIf="selectedCase.status === 'UNDER_INVESTIGATION'">
                    <i class="fas fa-plus me-1"></i>
                    Add Note
                  </button>
                </div>

                <!-- Add Note Form -->
                <div class="card mb-3" *ngIf="showAddNoteForm">
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="newNoteContent" class="form-label">Note Content</label>
                      <textarea class="form-control" id="newNoteContent" rows="3" 
                                [(ngModel)]="newNoteContent" 
                                placeholder="Enter your investigation note..."></textarea>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-primary btn-sm" 
                              (click)="saveNote()"
                              [disabled]="!newNoteContent.trim()">
                        Save Note
                      </button>
                      <button class="btn btn-secondary btn-sm" 
                              (click)="cancelAddNote()">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Case Actions -->
                <div class="mt-4" *ngIf="selectedCase.status === 'UNDER_INVESTIGATION'">
                  <div class="d-flex gap-2 mb-3">
                    <button class="btn btn-purple" (click)="generateSAR(selectedCase)" [disabled]="loading">
                      <i class="fas fa-file-alt me-1"></i>
                      Generate SAR Report
                    </button>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-success" (click)="approveCase(selectedCase.id)" [disabled]="loading">
                      <i class="fas fa-check me-1"></i>
                      Approve Transaction & Close Case
                    </button>
                    <button class="btn btn-danger" (click)="rejectCase(selectedCase.id)" [disabled]="loading">
                      <i class="fas fa-times me-1"></i>
                      Reject Transaction & Close Case
                    </button>
                  </div>
                  <small class="text-muted mt-2 d-block">
                    Approving will automatically approve the associated transaction and resolve both the case and alert.
                  </small>
                </div>

                <!-- Notes List -->
                <div *ngIf="selectedCase.notes && selectedCase.notes.length > 0">
                  <div class="card mb-2" *ngFor="let note of selectedCase.notes; trackBy: trackByNoteId">
                    <div class="card-body py-2">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <p class="mb-1">{{ note.content }}</p>
                        </div>
                      </div>
                      <small class="text-muted">
                        <i class="fas fa-user me-1"></i>
                        {{ note.author }} • {{ note.createdAt | date:'medium' }}
                      </small>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="!selectedCase.notes || selectedCase.notes.length === 0" 
                     class="text-center py-3 text-muted">
                  <i class="fas fa-sticky-note fa-2x mb-2"></i>
                  <p>No investigation notes yet</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .case-card-active {
      border-left: 4px solid #ffc107;
    }
    
    .case-card-resolved {
      border-left: 4px solid #198754;
    }
    
    .case-card-closed {
      border-left: 4px solid #6c757d;
    }
    
    .card {
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .nav-tabs .nav-link {
      border: none;
      color: #6c757d;
    }
    
    .nav-tabs .nav-link.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    /* Generate SAR Button (Purple) */
    .btn-purple {
      background-color: #6f42c1;
      border-color: #6f42c1;
      color: #fff;
      transition: all 0.3s ease;
    }

    .btn-purple:hover {
      background-color: #5a32a3;
      border-color: #59339d;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(111, 66, 193, 0.4);
    }

    .btn-purple:active {
      background-color: #59339d;
      border-color: #4e2d8f;
    }
  `]
})
export class CaseManagementComponent implements OnInit {
  activeTab = 'active';
  
  activeCases: CaseDto[] = [];
  resolvedCases: CaseDto[] = [];
  filteredCases: CaseDto[] = [];
  
  selectedCase: CaseDto | null = null;
  
  loading = false;
  error: string | null = null;
  
  // Filters
  searchTerm = '';
  assigneeFilter = '';
  dateFilter = '';
  uniqueAssignees: string[] = [];
  
  // Add Note
  showAddNoteForm = false;
  newNoteContent = '';

  constructor(
    private complianceService: ComplianceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.loading = true;
    this.error = null;

    Promise.all([
      this.complianceService.getCasesUnderInvestigation().toPromise(),
      this.complianceService.getResolvedCases().toPromise()
    ]).then(([active, resolved]) => {
      this.activeCases = active || [];
      this.resolvedCases = resolved || [];
      
      // Extract unique assignees for filter
      const allCases = [...this.activeCases, ...this.resolvedCases];
      this.uniqueAssignees = [...new Set(allCases.map(c => c.assignedTo))];
      
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

      // Assignee filter
      if (this.assigneeFilter && caseItem.assignedTo !== this.assigneeFilter) {
        return false;
      }

      // Date filter
      if (this.dateFilter) {
        const caseDate = new Date(caseItem.createdAt).toDateString();
        const filterDate = new Date(this.dateFilter).toDateString();
        if (caseDate !== filterDate) return false;
      }

      return true;
    });
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

  viewCaseDetails(caseItem: CaseDto): void {
    // Load full case details
    this.complianceService.getCaseById(caseItem.id).subscribe({
      next: (fullCase) => {
        this.selectedCase = fullCase;
        this.showAddNoteForm = false;
        this.newNoteContent = '';
        // Show modal logic would go here
        console.log('Show case details modal for:', fullCase);
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
      alert('Transaction information not available for this case.');
    }
  }

  approveCase(caseId: number): void {
    if (confirm('Are you sure you want to approve this case? This will approve the associated transaction and resolve the case and alert.')) {
      this.loading = true;
      const selectedCase = this.selectedCase;
      
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
                alert('Case approved successfully! Transaction has been approved and case is resolved.');
                
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
                alert('Transaction approved but failed to add note. Please refresh the page.');
              }
            });
          },
          error: (error) => {
            this.loading = false;
            console.error('Error approving transaction:', error);
            alert('Failed to approve transaction. Please try again.');
          }
        });
      }
    }
  }

  rejectCase(caseId: number): void {
    const reason = prompt('Please provide a reason for rejecting this case:');
    if (reason && confirm('Are you sure you want to reject this case? This will reject the associated transaction and resolve the case.')) {
      this.loading = true;
      const selectedCase = this.selectedCase;
      
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
                alert('Case rejected successfully! Transaction has been rejected and case is resolved.');
                
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
                alert('Transaction rejected but failed to add note. Please refresh the page.');
              }
            });
          },
          error: (error) => {
            this.loading = false;
            console.error('Error rejecting transaction:', error);
            alert('Failed to reject transaction. Please try again.');
          }
        });
      }
    }
  }
}
