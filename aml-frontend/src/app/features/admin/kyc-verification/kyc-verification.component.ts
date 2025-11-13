import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { DocumentDTO } from '../../../core/models/admin.models';
import { ToastService } from '../../../core/services/toast.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-kyc-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc-verification.component.html',
  styleUrls: ['./kyc-verification.component.css']
})
export class KycVerificationComponent implements OnInit {
  pendingDocuments: DocumentDTO[] = [];
  filteredDocuments: DocumentDTO[] = [];
  paginatedDocuments: DocumentDTO[] = [];
  allDocuments: DocumentDTO[] = [];
  loading = false;
  statuses: string[] = ['ALL', 'UPLOADED', 'VERIFIED', 'REJECTED'];
  selectedStatus: string = 'ALL';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];
  
  // Modal states
  showPreviewModal = false;
  showVerifyModal = false;
  showRejectModal = false;
  selectedDocument: DocumentDTO | null = null;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    
    // Load all documents for stats
    this.adminService.getKycDocuments().subscribe({
      next: (allDocs) => {
        // Sort all documents by uploadedAt in descending order (latest first)
        this.allDocuments = allDocs.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        
        // Load filtered documents
        this.adminService.getKycDocuments(this.selectedStatus === 'ALL' ? undefined : this.selectedStatus).subscribe({
          next: (documents) => {
            // Sort filtered documents by uploadedAt in descending order (latest first)
            this.pendingDocuments = documents.sort((a, b) => 
              new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            this.filteredDocuments = this.pendingDocuments;
            this.currentPage = 1;
            this.updatePagination();
            this.loading = false;
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Failed to load KYC documents');
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to load statistics');
        this.loading = false;
      }
    });
  }

  // Modal Methods
  openVerifyModal(document: DocumentDTO): void {
    this.selectedDocument = document;
    this.showVerifyModal = true;
  }

  closeVerifyModal(): void {
    this.showVerifyModal = false;
    this.selectedDocument = null;
  }

  confirmVerify(): void {
    if (!this.selectedDocument) return;
    
    this.adminService.verifyKycDocument(this.selectedDocument.id).subscribe({
      next: () => {
        this.toastService.success(`Document verified successfully`, 5000);
        this.closeVerifyModal();
        this.loadDocuments();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to verify document');
      }
    });
  }

  openRejectModal(document: DocumentDTO): void {
    this.selectedDocument = document;
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedDocument = null;
  }

  confirmReject(): void {
    if (!this.selectedDocument ) return;
    
    this.adminService.rejectKycDocument(this.selectedDocument.id).subscribe({
      next: () => {
        this.toastService.success(`Document rejected successfully`, 5000);
        this.closeRejectModal();
        this.loadDocuments();
      },
      error: (err: any) => {
        this.toastService.error(err.error?.message || 'Failed to reject document');
      }
    });
  }

  previewDocument(document: DocumentDTO): void {
    this.selectedDocument = document;
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.selectedDocument = null;
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
    this.searchTerm = '';
    this.loadDocuments();
  }

  filterDocuments(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredDocuments = this.pendingDocuments;
    } else {
      this.filteredDocuments = this.pendingDocuments.filter(doc =>
        doc.customerName?.toLowerCase().includes(term) ||
        doc.customerId.toString().includes(term) ||
        doc.docType?.toLowerCase().includes(term)
      );
    }
    // Ensure filtered documents maintain the sort order (latest first)
    this.filteredDocuments = this.filteredDocuments.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  formatDocType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'VERIFIED': return 'fa-check-circle';
      case 'REJECTED': return 'fa-times-circle';
      case 'UPLOADED': return 'fa-clock';
      default: return 'fa-question-circle';
    }
  }

  // Stats Methods
  getPendingCount(): number {
    return this.allDocuments.filter(d => d.status === 'UPLOADED').length;
  }

  getVerifiedCount(): number {
    return this.allDocuments.filter(d => d.status === 'VERIFIED').length;
  }

  getRejectedCount(): number {
    return this.allDocuments.filter(d => d.status === 'REJECTED').length;
  }

  getTotalCount(): number {
    return this.allDocuments.length;
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

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDocuments.length / this.itemsPerPage);
    this.updatePageNumbers();
    this.paginateDocuments();
  }

  updatePageNumbers(): void {
    this.pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  paginateDocuments(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDocuments = this.filteredDocuments.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePageNumbers();
      this.paginateDocuments();
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
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredDocuments.length);
  }
}
