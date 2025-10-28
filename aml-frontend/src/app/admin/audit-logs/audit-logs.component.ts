import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLog } from '../../core/services/admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  paginatedLogs: AuditLog[] = [];
  loading = false;
  error = '';
  
  // Search and pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'desc';
  Math = Math;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllAuditLogs().subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.filteredLogs = [...logs];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load audit logs';
        this.loading = false;
      }
    });
  }

  filterLogs(): void {
    if (!this.searchTerm.trim()) {
      this.filteredLogs = [...this.auditLogs];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLogs = this.auditLogs.filter(log =>
        log.username?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.id?.toString().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredLogs.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredLogs.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);
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

  getActionBadgeClass(action: string): string {
    if (action.includes('CREATE')) return 'bg-success';
    if (action.includes('UPDATE')) return 'bg-info';
    if (action.includes('DELETE')) return 'bg-danger';
    if (action.includes('LOGIN')) return 'bg-primary';
    return 'bg-secondary';
  }
}
