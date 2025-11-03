import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-restriction-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header" [ngClass]="getHeaderClass()">
            <div class="header-icon">
              <i class="fas" [ngClass]="getIconClass()"></i>
            </div>
            <h4 class="modal-title">{{ getTitle() }}</h4>
            <button type="button" class="btn-close" (click)="close()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <div class="alert-content">
              <div class="document-info" *ngIf="documentType">
                <div class="info-row">
                  <span class="info-label">Document Type:</span>
                  <span class="info-value">{{ documentType }}</span>
                </div>
                <div class="info-row" *ngIf="status">
                  <span class="info-label">Current Status:</span>
                  <span class="info-value">
                    <span class="badge" [ngClass]="getStatusBadgeClass()">{{ status }}</span>
                  </span>
                </div>
              </div>

              <div class="message-content">
                <p class="main-message">{{ getMainMessage() }}</p>
                <p class="sub-message">{{ getSubMessage() }}</p>
              </div>

              <div class="info-box" [ngClass]="getInfoBoxClass()">
                <i class="fas fa-info-circle me-2"></i>
                <span>{{ getInfoMessage() }}</span>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" (click)="close()">
              <i class="fas fa-check me-2"></i>OK, Got It
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
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-dialog {
      width: 90%;
      max-width: 550px;
      animation: slideDown 0.3s ease;
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
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .modal-header {
      padding: 2rem;
      color: white;
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .modal-header.verified {
      background: linear-gradient(135deg, #198754 0%, #157347 100%);
    }

    .modal-header.review {
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    }

    .modal-header.restricted {
      background: linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%);
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      flex: 1;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 2rem;
    }

    .document-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border-left: 4px solid #0d6efd;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .info-row:not(:last-child) {
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 0.5rem;
    }

    .info-label {
      font-weight: 600;
      color: #495057;
      font-size: 0.9rem;
    }

    .info-value {
      color: #212529;
      font-weight: 500;
    }

    .badge {
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .badge.bg-success {
      background: #198754 !important;
    }

    .badge.bg-warning {
      background: #ffc107 !important;
      color: #000 !important;
    }

    .badge.bg-danger {
      background: #dc3545 !important;
    }

    .message-content {
      margin-bottom: 1.5rem;
    }

    .main-message {
      font-size: 1.05rem;
      color: #212529;
      font-weight: 500;
      margin-bottom: 0.75rem;
      line-height: 1.6;
    }

    .sub-message {
      font-size: 0.95rem;
      color: #6c757d;
      margin: 0;
      line-height: 1.5;
    }

    .info-box {
      padding: 1rem 1.25rem;
      border-radius: 10px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    .info-box.verified {
      background: #d1e7dd;
      color: #0a3622;
      border: 1px solid #a3cfbb;
    }

    .info-box.review {
      background: #fff3cd;
      color: #664d03;
      border: 1px solid #ffe69c;
    }

    .info-box.restricted {
      background: #f8d7da;
      color: #58151c;
      border: 1px solid #f1aeb5;
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #dee2e6;
    }

    .btn {
      padding: 0.75rem 2rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 110, 253, 0.4);
    }

    @media (max-width: 576px) {
      .modal-dialog {
        width: 95%;
        margin: 1rem;
      }

      .modal-header {
        padding: 1.5rem;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-title {
        font-size: 1.25rem;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        font-size: 1.5rem;
      }
    }
  `]
})
export class UploadRestrictionModalComponent {
  @Input() isOpen = false;
  @Input() documentType = '';
  @Input() status = '';
  @Input() restrictionType: 'verified' | 'review' | 'restricted' = 'review';
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }

  getHeaderClass(): string {
    return this.restrictionType;
  }

  getIconClass(): string {
    switch (this.restrictionType) {
      case 'verified':
        return 'fa-check-circle';
      case 'review':
        return 'fa-clock';
      case 'restricted':
        return 'fa-lock';
      default:
        return 'fa-info-circle';
    }
  }

  getTitle(): string {
    switch (this.restrictionType) {
      case 'verified':
        return 'Document Already Verified';
      case 'review':
        return 'Document Under Review';
      case 'restricted':
        return 'Upload Restricted';
      default:
        return 'Information';
    }
  }

  getMainMessage(): string {
    switch (this.restrictionType) {
      case 'verified':
        return `Your ${this.documentType} document has been successfully verified.`;
      case 'review':
        return `Your ${this.documentType} document is currently being reviewed by our compliance team.`;
      case 'restricted':
        return 'Document upload is currently not available.';
      default:
        return '';
    }
  }

  getSubMessage(): string {
    switch (this.restrictionType) {
      case 'verified':
        return 'You cannot upload new documents at this time as your current document is already verified and active.';
      case 'review':
        return 'Please wait for the review process to complete. You will be able to upload a new document only if this one is rejected.';
      case 'restricted':
        return 'Please contact our support team for assistance with document uploads.';
      default:
        return '';
    }
  }

  getInfoMessage(): string {
    switch (this.restrictionType) {
      case 'verified':
        return 'If you need to update your documents, please contact our support team.';
      case 'review':
        return 'The review process typically takes 1-2 business days. You will be notified once completed.';
      case 'restricted':
        return 'Our support team is available 24/7 to help you with any document-related queries.';
      default:
        return '';
    }
  }

  getStatusBadgeClass(): string {
    const statusUpper = this.status.toUpperCase();
    if (statusUpper === 'VERIFIED' || statusUpper === 'APPROVED' || statusUpper === 'COMPLETED') {
      return 'bg-success';
    } else if (statusUpper === 'REJECTED' || statusUpper === 'DENIED') {
      return 'bg-danger';
    } else {
      return 'bg-warning';
    }
  }

  getInfoBoxClass(): string {
    return this.restrictionType;
  }
}
