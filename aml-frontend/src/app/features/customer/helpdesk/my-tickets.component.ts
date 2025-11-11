import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpdeskApiService } from '../../../core/services/helpdesk.service';
import { HelpdeskTicketDto, PageResponse } from '../../../core/models/helpdesk.models';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.css']
})
export class MyTicketsComponent {
  pageIndex = 0;
  pageSize = 10;
  total = 0;
  statusFilter: string = '';
  loading = false;
  error = '';
  tickets: HelpdeskTicketDto[] = [];
  Math = Math;

  constructor(private api: HelpdeskApiService) {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    const status = this.statusFilter || undefined;
    this.api.getMyTickets(this.pageIndex, this.pageSize, status).subscribe({
      next: (res: PageResponse<HelpdeskTicketDto>) => {
        this.loading = false;
        this.tickets = res.content;
        this.total = res.totalElements;
        this.pageIndex = res.number;
        this.pageSize = res.size;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load tickets';
        this.tickets = [];
      }
    });
  }

  onPageChange(delta: number): void {
    const next = this.pageIndex + delta;
    if (next < 0) return;
    if ((next) * this.pageSize >= this.total) return;
    this.pageIndex = next;
    this.load();
  }
}
