// Document Service Models

export interface DocumentDto {
  id: number;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  status?: string;
}
