import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, UserDto, AdminCustomerDetailsDto } from '../../core/services/admin.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class AdminCustomersComponent implements OnInit {
  loading = false;
  error = '';
  customers: UserDto[] = [];
  searchTerm = '';
  viewMode: 'grid' | 'table' = (localStorage.getItem('adminCustomersView') as 'grid' | 'table') || 'grid';

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.adminService.getActiveCustomers().subscribe({
      next: users => {
        this.customers = users;
        // Enrich every user with details to ensure full name/email are shown
        if (users.length) {
          forkJoin(users.map(u => this.adminService.getCustomerDetails(u.id))).subscribe({
            next: (detailsList: AdminCustomerDetailsDto[]) => {
              const byId = new Map(detailsList.map(d => [d.userId, d]));
              this.customers = this.customers.map(u => {
                const d = byId.get(u.id);
                return d ? { ...u, firstName: d.firstName, lastName: d.lastName, email: d.email } : u;
              });
              this.loading = false;
            },
            error: _ => {
              // Even if enrichment fails, show base list
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load customers';
        this.loading = false;
      }
    });
  }

  view(user: UserDto): void {
    this.router.navigate(['/admin/users', user.id, 'details']);
  }

  filtered(): UserDto[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.customers;
    return this.customers.filter(c =>
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q)
    );
  }

  setView(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
    localStorage.setItem('adminCustomersView', mode);
  }
}
