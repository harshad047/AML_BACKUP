import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, TransactionDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class AdminTransactionsComponent implements OnInit {
  loading = false;
  error = '';
  transactions: TransactionDto[] = [];
  allTransactions: TransactionDto[] = [];
  filteredTx: TransactionDto[] = [];
  paginatedTx: TransactionDto[] = [];
  status: 'ALL' | 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'REJECTED' = 'ALL';
  search = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  Math = Math;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAllTransactions();
    this.fetch();
  }
  
  loadAllTransactions(): void {
    this.adminService.getAdminTransactions().subscribe({
      next: (tx) => {
        this.allTransactions = tx;
      },
      error: () => {}
    });
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    const statusParam = this.status === 'ALL' ? undefined : this.status;
    this.adminService.getAdminTransactions(statusParam).subscribe({
      next: (tx) => {
        this.transactions = tx;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  setStatus(s: 'ALL' | 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'REJECTED'): void {
    this.status = s;
    this.search = '';
    this.currentPage = 1;
    this.fetch();
  }

  applyFilter(): void {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      this.filteredTx = [...this.transactions];
    } else {
      this.filteredTx = this.transactions.filter(t =>
        t.transactionType?.toLowerCase().includes(q) ||
        t.fromAccountNumber?.toLowerCase().includes(q) ||
        t.toAccountNumber?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        t.transactionReference?.toLowerCase().includes(q)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }
  
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTx.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTx = this.filteredTx.slice(startIndex, endIndex);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
  
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }
  
  // Stats Methods
  getApprovedCount(): number {
    return this.allTransactions.filter(t => t.status === 'APPROVED').length;
  }
  
  getFlaggedCount(): number {
    return this.allTransactions.filter(t => t.status === 'FLAGGED').length;
  }
  
  getBlockedCount(): number {
    return this.allTransactions.filter(t => t.status === 'BLOCKED').length;
  }
  
  getTotalCount(): number {
    return this.allTransactions.length;
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'FLAGGED': return 'bg-info text-dark';
      case 'BLOCKED': return 'bg-danger';
      case 'REJECTED': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }
  
  getRiskBadgeClass(risk: number): string {
    if (risk >= 80) return 'bg-danger';
    if (risk >= 50) return 'bg-warning text-dark';
    if (risk >= 30) return 'bg-info text-dark';
    return 'bg-success';
  }
}
