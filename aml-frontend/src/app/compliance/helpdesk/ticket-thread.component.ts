import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HelpdeskApiService } from '../../core/services/helpdesk.service';
import { HelpdeskMessageDto, HelpdeskTicketDto, PageResponse } from '../../core/models/helpdesk.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-officer-ticket-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ticket-thread.component.html',
  styleUrls: ['./ticket-thread.component.css']
})
export class OfficerTicketThreadComponent {
  ticketId!: number;
  ticket?: HelpdeskTicketDto;
  messages: HelpdeskMessageDto[] = [];
  pageIndex = 0;
  pageSize = 20;
  total = 0;
  loading = false;
  error = '';
  reply = '';
  Math = Math;

  constructor(private route: ActivatedRoute, private api: HelpdeskApiService) {
    this.ticketId = Number(this.route.snapshot.paramMap.get('ticketId'));
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.error = '';
    this.api.getMessages(this.ticketId, this.pageIndex, this.pageSize).subscribe({
      next: (res: PageResponse<HelpdeskMessageDto>) => {
        this.loading = false;
        this.messages = res.content;
        this.total = res.totalElements;
        this.pageIndex = res.number;
        this.pageSize = res.size;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load messages';
      }
    });
  }

  respond(): void {
    const response = (this.reply || '').trim();
    if (!response) return;
    this.api.respond(this.ticketId, { response }).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.reply = '';
        this.loadMessages();
      },
      error: err => alert(err?.error?.message || 'Failed to respond')
    });
  }

  resolve(): void {
    if (!confirm('Mark this ticket as resolved?')) return;
    this.api.resolve(this.ticketId).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.loadMessages();
      },
      error: err => alert(err?.error?.message || 'Failed to resolve ticket')
    });
  }

  isTicketResolved(): boolean {
    return this.ticket?.status === 'RESOLVED' || this.ticket?.status === 'CLOSED';
  }

  onPageChange(delta: number): void {
    const next = this.pageIndex + delta;
    if (next < 0) return;
    if ((next) * this.pageSize >= this.total) return;
    this.pageIndex = next;
    this.loadMessages();
  }
}
