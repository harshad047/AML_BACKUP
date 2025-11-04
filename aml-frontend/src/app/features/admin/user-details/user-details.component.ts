import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, AdminCustomerDetailsDto } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class AdminUserDetailsComponent implements OnInit {
  loading = false;
  error = '';
  details?: AdminCustomerDetailsDto;
  private origin: 'users' | 'customers' = 'customers';

  constructor(private route: ActivatedRoute, private router: Router, private adminService: AdminService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'users' || from === 'customers') {
      this.origin = from;
    }
    if (!id) {
      this.error = 'Invalid user id';
      return;
    }
    this.fetch(id);
  }

  fetch(userId: number): void {
    this.loading = true;
    this.adminService.getCustomerDetails(userId).subscribe({
      next: d => {
        this.details = d;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load user details';
        this.loading = false;
      }
    });
  }

  back(): void {
    if (this.origin === 'users') {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/admin/customers']);
    }
  }

  activateAccount(accountId: number): void {
    if (!this.details) return;
    this.adminService.activateAccount(accountId).subscribe({
      next: _ => this.fetch(this.details!.userId),
      error: err => this.error = err.error?.message || 'Failed to activate account'
    });
  }

  suspendAccount(accountId: number): void {
    if (!this.details) return;
    this.adminService.suspendAccount(accountId).subscribe({
      next: _ => this.fetch(this.details!.userId),
      error: err => this.error = err.error?.message || 'Failed to suspend account'
    });
  }
}
