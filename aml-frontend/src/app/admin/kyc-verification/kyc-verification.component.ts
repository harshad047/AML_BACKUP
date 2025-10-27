import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, DocumentDTO } from '../../core/services/admin.service';

@Component({
  selector: 'app-kyc-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-verification.component.html',
  styleUrls: ['./kyc-verification.component.css']
})
export class KycVerificationComponent implements OnInit {
  pendingDocuments: DocumentDTO[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadPendingDocuments();
  }

  loadPendingDocuments(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getPendingKycDocuments().subscribe({
      next: (documents) => {
        this.pendingDocuments = documents;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load pending KYC documents';
        this.loading = false;
      }
    });
  }

  verifyDocument(document: DocumentDTO): void {
    if (!confirm(`Verify document "${document.fileName}"?`)) return;

    this.adminService.verifyKycDocument(document.id).subscribe({
      next: () => {
        this.success = `Document "${document.fileName}" verified successfully`;
        this.loadPendingDocuments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to verify document';
      }
    });
  }

  rejectDocument(document: DocumentDTO): void {
    if (!confirm(`Reject document "${document.fileName}"?`)) return;

    this.adminService.rejectKycDocument(document.id).subscribe({
      next: () => {
        this.success = `Document "${document.fileName}" rejected`;
        this.loadPendingDocuments();
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
}
