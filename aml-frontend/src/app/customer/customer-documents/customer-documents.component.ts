import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DocumentService, DocumentDto } from '../../core/services/document.service';

@Component({
  selector: 'app-customer-documents',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="container py-3">
      <h3 class="mb-3">My Documents</h3>
      <div class="alert alert-info">Your KYC documents are under review.</div>

      <div class="card">
        <div class="card-body p-0">
          <div class="text-center text-muted py-4" *ngIf="loading">Loading...</div>
          <div class="text-danger p-3" *ngIf="error">{{ error }}</div>
          <div class="table-responsive" *ngIf="!loading && documents.length > 0">
            <table class="table table-striped mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of documents; index as i">
                  <td>{{ i + 1 }}</td>
                  <td>{{ typeOf(d) }}</td>
                  <td>{{ fileNameOf(d) }}</td>
                  <td><span class="badge bg-secondary">{{ d.status || 'PENDING' }}</span></td>
                  <td>{{ uploadedAtOf(d) | date:'short' }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" (click)="download(d)">
                      <i class="fas fa-download me-1"></i>Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-center text-muted py-4" *ngIf="!loading && documents.length === 0">
            No documents found.
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerDocumentsComponent implements OnInit {
  documents: DocumentDto[] = [];
  loading = false;
  error = '';

  constructor(private docs: DocumentService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.docs.getMyDocuments().subscribe({
      next: (resp) => {
        this.loading = false;
        this.documents = ((resp as any)?.data ?? (resp as any) ?? []) as DocumentDto[];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load documents';
        this.documents = [];
      }
    });
  }

  download(d: DocumentDto): void {
    const link = this.linkOf(d);
    if (!link) {
      this.error = 'No download link available for this document';
      return;
    }
    window.open(link, '_blank');
  }

  private saveBlob(blob: Blob, d: DocumentDto): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = d.fileName || (d as any).filename || (d as any).originalFileName || (d as any).name || `document-${d.id}`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  typeOf(d: any): string {
    return d?.documentType ?? d?.type ?? d?.docType ?? '-';
  }

  fileNameOf(d: any): string {
    return d?.fileName ?? d?.filename ?? d?.originalFileName ?? d?.name ?? `document-${d?.id ?? ''}`;
  }

  uploadedAtOf(d: any): any {
    return d?.uploadedAt ?? d?.createdAt ?? d?.uploadedDate ?? null;
  }

  private linkOf(d: any): string | null {
    const candidates = [
      d?.storagePath,
      d?.url,
      d?.fileUrl,
      d?.cloudinaryUrl,
      d?.secureUrl,
      d?.secure_url,
      d?.downloadUrl,
      d?.link
    ];
    const found = candidates.find((x: any) => typeof x === 'string' && !!x);
    return found || null;
  }
}
