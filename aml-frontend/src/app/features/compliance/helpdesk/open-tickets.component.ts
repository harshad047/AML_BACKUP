import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpdeskApiService } from '../../../core/services/helpdesk.service';
import { HelpdeskTicketDto, PageResponse } from '../../../core/models/helpdesk.models';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-open-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './open-tickets.component.html',
  styleUrls: ['./open-tickets.component.css']
})
export class OpenTicketsComponent {
  pageIndex = 0;
  pageSize = 10;
  total = 0;
  statusFilter = 'ALL';
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
    this.api.getOpenTickets(this.pageIndex, this.pageSize).subscribe({
      next: (res: PageResponse<HelpdeskTicketDto>) => {
        this.loading = false;
        this.tickets = res.content;
        this.total = res.totalElements;
        this.pageIndex = res.number;
        this.pageSize = res.size;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load open tickets';
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

  getRespondedCount(): number {
    return this.tickets.filter(t => t.status === 'RESPONDED').length;
  }

  getResolvedCount(): number {
    return this.tickets.filter(t => t.status === 'RESOLVED').length;
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  get filteredTickets(): HelpdeskTicketDto[] {
    if (!this.statusFilter || this.statusFilter === 'ALL') {
      return this.tickets;
    }
    return this.tickets.filter(t => t.status === this.statusFilter);
  }
}

