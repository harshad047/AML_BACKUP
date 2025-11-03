import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocumentPreview {
  id: number;
  documentType?: string;
  fileName?: string;
  uploadedAt?: string;
  status?: string;
  verificationStatus?: string;
  storagePath?: string;
  url?: string;
  fileUrl?: string;
  downloadUrl?: string;
  secureUrl?: string;
  secure_url?: string;
  link?: string;
}

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-content">
              <i class="fas fa-file-alt me-2"></i>
              <h4 class="modal-title">Document Preview</h4>
            </div>
            <button type="button" class="btn-close" (click)="close()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Document Info Section -->
          <div class="document-info-section">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-icon customer">
                  <i class="fas fa-user"></i>
                </div>
                <div class="info-content">
                  <span class="info-label">Customer:</span>
                  <span class="info-value">{{ customerName }}</span>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon document">
                  <i class="fas fa-file-alt"></i>
                </div>
                <div class="info-content">
                  <span class="info-label">Document Type:</span>
                  <span class="info-value">{{ document?.documentType || 'N/A' }}</span>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon date">
                  <i class="fas fa-calendar"></i>
                </div>
                <div class="info-content">
                  <span class="info-label">Uploaded:</span>
                  <span class="info-value">{{ document?.uploadedAt | date:'MMM dd, yyyy, h:mm a' }}</span>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon status" [ngClass]="getStatusIconClass()">
                  <i class="fas" [ngClass]="getStatusIcon()"></i>
                </div>
                <div class="info-content">
                  <span class="info-label">Status:</span>
                  <span class="badge" [ngClass]="getStatusBadgeClass()">
                    {{ document?.status || 'PENDING' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Document Preview Section -->
          <div class="preview-section">
            <div class="preview-container" *ngIf="getDocumentUrl()">
              <!-- Image Preview -->
              <div class="image-preview" *ngIf="isImageFile()">
                <img [src]="getDocumentUrl()" [alt]="document?.fileName" />
              </div>

              <!-- PDF Preview -->
              <div class="pdf-preview" *ngIf="isPdfFile()">
                <iframe [src]="getSafeUrl()" frameborder="0"></iframe>
              </div>

              <!-- Unsupported File Type -->
              <div class="unsupported-preview" *ngIf="!isImageFile() && !isPdfFile()">
                <div class="unsupported-content">
                  <i class="fas fa-file fa-4x mb-3 text-muted"></i>
                  <h5>Preview Not Available</h5>
                  <p class="text-muted">This file type cannot be previewed in the browser.</p>
                  <p class="text-muted small">Click "Open in New Tab" to view the document.</p>
                </div>
              </div>
            </div>

            <!-- No Document URL -->
            <div class="no-preview" *ngIf="!getDocumentUrl()">
              <div class="no-preview-content">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
                <h5>Document Not Available</h5>
                <p class="text-muted">The document URL is not available at this time.</p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close()">
              <i class="fas fa-times me-2"></i>Close
            </button>
            <button type="button" class="btn btn-primary" (click)="openInNewTab()" [disabled]="!getDocumentUrl()">
              <i class="fas fa-external-link-alt me-2"></i>Open in New Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
      overflow-y: auto;
      padding: 1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-dialog {
      width: 100%;
      max-width: 900px;
      animation: slideDown 0.3s ease;
      margin: auto;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      padding: 1.25rem 1.5rem;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .document-info-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
      flex-shrink: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      padding: 0.875rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .info-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: white;
      flex-shrink: 0;
    }

    .info-icon.customer {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
    }

    .info-icon.document {
      background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
    }

    .info-icon.date {
      background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%);
    }

    .info-icon.status.verified {
      background: linear-gradient(135deg, #198754 0%, #157347 100%);
    }

    .info-icon.status.pending {
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    }

    .info-icon.status.rejected {
      background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%);
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }

    .info-label {
      font-size: 0.75rem;
      color: #6c757d;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 0.9rem;
      color: #212529;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge {
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .badge.bg-success {
      background: #198754 !important;
      color: white;
    }

    .badge.bg-warning {
      background: #ffc107 !important;
      color: #000;
    }

    .badge.bg-danger {
      background: #dc3545 !important;
      color: white;
    }

    .badge.bg-secondary {
      background: #6c757d !important;
      color: white;
    }

    .preview-section {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 400px;
      max-height: 500px;
    }

    .preview-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      overflow: auto;
      padding: 1rem;
    }

    .image-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .image-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .pdf-preview {
      width: 100%;
      height: 100%;
      display: flex;
    }

    .pdf-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
    }

    .unsupported-preview,
    .no-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .unsupported-content,
    .no-preview-content {
      text-align: center;
      padding: 2rem;
    }

    .unsupported-content h5,
    .no-preview-content h5 {
      color: #495057;
      margin-bottom: 0.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn {
      padding: 0.625rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 110, 253, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .modal-dialog {
        width: 95%;
        margin: 0.5rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .modal-header {
        padding: 1rem;
      }

      .document-info-section {
        padding: 1rem;
      }

      .preview-section {
        min-height: 300px;
        max-height: 400px;
      }

      .modal-footer {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DocumentPreviewModalComponent {
  @Input() isOpen = false;
  @Input() document: DocumentPreview | null = null;
  @Input() customerName = 'Mahek Mozariya';
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  getDocumentUrl(): string | null {
    if (!this.document) return null;

    const candidates = [
      this.document.storagePath,
      this.document.url,
      this.document.fileUrl,
      this.document.downloadUrl,
      this.document.secureUrl,
      this.document.secure_url,
      this.document.link
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
          return candidate;
        }
      }
    }

    return null;
  }

  getSafeUrl(): any {
    const url = this.getDocumentUrl();
    if (!url) return null;
    // In a real app, you'd use DomSanitizer here
    return url;
  }

  isImageFile(): boolean {
    const fileName = this.document?.fileName?.toLowerCase() || '';
    const url = this.getDocumentUrl()?.toLowerCase() || '';
    return fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || fileName.endsWith('.gif') ||
           url.includes('.jpg') || url.includes('.jpeg') || 
           url.includes('.png') || url.includes('.gif');
  }

  isPdfFile(): boolean {
    const fileName = this.document?.fileName?.toLowerCase() || '';
    const url = this.getDocumentUrl()?.toLowerCase() || '';
    return fileName.endsWith('.pdf') || url.includes('.pdf');
  }

  openInNewTab(): void {
    const url = this.getDocumentUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  getStatusBadgeClass(): string {
    const status = this.document?.status?.toUpperCase() || '';
    if (status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED') {
      return 'bg-success';
    } else if (status === 'REJECTED' || status === 'DENIED') {
      return 'bg-danger';
    } else if (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'UPLOADED') {
      return 'bg-warning';
    }
    return 'bg-secondary';
  }

  getStatusIcon(): string {
    const status = this.document?.status?.toUpperCase() || '';
    if (status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED') {
      return 'fa-check-circle';
    } else if (status === 'REJECTED' || status === 'DENIED') {
      return 'fa-times-circle';
    } else {
      return 'fa-clock';
    }
  }

  getStatusIconClass(): string {
    const status = this.document?.status?.toUpperCase() || '';
    if (status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED') {
      return 'verified';
    } else if (status === 'REJECTED' || status === 'DENIED') {
      return 'rejected';
    }
    return 'pending';
  }
}
