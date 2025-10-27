import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AuditLog } from '../../core/services/admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  loading = false;
  error = '';

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
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load audit logs';
        this.loading = false;
      }
    });
  }

  getActionBadgeClass(action: string): string {
    if (action.includes('CREATE')) return 'bg-success';
    if (action.includes('UPDATE')) return 'bg-info';
    if (action.includes('DELETE')) return 'bg-danger';
    if (action.includes('LOGIN')) return 'bg-primary';
    return 'bg-secondary';
  }
}
