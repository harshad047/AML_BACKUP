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
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Transaction Review</h1>
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
              <button class="nav-link" [class.active]="activeTab === 'review'" 
                      (click)="switchTab('review')">
                For Review ({{ reviewTransactions.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab === 'flagged'" 
                      (click)="switchTab('flagged')">
                Flagged ({{ flaggedTransactions.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab === 'blocked'" 
                      (click)="switchTab('blocked')">
                Blocked ({{ blockedTransactions.length }})
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab === 'all'" 
                      (click)="switchTab('all')">
                All Transactions
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4 filters-bar align-items-center g-2">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="typeFilter" (change)="applyFilters()">
            <option value="">All Types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER">Transfer</option>
            <option value="INTERCURRENCY_TRANSFER">Intercurrency Transfer</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="riskFilter" (change)="applyFilters()">
            <option value="">All Risk Levels</option>
            <option value="high">High Risk (80+)</option>
            <option value="medium">Medium Risk (60-79)</option>
            <option value="low">Low Risk (<60)</option>
          </select>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="Search transactions..." 
                 [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
        <div class="col-md-2">
          <button class="btn btn-primary w-100" (click)="loadTransactions()">
            <i class="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="loading-content">
          <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h5 class="mb-2">{{ loadingMessage || 'Loading transactions...' }}</h5>
          <p class="text-muted mb-0">Please wait</p>
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

      <!-- Transactions Table -->
      <div class="row" *ngIf="!loading">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">{{ getTabTitle() }} ({{ filteredTransactions.length }})</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover modern-table mb-0">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>From/To</th>
                      <th>Risk Score</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="filteredTransactions.length === 0">
                      <td colspan="7" class="text-center py-4 text-muted">
                        No transactions found matching your criteria
                      </td>
                    </tr>
                    <tr *ngFor="let transaction of filteredTransactions" 
                        [class]="getTransactionRowClass(transaction)">
                      <td>
                        <strong>#{{ transaction.id }}</strong>
                        <br>
                        <small class="text-muted">{{ transaction.transactionReference }}</small>
                      </td>
                      <td>
                        <span class="badge bg-secondary">{{ transaction.transactionType }}</span>
                      </td>
                      <td>
                        <strong>{{ transaction.amount | currency:transaction.currency }}</strong>
                      </td>
                      <td>
                        <div class="small">
                          <div *ngIf="transaction.fromAccountNumber">
                            <strong>From:</strong> {{ transaction.fromAccountNumber }}
                          </div>
                          <div *ngIf="transaction.toAccountNumber">
                            <strong>To:</strong> {{ transaction.toAccountNumber }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="risk-chip" [ngClass]="getRiskScoreClass(transaction.combinedRiskScore || 0)">
                          {{ transaction.combinedRiskScore || 0 }}
                        </span>
                      </td>
                      <td>
                        <span class="status-chip" [ngClass]="getStatusClass(transaction.status)">
                          {{ transaction.status }}
                        </span>
                      </td>
                      <td>
                        <small>{{ transaction.createdAt | date:'short' }}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Details Modal -->
      <div class="modal fade" id="transactionDetailsModal" tabindex="-1" *ngIf="selectedTransaction">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Transaction #{{ selectedTransaction.id }} Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Transaction Information</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{{ selectedTransaction.id }}</td>
                    </tr>
                    <tr>
                      <td><strong>Reference:</strong></td>
                      <td>{{ selectedTransaction.transactionReference }}</td>
                    </tr>
                    <tr>
                      <td><strong>Type:</strong></td>
                      <td>{{ selectedTransaction.transactionType }}</td>
                    </tr>
                    <tr>
                      <td><strong>Amount:</strong></td>
                      <td>{{ selectedTransaction.amount | currency:selectedTransaction.currency }}</td>
                    </tr>
                    <tr>
                      <td><strong>From Account:</strong></td>
                      <td>{{ selectedTransaction.fromAccountNumber || 'N/A' }}</td>
                    </tr>
                    <tr>
                      <td><strong>To Account:</strong></td>
                      <td>{{ selectedTransaction.toAccountNumber || 'N/A' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="getStatusClass(selectedTransaction.status)">
                          {{ selectedTransaction.status }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Description:</strong></td>
                      <td>{{ selectedTransaction.description || 'N/A' }}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Risk Assessment</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>NLP Score:</strong></td>
                      <td>{{ selectedTransaction.nlpScore || 'N/A' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Rule Engine Score:</strong></td>
                      <td>{{ selectedTransaction.ruleEngineScore || 'N/A' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Combined Risk Score:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="getRiskScoreClass(selectedTransaction.combinedRiskScore || 0)">
                          {{ selectedTransaction.combinedRiskScore || 0 }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Threshold Exceeded:</strong></td>
                      <td>
                        <span class="badge" [ngClass]="selectedTransaction.thresholdExceeded ? 'bg-danger' : 'bg-success'">
                          {{ selectedTransaction.thresholdExceeded ? 'Yes' : 'No' }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Created:</strong></td>
                      <td>{{ selectedTransaction.createdAt | date:'medium' }}</td>
                    </tr>
                    <tr>
                      <td><strong>Updated:</strong></td>
                      <td>{{ selectedTransaction.updatedAt | date:'medium' }}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <!-- Obstructed Rules -->
              <div class="mt-4" *ngIf="selectedTransaction.obstructedRules && selectedTransaction.obstructedRules.length > 0">
                <h6>Triggered Rules</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
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
                      <tr *ngFor="let rule of selectedTransaction.obstructedRules">
                        <td>{{ rule.ruleName }}</td>
                        <td>
                          <span class="badge" [ngClass]="rule.action === 'BLOCK' ? 'bg-danger' : 'bg-warning'">
                            {{ rule.action }}
                          </span>
                        </td>
                        <td>{{ rule.riskWeight }}</td>
                        <td>{{ rule.priority }}</td>
                        <td>{{ rule.details }}</td>
                        <td>{{ rule.evaluatedAt | date:'short' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-success" 
                      (click)="approveTransaction(selectedTransaction)"
                      [disabled]="!canApproveReject(selectedTransaction.status)"
                      *ngIf="activeTab === 'review' || activeTab === 'flagged'">
                Approve Transaction
              </button>
              <button type="button" class="btn btn-danger" 
                      (click)="rejectTransaction(selectedTransaction)"
                      [disabled]="!canApproveReject(selectedTransaction.status)"
                      *ngIf="activeTab === 'review' || activeTab === 'flagged'">
                Reject Transaction
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejection Reason Modal -->
      <div class="modal fade" id="rejectionReasonModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Rejection Reason</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="rejectionReason" class="form-label">Please provide a reason for rejection:</label>
                <textarea class="form-control" id="rejectionReason" rows="3" 
                          [(ngModel)]="rejectionReason" placeholder="Enter rejection reason..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" (click)="confirmReject()">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Filters bar */
    .filters-bar .form-select,
    .filters-bar .form-control {
      border-radius: 0.5rem;
      border: 1px solid var(--border-color, #e9ecef);
      box-shadow: none;
    }
    .filters-bar .form-control:focus,
    .filters-bar .form-select:focus {
      border-color: var(--primary-bank-blue);
      box-shadow: 0 0 0 0.2rem rgba(46,163,242,0.15);
    }
    .filters-bar .btn-primary {
      background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark));
      border: none;
    }

    /* Card/header */
    .card { border: none; border-radius: 0.75rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .card-header { background: #fff; border-bottom: 1px solid #e9ecef; border-radius: 0.75rem 0.75rem 0 0 !important; }

    /* Table */
    .modern-table thead { 
      background: linear-gradient(135deg, var(--primary-bank-blue), var(--primary-bank-blue-dark));
    }
    .modern-table thead th { 
      font-size: 0.8rem; 
      text-transform: uppercase; 
      letter-spacing: .04em; 
      color: #fff !important;
      border-bottom: none;
    }
    .modern-table thead tr th:first-child { border-top-left-radius: 0.5rem; }
    .modern-table thead tr th:last-child { border-top-right-radius: 0.5rem; }
    .modern-table tbody td { vertical-align: middle; }
    .table-responsive { border-radius: 0.75rem; overflow: hidden; }
    .table-hover tbody tr:hover { background: #f8fbff; }

    /* Chips */
    .risk-chip, .status-chip { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; color: #fff; }
    .risk-low { background: linear-gradient(135deg, #28a745, #20c997); }
    .risk-medium { background: linear-gradient(135deg, #ffc107, #ff9800); color: #000; }
    .risk-high { background: linear-gradient(135deg, #dc3545, #c82333); }
    .status-pending, .status-flagged { background: linear-gradient(135deg, #ffc107, #ff9800); color: #000; }
    .status-blocked, .status-rejected { background: linear-gradient(135deg, #dc3545, #c82333); }
    .status-approved, .status-completed { background: linear-gradient(135deg, #28a745, #20c997); }
    .nav-tabs .nav-link {
      border: none;
      color: #6c757d;
      transition: all 0.3s ease;
    }
    
    .nav-tabs .nav-link:hover {
      color: #007bff;
      background-color: #f8f9fa;
    }
    
    .nav-tabs .nav-link.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
      font-weight: 600;
    }
    
    .transaction-row-high { 
      background-color: #fff5f5;
      border-left: 4px solid #dc3545;
    }
    
    .transaction-row-medium { 
      background-color: #fffbf0;
      border-left: 4px solid #ffc107;
    }
    
    .transaction-row-low { 
      background-color: #f0f9ff;
      border-left: 4px solid #17a2b8;
    }
    
    .table td {
      vertical-align: middle;
    }

    /* Investigation Button Styling */
    .btn-outline-warning {
      border-width: 2px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-outline-warning:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
    }

    .btn-outline-warning:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Approve/Reject Button Styling */
    .btn-outline-success,
    .btn-outline-danger {
      border-width: 2px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-outline-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    .btn-outline-danger:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    /* Action Buttons Container */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: flex-start;
      align-items: center;
    }

    /* User-Friendly Action Buttons */
    .btn-action {
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      border-width: 1.5px;
      border-radius: 0.375rem;
      transition: all 0.3s ease;
      white-space: nowrap;
      min-width: 90px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-action i {
      font-size: 0.875rem;
    }

    .btn-action .btn-text {
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* View Button (Info/Blue) */
    .btn-info.btn-action {
      background-color: #0dcaf0;
      border-color: #0dcaf0;
      color: #000;
    }

    .btn-info.btn-action:hover:not(:disabled) {
      background-color: #31d2f2;
      border-color: #25cff2;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(13, 202, 240, 0.4);
    }

    /* Investigate Button (Warning/Yellow) */
    .btn-warning.btn-action {
      background-color: #ffc107;
      border-color: #ffc107;
      color: #000;
    }

    .btn-warning.btn-action:hover:not(:disabled) {
      background-color: #ffca2c;
      border-color: #ffc720;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 193, 7, 0.4);
    }

    /* Approve Button (Success/Green) */
    .btn-success.btn-action {
      background-color: #198754;
      border-color: #198754;
      color: #fff;
    }

    .btn-success.btn-action:hover:not(:disabled) {
      background-color: #157347;
      border-color: #146c43;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(25, 135, 84, 0.4);
    }

    /* Reject Button (Danger/Red) */
    .btn-danger.btn-action {
      background-color: #dc3545;
      border-color: #dc3545;
      color: #fff;
    }

    .btn-danger.btn-action:hover:not(:disabled) {
      background-color: #bb2d3b;
      border-color: #b02a37;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
    }

    /* Generate SAR Button (Purple) */
    .btn-purple.btn-action {
      background-color: #6f42c1;
      border-color: #6f42c1;
      color: #fff;
    }

    .btn-purple.btn-action:hover:not(:disabled) {
      background-color: #5a32a3;
      border-color: #59339d;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(111, 66, 193, 0.4);
    }

    /* Disabled State */
    .btn-action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    /* Button Group Spacing (Legacy) */
    .btn-group-sm .btn {
      margin: 0 2px;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-content {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      text-align: center;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.3);
    }

    /* Status Badge Enhancements */
    .badge {
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
    }

    /* Card Hover Effect */
    .card {
      transition: box-shadow 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    /* Table Row Hover */
    .table-hover tbody tr:hover {
      background-color: rgba(0, 123, 255, 0.05);
      cursor: pointer;
    }

    /* Alert Styling */
    .alert {
      border-left: 4px solid;
      border-radius: 0.25rem;
    }

    .alert-danger {
      border-left-color: #dc3545;
      background-color: #f8d7da;
    }

    /* Responsive Design */
    @media (max-width: 992px) {
      .action-buttons {
        flex-direction: column;
        align-items: stretch;
        gap: 0.375rem;
      }

      .btn-action {
        width: 100%;
        min-width: auto;
      }
    }

    @media (max-width: 768px) {
      .btn-group-sm .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }

      .btn-action {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }

      .btn-action .btn-text {
        font-size: 0.8125rem;
      }
    }

    @media (min-width: 1200px) {
      .action-buttons {
        gap: 0.625rem;
      }

      .btn-action {
        min-width: 100px;
        padding: 0.5rem 1rem;
      }
    }
  `]
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
