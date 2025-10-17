import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService, ApiResponse } from './auth.service';

export interface DocumentDto {
  id: number;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getMyDocuments(): Observable<ApiResponse<DocumentDto[]>> {
    return this.http.get<ApiResponse<DocumentDto[]>>(
      `${this.API_URL}/documents/my`,
      { headers: this.auth.getAuthHeaders() }
    );
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/documents/${id}`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Some backends expose explicit /download endpoint
  downloadDocumentLegacy(id: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/documents/${id}/download`, {
      headers: this.auth.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Build direct URLs for opening in a new tab/window
  getDocumentUrl(id: number): string {
    return `${this.API_URL}/documents/${id}`;
  }

  getDocumentLegacyUrl(id: number): string {
    return `${this.API_URL}/documents/${id}/download`;
  }
}
