import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HelpdeskApiService } from '../../../core/services/helpdesk.service';
import { ToastService } from '../../../core/services/toast.service';
import { HelpdeskMessageDto, HelpdeskTicketDto, PageResponse } from '../../../shared/models/helpdesk.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-customer-ticket-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ticket-thread.component.html',
  styleUrls: ['./ticket-thread.component.css']
})
export class CustomerTicketThreadComponent {
  ticketId!: number;
  ticket?: HelpdeskTicketDto;
  messages: HelpdeskMessageDto[] = [];
  pageIndex = 0;
  pageSize = 20;
  total = 0;
  loading = false;
  error = '';
  newMessage = '';
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private api: HelpdeskApiService,
    private toastService: ToastService
  ) {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicketDetails();
    this.loadMessages();
  }

  loadTicketDetails(): void {
    // Load ticket from my tickets list and find the matching one
    this.api.getMyTickets(0, 100).subscribe({
      next: (response) => {
        this.ticket = response.content.find(t => t.id === this.ticketId);
        if (!this.ticket) {
          this.error = 'Ticket not found';
        }
      },
      error: (err) => {
        // If we can't load ticket details, continue anyway
        console.error('Failed to load ticket details:', err);
      }
    });
  }

  isTicketResolved(): boolean {
    return this.ticket?.status === 'RESOLVED';
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

  send(): void {
    const content = (this.newMessage || '').trim();
    if (!content) return;
    this.api.addMessage(this.ticketId, { content }).subscribe({
      next: _ => {
        this.newMessage = '';
        this.toastService.success('Message sent successfully!', 4000);
        this.loadMessages();
      },
      error: err => this.toastService.error(err?.error?.message || 'Failed to send message')
    });
  }

  onPageChange(delta: number): void {
    const next = this.pageIndex + delta;
    if (next < 0) return;
    if ((next) * this.pageSize >= this.total) return;
    this.pageIndex = next;
    this.loadMessages();
  }
}
