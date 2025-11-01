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
  actionFilter = 'ALL';
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
    let filtered = [...this.auditLogs];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.username?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.id?.toString().includes(term)
      );
    }
    
    // Apply action filter
    if (this.actionFilter !== 'ALL') {
      filtered = filtered.filter(log => {
        if (this.actionFilter === 'LOGIN') return log.action?.includes('LOGIN');
        if (this.actionFilter === 'CREATE') return log.action?.includes('CREATE');
        if (this.actionFilter === 'UPDATE') return log.action?.includes('UPDATE');
        if (this.actionFilter === 'DELETE') return log.action?.includes('DELETE');
        if (this.actionFilter === 'EMAIL') return log.action?.includes('EMAIL');
        if (this.actionFilter === 'ACCOUNT') return log.action?.includes('ACCOUNT');
        return true;
      });
    }
    
    this.filteredLogs = filtered;
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
    if (action.includes('EMAIL')) return 'bg-warning';
    if (action.includes('ACCOUNT')) return 'bg-info';
    return 'bg-secondary';
  }
  
  // Stats Methods
  getLoginCount(): number {
    return this.auditLogs.filter(log => log.action?.includes('LOGIN')).length;
  }
  
  getCreateCount(): number {
    return this.auditLogs.filter(log => log.action?.includes('CREATE')).length;
  }
  
  getUpdateCount(): number {
    return this.auditLogs.filter(log => log.action?.includes('UPDATE')).length;
  }
  
  getTotalCount(): number {
    return this.auditLogs.length;
  }
}
