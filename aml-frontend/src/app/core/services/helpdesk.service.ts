import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HelpdeskMessageDto, HelpdeskTicketDto, PageResponse } from '../models/helpdesk.models';

@Injectable({ providedIn: 'root' })
export class HelpdeskApiService {
  private base = 'http://localhost:8080/api/helpdesk';
  constructor(private http: HttpClient) {}

  createTicket(transactionId: number, body: { subject: string; message: string }): Observable<HelpdeskTicketDto> {
    return this.http.post<HelpdeskTicketDto>(`${this.base}/transactions/${transactionId}/tickets`, body);
    }

  getMyTickets(page = 0, size = 10, status?: string): Observable<PageResponse<HelpdeskTicketDto>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<HelpdeskTicketDto>>(`${this.base}/tickets/my`, { params });
  }

  getTicketsForTransaction(transactionId: number): Observable<HelpdeskTicketDto[]> {
    return this.http.get<HelpdeskTicketDto[]>(`${this.base}/transactions/${transactionId}/tickets`);
  }

  getOpenTickets(page = 0, size = 10): Observable<PageResponse<HelpdeskTicketDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<HelpdeskTicketDto>>(`${this.base}/tickets/open`, { params });
  }

  respond(ticketId: number, body: { response: string }): Observable<HelpdeskTicketDto> {
    return this.http.post<HelpdeskTicketDto>(`${this.base}/tickets/${ticketId}/respond`, body);
  }

  resolve(ticketId: number): Observable<HelpdeskTicketDto> {
    return this.http.post<HelpdeskTicketDto>(`${this.base}/tickets/${ticketId}/resolve`, {});
  }

  addMessage(ticketId: number, body: { content: string }): Observable<HelpdeskMessageDto> {
    return this.http.post<HelpdeskMessageDto>(`${this.base}/tickets/${ticketId}/messages`, body);
  }

  getMessages(ticketId: number, page = 0, size = 20): Observable<PageResponse<HelpdeskMessageDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<HelpdeskMessageDto>>(`${this.base}/tickets/${ticketId}/messages`, { params });
  }

  getTicketById(ticketId: number): Observable<HelpdeskTicketDto> {
    return this.http.get<HelpdeskTicketDto>(`${this.base}/tickets/${ticketId}`);
  }
}
