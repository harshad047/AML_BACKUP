import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, UserDto, CreateUserDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-compliance-officers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compliance-officers.component.html',
  styleUrls: ['./compliance-officers.component.css']
})
export class ComplianceOfficersComponent implements OnInit {
  officers: UserDto[] = [];
  allUsers: UserDto[] = [];
  loading = false;
  error = '';
  success = '';
  
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
      },
      error: () => {}
    });
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
