import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../core/services/compliance.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
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
        <div class="col-md-6">
          <input type="text" class="form-control" placeholder="Search cases..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        <div class="col-md-4">
          <input type="date" class="form-control" placeholder="Filter by date" 
                 [(ngModel)]="dateFilter" (change)="applyFilters()">
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
            <div class="card-footer case-actions">
              <div class="row g-2">
                <div class="col-12 col-sm-6">
                  <button class="btn btn-action btn-outline-primary w-100" (click)="viewCaseDetails(case)">
                    <i class="fas fa-eye me-2"></i>
                    View Details
                  </button>
                </div>
                <div class="col-12 col-sm-6" *ngIf="case.status === 'UNDER_INVESTIGATION'">
                  <button class="btn btn-action btn-purple w-100" (click)="generateSAR(case)" title="Generate Suspicious Activity Report">
                    <i class="fas fa-file-alt me-2"></i>
                    Generate SAR
                  </button>
                </div>
                <div class="col-12" *ngIf="case.status === 'UNDER_INVESTIGATION'">
                  <div class="d-flex gap-2">
                    <button class="btn btn-action btn-approve flex-fill" (click)="approveCaseFromCard(case)">
                      <i class="fas fa-check me-2"></i>
                      Approve
                    </button>
                    <button class="btn btn-action btn-reject flex-fill" (click)="rejectCaseFromCard(case)">
                      <i class="fas fa-times me-2"></i>
                      Reject
                    </button>
                  </div>
                </div>
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
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">Transaction Details</h6>
                  <button class="btn btn-sm" 
                          [ngClass]="showTransactionHistory ? 'btn-info' : 'btn-outline-info'"
                          (click)="viewTransactionHistory(selectedCase.alert.transaction)"
                          title="Toggle transaction history">
                    <i class="fas" [ngClass]="showTransactionHistory ? 'fa-chevron-up' : 'fa-history'" class="me-1"></i>
                    {{ showTransactionHistory ? 'Hide' : 'View' }} Transaction History
                  </button>
                </div>
                <div class="card">
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <table class="table table-sm table-borderless">
                          <tr>
                            <td class="text-muted" style="width: 40%;"><strong>Transaction ID:</strong></td>
                            <td><strong>#{{ selectedCase.alert.transaction.id }}</strong></td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Reference:</strong></td>
                            <td>{{ selectedCase.alert.transaction.transactionReference }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Type:</strong></td>
                            <td><span class="badge bg-secondary">{{ selectedCase.alert.transaction.transactionType }}</span></td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Amount:</strong></td>
                            <td><strong class="text-primary">{{ selectedCase.alert.transaction.amount | currency:selectedCase.alert.transaction.currency }}</strong></td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Currency:</strong></td>
                            <td>{{ selectedCase.alert.transaction.currency }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Status:</strong></td>
                            <td><span class="badge" [ngClass]="getTransactionStatusClass(selectedCase.alert.transaction.status)">{{ selectedCase.alert.transaction.status }}</span></td>
                          </tr>
                        </table>
                      </div>
                      <div class="col-md-6">
                        <table class="table table-sm table-borderless">
                          <tr>
                            <td class="text-muted" style="width: 40%;"><strong>From Account:</strong></td>
                            <td>{{ selectedCase.alert.transaction.fromAccountNumber || 'N/A' }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>To Account:</strong></td>
                            <td>{{ selectedCase.alert.transaction.toAccountNumber || 'N/A' }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Description:</strong></td>
                            <td>{{ selectedCase.alert.transaction.description || 'N/A' }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Created:</strong></td>
                            <td>{{ selectedCase.alert.transaction.createdAt | date:'medium' }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Combined Risk:</strong></td>
                            <td>
                              <span class="badge" [ngClass]="getRiskScoreClass(selectedCase.alert.transaction.combinedRiskScore || 0)">
                                {{ selectedCase.alert.transaction.combinedRiskScore || 0 }}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>NLP Score:</strong></td>
                            <td>{{ selectedCase.alert.transaction.nlpScore || 0 }}</td>
                          </tr>
                          <tr>
                            <td class="text-muted"><strong>Rule Score:</strong></td>
                            <td>{{ selectedCase.alert.transaction.ruleEngineScore || 0 }}</td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Transaction History Section -->
              <div class="mt-3" *ngIf="showTransactionHistory && selectedCase.alert.transaction">
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                      <i class="fas fa-history me-2"></i>
                      Recent Transaction History (Last 5 Transactions)
                      <span *ngIf="selectedCase.alert.transaction.fromAccountNumber && selectedCase.alert.transaction.toAccountNumber">
                        - Accounts: {{ selectedCase.alert.transaction.fromAccountNumber }} & {{ selectedCase.alert.transaction.toAccountNumber }}
                      </span>
                      <span *ngIf="selectedCase.alert.transaction.toAccountNumber && !selectedCase.alert.transaction.fromAccountNumber">
                        - Account: {{ selectedCase.alert.transaction.toAccountNumber }}
                      </span>
                      <span *ngIf="selectedCase.alert.transaction.fromAccountNumber && !selectedCase.alert.transaction.toAccountNumber">
                        - Account: {{ selectedCase.alert.transaction.fromAccountNumber }}
                      </span>
                    </h6>
                  </div>
                  <div class="card-body">
                    <div *ngIf="loadingHistory" class="text-center py-3">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="mt-2 text-muted">Loading transaction history...</p>
                    </div>
                    
                    <div *ngIf="!loadingHistory && transactionHistory.length === 0" class="text-center py-3 text-muted">
                      <i class="fas fa-info-circle fa-2x mb-2"></i>
                      <p>No previous transactions found for this account.</p>
                    </div>

                    <div *ngIf="!loadingHistory && transactionHistory.length > 0" class="table-responsive">
                      <table class="table table-sm table-hover">
                        <thead class="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>From/To</th>
                            <th>Status</th>
                            <th>Risk Score</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let txn of transactionHistory">
                            <td><strong>#{{ txn.id }}</strong></td>
                            <td class="small">{{ txn.createdAt | date:'short' }}</td>
                            <td><span class="badge bg-secondary">{{ txn.transactionType }}</span></td>
                            <td><strong>{{ txn.amount | currency:txn.currency }}</strong></td>
                            <td class="small">
                              <div *ngIf="txn.fromAccountNumber">From: {{ txn.fromAccountNumber }}</div>
                              <div *ngIf="txn.toAccountNumber">To: {{ txn.toAccountNumber }}</div>
                            </td>
                            <td>
                              <span class="badge" [ngClass]="getTransactionStatusClass(txn.status)">
                                {{ txn.status }}
                              </span>
                            </td>
                            <td>
                              <span class="badge" [ngClass]="getRiskScoreClass(txn.combinedRiskScore || 0)">
                                {{ txn.combinedRiskScore || 0 }}
                              </span>
                            </td>
                            <td class="small">{{ txn.description || 'N/A' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Triggered Rules -->
              <div class="mt-4" *ngIf="selectedCase.alert.transaction && selectedCase.alert.transaction.obstructedRules && selectedCase.alert.transaction.obstructedRules.length > 0">
                <h6>Triggered Rules ({{ selectedCase.alert.transaction.obstructedRules.length }})</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>Rule Name</th>
                        <th>Action</th>
                        <th>Risk Weight</th>
                        <th>Priority</th>
                        <th>Details</th>
                        <th>Evaluated At</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let rule of selectedCase.alert.transaction.obstructedRules">
                        <td><strong>{{ rule.ruleName }}</strong></td>
                        <td>
                          <span class="badge" [ngClass]="rule.action === 'BLOCK' ? 'bg-danger' : 'bg-warning'">
                            {{ rule.action }}
                          </span>
                        </td>
                        <td><span class="badge bg-info">{{ rule.riskWeight }}</span></td>
                        <td>{{ rule.priority }}</td>
                        <td class="small">{{ rule.details }}</td>
                        <td class="small">{{ rule.evaluatedAt | date:'short' }}</td>
                      </tr>
                    </tbody>
                  </table>
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

    <!-- Approve Case Modal -->
    <div class="modal fade" [class.show]="showApproveModal" [style.display]="showApproveModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="fas fa-check-circle me-2"></i>
              Approve Case
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showApproveModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Are you sure you want to approve this case?</p>
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>
              <strong>This action will:</strong>
              <ul class="mb-0 mt-2">
                <li>Approve the associated transaction</li>
                <li>Execute the money movement</li>
                <li>Resolve the case</li>
                <li>Close the alert</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showApproveModal = false">
              <i class="fas fa-times me-2"></i>Cancel
            </button>
            <button type="button" class="btn btn-success" (click)="selectedCase ? confirmApproveCaseDetail() : confirmApproveCase()">
              <i class="fas fa-check me-2"></i>Approve Case
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="showApproveModal" *ngIf="showApproveModal"></div>

    <!-- Reject Case Modal -->
    <div class="modal fade" [class.show]="showRejectModal" [style.display]="showRejectModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="fas fa-times-circle me-2"></i>
              Reject Case
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showRejectModal = false; rejectionReason = ''"></button>
          </div>
          <div class="modal-body">
            <p class="mb-3">Please provide a detailed reason for rejecting this case:</p>
            <div class="form-group">
              <label for="rejectionReason" class="form-label">Rejection Reason <span class="text-danger">*</span></label>
              <textarea 
                id="rejectionReason"
                class="form-control" 
                [(ngModel)]="rejectionReason" 
                rows="4" 
                placeholder="Enter detailed reason for rejection..."
                required></textarea>
            </div>
            <div class="alert alert-warning mt-3">
              <i class="fas fa-exclamation-triangle me-2"></i>
              <strong>This action will:</strong>
              <ul class="mb-0 mt-2">
                <li>Reject the associated transaction</li>
                <li>Resolve the case</li>
                <li>Close the alert with rejection reason</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showRejectModal = false; rejectionReason = ''">
              <i class="fas fa-times me-2"></i>Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              (click)="selectedCase ? confirmRejectCaseDetail() : confirmRejectCase()"
              [disabled]="!rejectionReason.trim()">
              <i class="fas fa-ban me-2"></i>Reject Case
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="showRejectModal" *ngIf="showRejectModal"></div>
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
      color: var(--text-secondary);
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }
    .nav-tabs .nav-link:hover {
      background-color: rgba(46,163,242,0.08);
      color: var(--primary-bank-blue);
    }
    .nav-tabs .nav-link.active {
      background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark));
      color: #fff;
      border: none;
      box-shadow: 0 6px 18px rgba(46,163,242,0.25);
    }
    
    /* Generate SAR Button (Purple) */
    .btn-purple {
      background: linear-gradient(135deg, #6f42c1, #5a32a3);
      border-color: #5a32a3;
      color: #fff;
      transition: all 0.3s ease;
    }

    .btn-purple:hover {
      background: linear-gradient(135deg, #5a32a3, #4d2791);
      border-color: #4d2791;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(111, 66, 193, 0.4);
    }

    .btn-purple:active {
      background-color: #59339d;
      border-color: #4e2d8f;
    }

    /* Modal Styles */
    .modal.show {
      display: block !important;
    }

    .modal-backdrop.show {
      opacity: 0.5;
    }

    .modal {
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      animation: modalSlideIn 0.3s ease-out;
      border-radius: 0.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
    }

    .modal-footer {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }

    .form-control:focus {
      border-color: var(--primary-bank-blue);
      box-shadow: 0 0 0 0.2rem rgba(46, 163, 242, 0.25);
    }

    /* Card polish */
    .card.h-100 {
      border: none;
      border-radius: 0.75rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .card.h-100 .card-header {
      background: linear-gradient(135deg, var(--primary-bank-blue-dark), var(--primary-bank-blue));
      color: #fff;
      border-radius: 0.75rem 0.75rem 0 0 !important;
      border-bottom: none;
    }
    .card.h-100 .card-body {
      background: #fff;
    }
    .card.h-100 .card-footer {
      background: #fff;
      border-top: 1px solid #e9ecef;
      border-radius: 0 0 0.75rem 0.75rem !important;
    }

    /* Case actions */
    .case-actions { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .btn-action {
      border-radius: 0.5rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.55rem 0.75rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
    .btn-approve { background: linear-gradient(135deg, #28a745, #20c997); color: #fff; border: none; }
    .btn-approve:hover { filter: brightness(1.03); }
    .btn-reject { background: linear-gradient(135deg, #dc3545, #c82333); color: #fff; border: none; }
    .btn-reject:hover { filter: brightness(1.03); }

    /* Outline primary within cards */
    .btn-outline-primary {
      border-color: var(--primary-bank-blue);
      color: var(--primary-bank-blue);
    }
    .btn-outline-primary:hover {
      background: var(--primary-bank-blue);
      color: #fff;
    }

    /* Themed badges inside component */
    .badge.bg-warning { background: linear-gradient(135deg, #ffc107, #ff9800) !important; color:#000; font-weight:700; }
    .badge.bg-info { background: linear-gradient(135deg, #17a2b8, #138496) !important; color:#fff; font-weight:700; }
    .badge.bg-success { background: linear-gradient(135deg, #28a745, #20c997) !important; color:#fff; font-weight:700; }
    .badge.bg-danger { background: linear-gradient(135deg, #dc3545, #c82333) !important; color:#fff; font-weight:700; }

    /* Case card accent by status */
    .case-card-active { border-left: 4px solid #ffc107; }
    .case-card-resolved { border-left: 4px solid #28a745; }
    .case-card-closed { border-left: 4px solid #6c757d; }

    .alert ul {
      padding-left: 1.5rem;
    }

    .alert ul li {
      margin-bottom: 0.25rem;
    }
    :host {
      display: block;
      background: #f6f8fb;
      padding: 0.75rem 0 2rem;
    }

    .container-fluid {
      max-width: 1280px;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: .2px;
    }

    .d-flex.justify-content-between.align-items-center.mb-4 {
      background: #ffffff;
      border: 1px solid #e9eef5;
      border-radius: 14px;
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 12px rgba(17, 24, 39, 0.04);
    }

    .nav.nav-tabs { border-bottom: 0; gap: .5rem; }
    .nav-tabs .nav-link {
      background: #eef2f7;
      color: #334155;
      border-radius: 999px;
      padding: .5rem 1rem;
      font-weight: 600;
    }
    .nav-tabs .nav-link.active {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
    }

    .form-control {
      border-radius: 10px;
      border: 1px solid #dbe3ee;
      background-color: #fff;
    }
    .form-control::placeholder { color: #94a3b8; }

    .card {
      border: 1px solid #eaeef4;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(19, 33, 68, 0.04);
      overflow: hidden;
    }
    .card .card-header {
      border-bottom: 1px solid #eef2f7;
    }
    .card .card-body { color: #0f172a; }
    .card .card-footer { background: #fbfdff; }

    .badge {
      border-radius: 999px;
      font-weight: 700;
      padding: .35rem .6rem;
      letter-spacing: .2px;
    }
    .badge.bg-secondary { background: #cbd5e1 !important; color: #0f172a !important; }

    .table { margin-bottom: .5rem; }
    .table thead th {
      color: #475569;
      font-weight: 700;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }
    .table tbody td { vertical-align: middle; }
    .table-hover tbody tr:hover { background: #f8fafc; }
    .table.table-borderless td { padding: .4rem .5rem; }

    .text-center.py-5 i { color: #94a3b8; }
    .text-center.py-5 h5 { color: #475569; font-weight: 700; }
    .text-center.py-5 p { color: #64748b; }

    .btn { border-radius: 10px; }
    .btn.btn-secondary { background: #f1f5f9; border-color: #e2e8f0; color: #0f172a; }
    .btn.btn-secondary:hover { background: #e2e8f0; }

    .modal-content { border: 1px solid #e9eef5; }
    .modal-header { background: #0ea5e9; color: #fff; }
    .modal-header.bg-success { background: #16a34a !important; }
    .modal-header.bg-danger { background: #dc2626 !important; }
    .modal-footer { background: #f8fafc; }

    .card.border-info { border-color: #38bdf8 !important; }
    .card-header.bg-info { background: #0ea5e9 !important; }

    .case-actions .btn-action { padding: .55rem .65rem; border-radius: 10px; }
    .btn-action.btn-outline-primary { border-width: 2px; }
    .btn-approve, .btn-reject { box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
    
    .small { color: #475569; }
    .text-muted { color: #6b7280 !important; }
    .text-primary { color: #1d4ed8 !important; }
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
  dateFilter = '';
  
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
