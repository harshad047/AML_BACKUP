import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserDto, CreateUserDto } from '../../../core/models/admin.models';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserDto[] = [];
  filteredUsers: UserDto[] = [];
  paginatedUsers: UserDto[] = [];
  blockedUsers: UserDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Search and pagination
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  
  showCreateForm = false;
  createUserForm: FormGroup;
  creatingUser = false;
  
  showBlockModal = false;
  selectedUser: UserDto | null = null;
  blockReason = '';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.createUserForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['CUSTOMER', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      users: this.adminService.getAllUsers(),
      blocked: this.adminService.getBlockedCustomers()
    }).subscribe({
      next: ({ users, blocked }) => {
        this.users = users;
        this.blockedUsers = blocked;
        this.filteredUsers = [...users];
        this.applyBlockedStatus();
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        // Set filtered snapshot first, then apply blocked status to both arrays
        this.filteredUsers = [...users];
        this.applyBlockedStatus();
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.username?.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term) ||
        user.id?.toString().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredUsers.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  loadBlockedUsers(): void {
    this.adminService.getBlockedCustomers().subscribe({
      next: (users) => {
        this.blockedUsers = users;
        this.applyBlockedStatus();
      },
      error: (err) => {
        console.error('Error loading blocked users:', err);
      }
    });
  }

  private applyBlockedStatus(): void {
    if (!this.users || !this.blockedUsers) return;
    const blockedIds = new Set(this.blockedUsers.map(u => u.id));
    this.users = this.users.map(u => ({ ...u, blocked: blockedIds.has(u.id) }));
    this.filteredUsers = this.filteredUsers.map(u => ({ ...u, blocked: blockedIds.has(u.id) }));
    this.updatePagination();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createUserForm.reset({ role: 'CUSTOMER' });
    }
  }

  onCreateUser(): void {
    if (this.createUserForm.invalid) return;

    this.creatingUser = true;
    this.error = '';
    this.success = '';

    const createUserDto: CreateUserDto = this.createUserForm.value;

    this.adminService.createUser(createUserDto).subscribe({
      next: (user) => {
        this.success = `User ${user.username} created successfully!`;
        this.creatingUser = false;
        this.createUserForm.reset({ role: 'CUSTOMER' });
        this.showCreateForm = false;
        this.loadUsers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user';
        this.creatingUser = false;
      }
    });
  }

  openBlockModal(user: UserDto): void {
    this.selectedUser = user;
    this.blockReason = '';
    this.showBlockModal = true;
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
    this.selectedUser = null;
    this.blockReason = '';
  }

  blockUser(): void {
    if (!this.selectedUser) return;

    this.adminService.blockCustomer(this.selectedUser.id, this.blockReason).subscribe({
      next: () => {
        this.success = `User ${this.selectedUser!.username} blocked successfully`;
        this.closeBlockModal();
        this.loadAll();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to block user';
      }
    });
  }

  unblockUser(user: UserDto): void {
    if (!confirm(`Are you sure you want to unblock ${user.username}?`)) return;

    this.adminService.unblockCustomer(user.id).subscribe({
      next: () => {
        this.success = `User ${user.username} unblocked successfully`;
        this.loadUsers();
        this.loadBlockedUsers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to unblock user';
      }
    });
  }

  activateUser(user: UserDto): void {
    if (!user.blocked) {
      this.error = 'User is already active';
      return;
    }
    this.unblockUser(user);
  }

  viewDetails(user: UserDto): void {
    this.router.navigate(['/admin/users', user.id, 'details'], { queryParams: { from: 'users' } });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-danger';
      case 'ADMIN': return 'bg-primary';
      case 'OFFICER': return 'bg-info';
      case 'CUSTOMER': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getRoleDisplay(role: string): string {
    return role.replace('_', ' ');
  }
}
