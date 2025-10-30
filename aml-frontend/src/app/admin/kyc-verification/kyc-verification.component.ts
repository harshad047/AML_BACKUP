import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, DocumentDTO } from '../../core/services/admin.service';

@Component({
  selector: 'app-kyc-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc-verification.component.html',
  styleUrls: ['./kyc-verification.component.css']
})
export class KycVerificationComponent implements OnInit {
  pendingDocuments: DocumentDTO[] = [];
  loading = false;
  error = '';
  success = '';
  statuses: string[] = ['ALL', 'UPLOADED', 'VERIFIED', 'REJECTED'];
  selectedStatus: string = 'UPLOADED';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getKycDocuments(this.selectedStatus === 'ALL' ? undefined : this.selectedStatus).subscribe({
      next: (documents) => {
        this.pendingDocuments = documents;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load KYC documents';
        this.loading = false;
      }
    });
  }

  verifyDocument(document: DocumentDTO): void {
    const name = this.getFileNameFromUrl(document.storagePath) || document.docType;
    if (!confirm(`Verify document "${name}"?`)) return;

    this.adminService.verifyKycDocument(document.id).subscribe({
      next: () => {
        this.success = `Document "${name}" verified successfully`;
        this.loadDocuments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to verify document';
      }
    });
  }

  rejectDocument(document: DocumentDTO): void {
    const name = this.getFileNameFromUrl(document.storagePath) || document.docType;
    const proceed = confirm(`Reject document "${name}"?`);
    if (!proceed) return;
    const reason = prompt('Enter rejection reason (optional):') || undefined;

    this.adminService.rejectKycDocument(document.id, reason).subscribe({
      next: () => {
        this.success = `Document "${name}" rejected`;
        this.loadDocuments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to reject document';
      }
    });
  }

  getDocumentTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'PASSPORT': return 'bg-primary';
      case 'DRIVERS_LICENSE': return 'bg-info';
      case 'NATIONAL_ID': return 'bg-success';
      case 'UTILITY_BILL': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getFileNameFromUrl(url?: string): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      const name = u.pathname.split('/').pop();
      return name || '';
    } catch {
      const parts = url.split('?')[0].split('/');
      return parts.pop() || '';
    }
  }

  onStatusChange(status: string) {
    this.selectedStatus = status;
    this.loadDocuments();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'VERIFIED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      case 'UPLOADED': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  get emptyText(): string {
    switch (this.selectedStatus) {
      case 'UPLOADED': return 'No pending KYC documents';
      case 'VERIFIED': return 'No verified documents';
      case 'REJECTED': return 'No rejected documents';
      case 'ALL':
      default: return 'No documents to display';
    }
  }
}
