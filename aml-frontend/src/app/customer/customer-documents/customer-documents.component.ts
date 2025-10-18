import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentService, DocumentDto } from '../../core/services/document.service';

interface DocumentWithStatus {
  id: number;
  documentType?: string;
  fileName?: string;
  uploadedAt?: string;
  status?: string;
  verificationStatus?: string;
  approvalStatus?: string;
  reviewStatus?: string;
  verified?: boolean;
  approved?: boolean;
  rejected?: boolean;
  // Additional fields that might be in API response
  storagePath?: string;
  url?: string;
  fileUrl?: string;
  downloadUrl?: string;
  secureUrl?: string;
  secure_url?: string;
  link?: string;
  filename?: string;
  originalFileName?: string;
  name?: string;
  createdAt?: string;
  uploadedDate?: string;
  timestamp?: string;
  type?: string;
  docType?: string;
  category?: string;
}

@Component({
  selector: 'app-customer-documents',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  template: `
    <div class="container py-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">My Documents</h3>
        <span class="badge" [ngClass]="getOverallStatusClass()">
          {{ getOverallStatusText() }}
        </span>
      </div>

      <!-- Document Upload Section -->
      <div class="card mb-3">
        <div class="card-header">
          <h5 class="mb-0">Upload New Document</h5>
        </div>
        <div class="card-body">
          <form [formGroup]="uploadForm" (ngSubmit)="onUpload()">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Document Type</label>
                <select class="form-select" formControlName="documentType">
                  <option value="">Select document type</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="BANK_STATEMENT">Bank Statement</option>
                  <option value="UTILITY_BILL">Utility Bill</option>
                  <option value="OTHER">Other</option>
                </select>
                <div *ngIf="uploadForm.get('documentType')?.invalid && uploadForm.get('documentType')?.touched" class="text-danger small">
                  Document type is required
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">File</label>
                <input type="file" class="form-control" #fileInput (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png" />
                <div *ngIf="selectedFileName" class="text-success small mt-1">
                  Selected: {{ selectedFileName }}
                </div>
                <div *ngIf="!selectedFileName && uploadForm.get('documentType')?.touched" class="text-danger small">
                  Please select a file (PDF, JPG, PNG)
                </div>
                <div class="form-text">Supported formats: PDF, JPG, PNG. Max size: 5MB</div>
              </div>
            </div>
            <div class="mt-3">
              <button class="btn btn-primary" type="submit" [disabled]="!selectedFile || uploading">
                <span *ngIf="!uploading">
                  <i class="fas fa-upload me-2"></i>Upload Document
                </span>
                <span *ngIf="uploading">
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>Uploading...
                </span>
              </button>
              <div *ngIf="uploadError" class="text-danger mt-2">{{ uploadError }}</div>
              <div *ngIf="uploadSuccess" class="text-success mt-2">{{ uploadSuccess }}</div>
            </div>
          </form>
        </div>
      </div>

      <!-- KYC Status Card -->
      <div class="card mb-3" *ngIf="hasKycStatus()">
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <h6 class="card-title">KYC Verification Status</h6>
              <p class="card-text text-muted">{{ getKycStatusMessage() }}</p>
            </div>
            <div class="col-md-4 text-end">
              <span class="badge fs-6" [ngClass]="getKycStatusBadgeClass()">
                {{ getKycStatusText() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div class="text-center text-muted py-4" *ngIf="loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading documents...</p>
          </div>

          <div class="alert alert-danger" *ngIf="error">{{ error }}</div>

          <div class="table-responsive" *ngIf="!loading && documents.length > 0">
            <table class="table table-striped mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of documents; index as i" [class]="'document-row ' + getDocumentRowClass(doc)">
                  <td>{{ i + 1 }}</td>
                  <td>
                    <strong>{{ getDocumentTypeDisplay(doc) }}</strong>
                    <div class="text-muted small">{{ getDocumentDescription(doc) }}</div>
                  </td>
                  <td>{{ getFileName(doc) }}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(doc.status)">
                      {{ getStatusText(doc) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getVerificationBadgeClass(doc)">
                      {{ getVerificationText(doc) }}
                    </span>
                  </td>
                  <td>{{ getUploadedDate(doc) | date:'medium' }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" (click)="viewDocument(doc)" title="View Document">
                      <i class="fas fa-eye me-1"></i>View Document
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-center text-muted py-4" *ngIf="!loading && documents.length === 0">
            <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
            <p>No documents found</p>
            <small class="text-muted">Documents uploaded during registration will appear here once processed.</small>
          </div>
        </div>
      </div>

      <!-- Document Preview Modal (if needed) -->
    </div>
  `,
  styles: [`
    .document-row {
      transition: background-color 0.2s ease;
    }

    .document-row:hover {
      background-color: #f8f9fa;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
    }

    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
  `]
})
export class CustomerDocumentsComponent implements OnInit {
  documents: DocumentWithStatus[] = [];
  loading = false;
  error = '';
  uploadForm: FormGroup;
  uploading = false;
  uploadError = '';
  uploadSuccess = '';
  selectedFileName = '';
  selectedFile: File | null = null;

