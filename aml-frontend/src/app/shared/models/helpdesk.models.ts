export interface HelpdeskTicketDto {
  id: number;
  transactionId: number;
  customerId: number;
  assignedOfficerId?: number;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESPONDED' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
  updatedAt: string;
}

export interface HelpdeskMessageDto {
  id: number;
  ticketId: number;
  authorId: number;
  senderType: 'CUSTOMER' | 'OFFICER' | string;
  content: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
}
