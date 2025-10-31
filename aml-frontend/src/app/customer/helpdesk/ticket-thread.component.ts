import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HelpdeskApiService } from '../../core/services/helpdesk.service';
import { HelpdeskMessageDto, HelpdeskTicketDto, PageResponse } from '../../core/models/helpdesk.models';
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

  send(): void {
    const content = (this.newMessage || '').trim();
    if (!content) return;
    this.api.addMessage(this.ticketId, { content }).subscribe({
      next: _ => {
        this.newMessage = '';
        this.loadMessages();
      },
      error: err => alert(err?.error?.message || 'Failed to send')
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
