import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentDto } from '../../../core/models/document.models';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UploadRestrictionModalComponent } from './upload-restriction-modal.component';
import { DocumentPreviewModalComponent } from './document-preview-modal.component';

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
  imports: [CommonModule, DatePipe, ReactiveFormsModule, UploadRestrictionModalComponent, DocumentPreviewModalComponent],
  templateUrl: './customer-documents.component.html',
  styleUrls: ['./customer-documents.component.css'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
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
  isDragOver = false;
  isUploadFormExpanded = false;
  
  // Modal properties
  showRestrictionModal = false;
  modalDocumentType = '';
  modalStatus = '';
  modalRestrictionType: 'verified' | 'review' | 'restricted' = 'review';
  
  // Document preview modal properties
  showPreviewModal = false;
  previewDocument: DocumentWithStatus | null = null;

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

  // Status count methods for tiles
  getTotalDocumentsCount(): number {
    return this.documents.length;
  }

  getPendingDocumentsCount(): number {
    return this.documents.filter(d => {
      const status = this.getStatus(d).toUpperCase();
      return status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'IN_REVIEW' || status === 'UPLOADED';
    }).length;
  }

  getVerifiedDocumentsCount(): number {
    return this.documents.filter(d => this.isVerified(d)).length;
  }

  getRejectedDocumentsCount(): number {
    return this.documents.filter(d => this.isRejected(d)).length;
  }

  viewDocument(doc: DocumentWithStatus): void {
    console.log('Viewing document with ID:', doc.id);
    this.previewDocument = doc;
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewDocument = null;
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
      this.validateAndSetFile(file);
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

  // Toggle upload form visibility
  toggleUploadForm(): void {
    if (this.isUploadDisabled()) {
      this.showUploadDisabledAlert();
      return;
    }
    this.isUploadFormExpanded = !this.isUploadFormExpanded;
  }

  showUploadDisabledAlert(): void {
    // Find the blocking document to get details
    const blockingDoc = this.documents.find(doc => {
      const status = this.getStatus(doc).toUpperCase();
      return status === 'UPLOADED' || 
             status === 'PENDING' || 
             status === 'VERIFIED' || 
             status === 'UNDER_REVIEW' || 
             status === 'IN_REVIEW' ||
             status === 'APPROVED' ||
             status === 'COMPLETED';
    });

    if (blockingDoc) {
      const status = this.getStatus(blockingDoc);
      this.modalDocumentType = this.getDocumentType(blockingDoc);
      this.modalStatus = status;
      
      // Determine restriction type
      if (status.toUpperCase() === 'VERIFIED' || status.toUpperCase() === 'APPROVED' || status.toUpperCase() === 'COMPLETED') {
        this.modalRestrictionType = 'verified';
      } else {
        this.modalRestrictionType = 'review';
      }
    } else {
      this.modalDocumentType = '';
      this.modalStatus = '';
      this.modalRestrictionType = 'restricted';
    }

    this.showRestrictionModal = true;
  }

  closeRestrictionModal(): void {
    this.showRestrictionModal = false;
  }

  // Drag and Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File): void {
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
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFileName = '';
    this.selectedFile = null;
    this.uploadError = '';
  }

  getFileIcon(): string {
    if (!this.selectedFileName) return 'fa-file';
    
    const extension = this.selectedFileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'fa-file-image';
      default:
        return 'fa-file';
    }
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    
    const bytes = this.selectedFile.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Upload restriction logic
  isUploadDisabled(): boolean {
    // Allow upload if no documents exist
    if (this.documents.length === 0) {
      return false;
    }

    // Check if any document has status: UPLOADED, PENDING, or VERIFIED
    const hasActiveDocument = this.documents.some(doc => {
      const status = this.getStatus(doc).toUpperCase();
      return status === 'UPLOADED' || 
             status === 'PENDING' || 
             status === 'VERIFIED' || 
             status === 'UNDER_REVIEW' || 
             status === 'IN_REVIEW' ||
             status === 'APPROVED' ||
             status === 'COMPLETED';
    });

    // Disable upload if there's any active document
    return hasActiveDocument;
  }

  getUploadRestrictionMessage(): string {
    if (!this.isUploadDisabled()) {
      return '';
    }

    // Find the document that's blocking upload
    const blockingDoc = this.documents.find(doc => {
      const status = this.getStatus(doc).toUpperCase();
      return status === 'UPLOADED' || 
             status === 'PENDING' || 
             status === 'VERIFIED' || 
             status === 'UNDER_REVIEW' || 
             status === 'IN_REVIEW' ||
             status === 'APPROVED' ||
             status === 'COMPLETED';
    });

    if (blockingDoc) {
      const status = this.getStatus(blockingDoc);
      const docType = this.getDocumentType(blockingDoc);
      
      if (status.toUpperCase() === 'VERIFIED' || status.toUpperCase() === 'APPROVED' || status.toUpperCase() === 'COMPLETED') {
        return `🔒 Document Already Verified\n\nYour ${docType} document has been successfully verified.\n\nYou cannot upload new documents at this time.\n\nIf you need to update your documents, please contact support.`;
      } else {
        return `⏳ Document Under Review\n\nYour ${docType} document is currently being reviewed (Status: ${status}).\n\nPlease wait for the review to complete before uploading new documents.\n\nYou will be able to upload a new document only if this one is rejected.`;
      }
    }

    return '🚫 Upload Restricted\n\nDocument upload is currently not available.\n\nPlease contact support for assistance.';
  }
}
