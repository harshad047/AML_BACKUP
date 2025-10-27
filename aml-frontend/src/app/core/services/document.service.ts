import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  uploadDocument(file: File, documentType: string): Observable<ApiResponse<DocumentDto>> {
    const formData = new FormData();
    // Add the file with key 'file'
    formData.append('file', file);
    // Add the document type as text with key 'docType'
    formData.append('docType', documentType);

    console.log('Uploading document:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      documentType: documentType,
      formDataKeys: ['file', 'docType'],
      url: `${this.API_URL}/documents/upload`
    });

    return this.http.post<ApiResponse<DocumentDto>>(
      `${this.API_URL}/documents/upload`,
      formData,
      {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.auth.getToken()}`
          // Explicitly NOT setting Content-Type - let browser set multipart boundary
        })
      }
    );
  }
}
