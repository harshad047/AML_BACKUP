import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService, UserDto, CreateUserDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-compliance-officers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './compliance-officers.component.html',
  styleUrls: ['./compliance-officers.component.css']
})
export class ComplianceOfficersComponent implements OnInit {
  officers: UserDto[] = [];
  filteredOfficers: UserDto[] = [];
  paginatedOfficers: UserDto[] = [];
  
  allUsers: UserDto[] = [];
  filteredUsers: UserDto[] = [];
  paginatedUsers: UserDto[] = [];
  
  loading = false;
  error = '';
  success = '';
  
  // Search and pagination for officers
  searchTermOfficers = '';
  currentPageOfficers = 1;
  pageSizeOfficers = 5;
  totalPagesOfficers = 1;
  sortColumnOfficers = '';
  sortDirectionOfficers: 'asc' | 'desc' = 'asc';
  
  // Search and pagination for users
  searchTermUsers = '';
  currentPageUsers = 1;
  pageSizeUsers = 5;
  totalPagesUsers = 1;
  sortColumnUsers = '';
  sortDirectionUsers: 'asc' | 'desc' = 'asc';
  
  Math = Math;
  
  showCreateForm = false;
  officerForm: FormGroup;
  creatingOfficer = false;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.officerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadOfficers();
    this.loadAllUsers();
  }

  loadOfficers(): void {
    this.loading = true;
    this.adminService.getComplianceOfficers().subscribe({
      next: (officers) => {
        this.officers = officers;
        this.filteredOfficers = [...officers];
        this.updateOfficersPagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load officers';
        this.loading = false;
      }
    });
  }

  loadAllUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users.filter(u => u.role !== 'OFFICER');
        this.filteredUsers = [...this.allUsers];
        this.updateUsersPagination();
      },
      error: () => {}
    });
  }

  // Officers table methods
  filterOfficers(): void {
    if (!this.searchTermOfficers.trim()) {
      this.filteredOfficers = [...this.officers];
    } else {
      const term = this.searchTermOfficers.toLowerCase();
      this.filteredOfficers = this.officers.filter(officer =>
        officer.username?.toLowerCase().includes(term) ||
        officer.id?.toString().includes(term) ||
        officer.role?.toLowerCase().includes(term)
      );
    }
    this.currentPageOfficers = 1;
    this.updateOfficersPagination();
  }

  sortOfficersBy(column: string): void {
    if (this.sortColumnOfficers === column) {
      this.sortDirectionOfficers = this.sortDirectionOfficers === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumnOfficers = column;
      this.sortDirectionOfficers = 'asc';
    }

    this.filteredOfficers.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirectionOfficers === 'asc' ? comparison : -comparison;
    });

    this.updateOfficersPagination();
  }

  updateOfficersPagination(): void {
    this.totalPagesOfficers = Math.ceil(this.filteredOfficers.length / this.pageSizeOfficers);
    if (this.currentPageOfficers > this.totalPagesOfficers) {
      this.currentPageOfficers = Math.max(1, this.totalPagesOfficers);
    }
    const startIndex = (this.currentPageOfficers - 1) * this.pageSizeOfficers;
    const endIndex = startIndex + this.pageSizeOfficers;
    this.paginatedOfficers = this.filteredOfficers.slice(startIndex, endIndex);
  }

  goToOfficersPage(page: number): void {
    if (page >= 1 && page <= this.totalPagesOfficers) {
      this.currentPageOfficers = page;
      this.updateOfficersPagination();
    }
  }

  onOfficersPageSizeChange(): void {
    this.currentPageOfficers = 1;
    this.updateOfficersPagination();
  }

  getOfficersPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 3;
    if (this.totalPagesOfficers <= maxVisible) {
      for (let i = 1; i <= this.totalPagesOfficers; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPageOfficers - 1);
      const end = Math.min(this.totalPagesOfficers, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  // Users table methods
  filterUsers(): void {
    if (!this.searchTermUsers.trim()) {
      this.filteredUsers = [...this.allUsers];
    } else {
      const term = this.searchTermUsers.toLowerCase();
      this.filteredUsers = this.allUsers.filter(user =>
        user.username?.toLowerCase().includes(term) ||
        user.id?.toString().includes(term) ||
        user.role?.toLowerCase().includes(term)
      );
    }
    this.currentPageUsers = 1;
    this.updateUsersPagination();
  }

  sortUsersBy(column: string): void {
    if (this.sortColumnUsers === column) {
      this.sortDirectionUsers = this.sortDirectionUsers === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumnUsers = column;
      this.sortDirectionUsers = 'asc';
    }

    this.filteredUsers.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirectionUsers === 'asc' ? comparison : -comparison;
    });

    this.updateUsersPagination();
  }

  updateUsersPagination(): void {
    this.totalPagesUsers = Math.ceil(this.filteredUsers.length / this.pageSizeUsers);
    if (this.currentPageUsers > this.totalPagesUsers) {
      this.currentPageUsers = Math.max(1, this.totalPagesUsers);
    }
    const startIndex = (this.currentPageUsers - 1) * this.pageSizeUsers;
    const endIndex = startIndex + this.pageSizeUsers;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToUsersPage(page: number): void {
    if (page >= 1 && page <= this.totalPagesUsers) {
      this.currentPageUsers = page;
      this.updateUsersPagination();
    }
  }

  onUsersPageSizeChange(): void {
    this.currentPageUsers = 1;
    this.updateUsersPagination();
  }

  getUsersPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 3;
    if (this.totalPagesUsers <= maxVisible) {
      for (let i = 1; i <= this.totalPagesUsers; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPageUsers - 1);
      const end = Math.min(this.totalPagesUsers, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.officerForm.reset();
    }
  }

  onCreateOfficer(): void {
    if (this.officerForm.invalid) return;

    this.creatingOfficer = true;
    const createDto: CreateUserDto = {
      ...this.officerForm.value,
      role: 'OFFICER'
    };

    this.adminService.createComplianceOfficer(createDto).subscribe({
      next: () => {
        this.success = 'Compliance officer created successfully';
        this.creatingOfficer = false;
        this.officerForm.reset();
        this.showCreateForm = false;
        this.loadOfficers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create officer';
        this.creatingOfficer = false;
      }
    });
  }

  promoteToOfficer(user: UserDto): void {
    if (!confirm(`Promote ${user.username} to Compliance Officer?`)) return;

    this.adminService.addComplianceOfficer(user.id).subscribe({
      next: () => {
        this.success = `${user.username} promoted to Compliance Officer`;
        this.loadOfficers();
        this.loadAllUsers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to promote user';
      }
    });
  }

  removeOfficer(officer: UserDto): void {
    if (!confirm(`Remove ${officer.username} from Compliance Officers?`)) return;

    this.adminService.removeComplianceOfficer(officer.id).subscribe({
      next: () => {
        this.success = `${officer.username} removed from Compliance Officers`;
        this.loadOfficers();
        this.loadAllUsers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to remove officer';
      }
    });
  }
}