  constructor(private docs: DocumentService, private fb: FormBuilder) {
    this.uploadForm = this.fb.group({
      documentType: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.docs.getMyDocuments().subscribe({
      next: (resp) => {
        this.loading = false;
        const rawData = ((resp as any)?.data ?? (resp as any) ?? []) as any[];
        console.log('Raw documents API response:', rawData);

        this.documents = Array.isArray(rawData) ? rawData.map(doc => ({
          id: doc.id || 0,
          documentType: this.getDocumentType(doc),
          fileName: this.getFileName(doc),
          uploadedAt: this.getUploadedDate(doc),
          status: this.getStatus(doc),
          verificationStatus: this.getVerificationStatus(doc),
          approvalStatus: this.getApprovalStatus(doc),
          reviewStatus: this.getReviewStatus(doc),
          verified: this.isVerified(doc),
          approved: this.isApproved(doc),
          rejected: this.isRejected(doc),
          // Include URL fields from API response
          storagePath: doc.storagePath,
          url: doc.url,
          fileUrl: doc.fileUrl,
          downloadUrl: doc.downloadUrl,
          secureUrl: doc.secureUrl,
          secure_url: doc.secure_url,
          link: doc.link
        } as DocumentWithStatus)) : [];

        console.log('Mapped documents:', this.documents);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load documents';
        this.documents = [];
        console.error('Error loading documents:', err);
      }
    });
  }

  // Field mapping methods
  private getDocumentType(doc: any): string {
    return doc.documentType || doc.type || doc.docType || doc.category || 'Unknown';
  }

  getFileName(doc: any): string {
    return doc.fileName || doc.filename || doc.originalFileName || doc.name || `document-${doc.id || ''}`;
  }

  getUploadedDate(doc: any): string {
    return doc.uploadedAt || doc.createdAt || doc.uploadedDate || doc.timestamp || new Date().toISOString();
  }

  private getStatus(doc: any): string {
    // Try multiple possible status field names
    return doc.status || doc.verificationStatus || doc.approvalStatus || doc.reviewStatus || 'PENDING';
  }

  private getVerificationStatus(doc: any): string {
    return doc.verificationStatus || doc.status || 'PENDING';
  }

  private getApprovalStatus(doc: any): string {
    return doc.approvalStatus || doc.status || 'PENDING';
  }

  private getReviewStatus(doc: any): string {
    return doc.reviewStatus || doc.status || 'PENDING';
  }

  private isVerified(doc: any): boolean {
    const status = this.getStatus(doc).toUpperCase();
    return status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED';
  }

  private isApproved(doc: any): boolean {
    const status = this.getStatus(doc).toUpperCase();
    return status === 'APPROVED' || status === 'VERIFIED' || status === 'COMPLETED';
  }

  private isRejected(doc: any): boolean {
    const status = this.getStatus(doc).toUpperCase();
    return status === 'REJECTED' || status === 'DENIED' || status === 'FAILED';
  }

  // Display methods
  getDocumentTypeDisplay(doc: DocumentWithStatus): string {
    return this.getDocumentType(doc);
  }

  getDocumentDescription(doc: DocumentWithStatus): string {
    const type = this.getDocumentType(doc);
    switch (type.toLowerCase()) {
      case 'aadhaar': return 'Government-issued ID proof';
      case 'pan': return 'Permanent Account Number card';
      case 'passport': return 'International travel document';
      case 'driving_license': return 'Driver\'s license';
      case 'voter_id': return 'Voter identification card';
      default: return 'Supporting document';
    }
  }

  getStatusText(doc: DocumentWithStatus): string {
    return this.getStatus(doc);
  }

  getVerificationText(doc: DocumentWithStatus): string {
    if (this.isVerified(doc)) return 'Verified';
    if (this.isRejected(doc)) return 'Rejected';
    return 'Under Review';
  }

  getStatusBadgeClass(status?: string): string {
    if (!status) return 'bg-secondary';

    switch (status.toUpperCase()) {
      case 'VERIFIED':
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-success';
      case 'REJECTED':
      case 'DENIED':
      case 'FAILED':
        return 'bg-danger';
      case 'PENDING':
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getVerificationBadgeClass(doc: DocumentWithStatus): string {
    if (this.isVerified(doc)) return 'bg-success';
    if (this.isRejected(doc)) return 'bg-danger';
    return 'bg-warning';
  }

  getDocumentRowClass(doc: DocumentWithStatus): string {
    if (this.isRejected(doc)) return 'table-danger';
    if (this.isVerified(doc)) return 'table-success';
    return '';
  }

  getOverallStatusClass(): string {
    if (this.documents.length === 0) return 'bg-secondary';

    const verifiedCount = this.documents.filter(d => this.isVerified(d)).length;
    const rejectedCount = this.documents.filter(d => this.isRejected(d)).length;

    if (rejectedCount > 0) return 'bg-danger';
    if (verifiedCount === this.documents.length) return 'bg-success';
    return 'bg-warning';
  }

  getOverallStatusText(): string {
    if (this.documents.length === 0) return 'No Documents';

    const verifiedCount = this.documents.filter(d => this.isVerified(d)).length;
    const rejectedCount = this.documents.filter(d => this.isRejected(d)).length;

    if (rejectedCount > 0) return 'Action Required';
    if (verifiedCount === this.documents.length) return 'All Verified';
    return 'Under Review';
  }

  hasKycStatus(): boolean {
    return this.documents.length > 0;
  }

  getKycStatusText(): string {
    return this.getOverallStatusText();
  }

  getKycStatusBadgeClass(): string {
    return this.getOverallStatusClass();
  }

  getKycStatusMessage(): string {
    const verifiedCount = this.documents.filter(d => this.isVerified(d)).length;
    const totalCount = this.documents.length;

    if (verifiedCount === totalCount) {
      return 'All your documents have been verified successfully.';
    } else if (verifiedCount > 0) {
      return `${verifiedCount} of ${totalCount} documents verified. ${totalCount - verifiedCount} still under review.`;
    } else {
      return 'Your documents are currently being reviewed by our compliance team.';
    }
  }

  viewDocument(doc: DocumentWithStatus): void {
    console.log('Viewing document with ID:', doc.id);

    // Get the direct URL (should include storagePath now)
    const directUrl = this.getDocumentUrl(doc);

    if (directUrl) {
      console.log('Opening document URL:', directUrl);
      window.open(directUrl, '_blank');
    } else {
      console.error('No document URL found for document:', doc);
      this.error = 'Document link not available. Please contact support.';
    }
  }

  downloadDocument(doc: DocumentWithStatus): void {
    const link = this.getDocumentUrl(doc);
    if (link) {
      window.open(link, '_blank');
    } else {
      this.error = 'Download link not available for this document';
    }
  }

  private getDocumentUrl(doc: DocumentWithStatus): string | null {
    // Try multiple possible URL fields in order of priority
    const candidates = [
      doc.storagePath,  // Cloudinary URL (highest priority)
      doc.url,
      doc.fileUrl,
      doc.downloadUrl,
      doc.secureUrl,
      doc.secure_url,
      doc.link
    ];

    console.log('Checking document URL candidates for doc ID:', doc.id);

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (typeof candidate === 'string' && candidate.length > 0) {
        // Validate that it looks like a proper URL
        if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
          console.log(`Found valid URL at priority ${i + 1}:`, candidate);
          return candidate;
        } else {
          console.log(`Invalid URL format at priority ${i + 1}:`, candidate);
        }
      }
    }

    console.log('No valid document URL found');
    return null;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 5MB';
        this.selectedFileName = '';
        this.selectedFile = null;
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.uploadError = 'Please select a valid file (PDF, JPG, PNG)';
        this.selectedFileName = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFileName = file.name;
      this.selectedFile = file;
      this.uploadError = '';
    } else {
      this.selectedFileName = '';
      this.selectedFile = null;
    }
  }

  onUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    const formValue = this.uploadForm.value;

    console.log('Starting document upload process...');

    this.docs.uploadDocument(this.selectedFile, formValue.documentType).subscribe({
      next: (resp) => {
        this.uploading = false;
        const uploadedDoc = (resp as any)?.data ?? (resp as any);
        if (uploadedDoc) {
          this.uploadSuccess = `Document "${uploadedDoc.fileName}" uploaded successfully and is under review.`;
          this.uploadForm.reset();
          this.selectedFileName = '';
          this.selectedFile = null;
          // Refresh the documents list
          this.fetch();
        } else {
          this.uploadError = 'Upload completed but no document data received.';
        }
      },
      error: (err) => {
        this.uploading = false;

        // Safe error logging - avoid logging the entire error object
        console.error('Upload failed with status:', err?.status || 'unknown');
        if (err?.message) {
          console.error('Error message:', err.message);
        }

        // Handle different error response structures
        let errorMessage = 'Failed to upload document. Please try again.';

        try {
          if (err?.error?.message) {
            errorMessage = err.error.message;
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err?.status) {
            switch (err.status) {
              case 400:
                errorMessage = 'Invalid request. Please check your file and document type.';
                break;
              case 401:
                errorMessage = 'Authentication failed. Please log in again.';
                break;
              case 403:
                errorMessage = 'You do not have permission to upload documents.';
                break;
              case 413:
                errorMessage = 'File size is too large. Please select a smaller file.';
                break;
              case 415:
                errorMessage = 'Unsupported file type. Please select PDF, JPG, or PNG files.';
                break;
              case 500:
                errorMessage = 'Server error (500). The upload endpoint may not be implemented yet. Please contact support or check if the backend API is running correctly.';
                break;
              default:
                errorMessage = `Upload failed (${err.status}). Please try again.`;
            }
          }
        } catch (safeError) {
          console.error('Error while processing error response:', safeError);
          errorMessage = 'An unexpected error occurred during upload.';
        }

        this.uploadError = errorMessage;
      }
    });
  }

  testEndpoint(): void {
    console.log('Testing document upload endpoint...');
    this.docs.getMyDocuments().subscribe({
      next: () => console.log('Document service is working'),
      error: (err) => console.log('Document service error:', err)
    });
  }
}
