import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, UserDto, AdminCustomerDetailsDto } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
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
  
  // Modal properties
  showDetailsModal = false;
  selectedCustomer: UserDto | null = null;
  customerDetails: AdminCustomerDetailsDto | null = null;
  loadingDetails = false;

  constructor(
    private adminService: AdminService, 
    private router: Router,
    private toastService: ToastService
  ) {}

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
        this.toastService.error(err.error?.message || 'Failed to load customers');
        this.loading = false;
      }
    });
  }

  view(user: UserDto): void {
    this.selectedCustomer = user;
    this.showDetailsModal = true;
    this.loadCustomerDetails(user.id);
  }

  loadCustomerDetails(userId: number): void {
    this.loadingDetails = true;
    this.adminService.getCustomerDetails(userId).subscribe({
      next: (details) => {
        this.customerDetails = details;
        this.loadingDetails = false;
      },
      error: (err) => {
        this.toastService.error('Failed to load customer details');
        this.loadingDetails = false;
      }
    });
  }

  closeModal(): void {
    this.showDetailsModal = false;
    this.selectedCustomer = null;
    this.customerDetails = null;
  }

  viewFullProfile(): void {
    if (this.selectedCustomer) {
      this.router.navigate(['/admin/users', this.selectedCustomer.id, 'details']);
      this.closeModal();
    }
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
