import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService, UserDto, CreateUserDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserDto[] = [];
  blockedUsers: UserDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  showCreateForm = false;
  createUserForm: FormGroup;
  creatingUser = false;
  
  showBlockModal = false;
  selectedUser: UserDto | null = null;
  blockReason = '';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
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
    this.loadUsers();
    this.loadBlockedUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  loadBlockedUsers(): void {
    this.adminService.getBlockedCustomers().subscribe({
      next: (users) => {
        this.blockedUsers = users;
      },
      error: (err) => {
        console.error('Error loading blocked users:', err);
      }
    });
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
        this.loadUsers();
        this.loadBlockedUsers();
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
