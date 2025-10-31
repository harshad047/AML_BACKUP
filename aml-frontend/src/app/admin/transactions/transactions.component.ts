import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, TransactionDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class AdminTransactionsComponent implements OnInit {
  loading = false;
  error = '';
  transactions: TransactionDto[] = [];
  filteredTx: TransactionDto[] = [];
  status: '' | 'PENDING' | 'BLOCKED' | 'FLAGGED' | 'APPROVED' | 'REJECTED' = '';
  search = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getAdminTransactions(this.status || undefined).subscribe({
      next: (tx) => {
        this.transactions = tx;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  setStatus(s: '' | 'PENDING' | 'BLOCKED' | 'FLAGGED' | 'APPROVED' | 'REJECTED'): void {
    this.status = s;
    this.fetch();
  }

  applyFilter(): void {
    const q = this.search.trim().toLowerCase();
    if (!q) {
      this.filteredTx = [...this.transactions];
      return;
    }
    this.filteredTx = this.transactions.filter(t =>
      t.transactionType?.toLowerCase().includes(q) ||
      t.fromAccountNumber?.toLowerCase().includes(q) ||
      t.toAccountNumber?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    );
  }
}
