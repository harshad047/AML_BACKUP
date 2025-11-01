import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { AdminService, SuspiciousKeywordDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-keywords',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.css']
})
export class KeywordsComponent implements OnInit {
  keywords: SuspiciousKeywordDto[] = [];
  filteredKeywords: SuspiciousKeywordDto[] = [];
  paginatedKeywords: SuspiciousKeywordDto[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Search and pagination
  searchTerm = '';
  riskLevelFilter = 'ALL';
  statusFilter = 'ALL';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  
  showCreateForm = false;
  keywordForm: FormGroup;
  savingKeyword = false;
  editingKeyword: SuspiciousKeywordDto | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.keywordForm = this.fb.group({
      keyword: ['', [Validators.required, Validators.maxLength(255)]],
      riskLevel: ['MEDIUM', Validators.required],
      riskScore: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      category: [''],
      description: [''],
      active: [true],
      caseSensitive: [false],
      wholeWordOnly: [true]
    });
  }

  ngOnInit(): void {
    this.loadKeywords();
  }

  loadKeywords(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllKeywords().subscribe({
      next: (keywords) => {
        this.keywords = keywords;
        this.filteredKeywords = [...keywords];
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load keywords';
        this.loading = false;
      }
    });
  }

  filterKeywords(): void {
    let filtered = [...this.keywords];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(keyword =>
        keyword.keyword?.toLowerCase().includes(term) ||
        keyword.category?.toLowerCase().includes(term) ||
        keyword.riskLevel?.toLowerCase().includes(term) ||
        keyword.id?.toString().includes(term)
      );
    }
    
    // Apply risk level filter
    if (this.riskLevelFilter !== 'ALL') {
      filtered = filtered.filter(k => k.riskLevel === this.riskLevelFilter);
    }
    
    // Apply status filter
    if (this.statusFilter !== 'ALL') {
      if (this.statusFilter === 'ACTIVE') {
        filtered = filtered.filter(k => k.active);
      } else if (this.statusFilter === 'INACTIVE') {
        filtered = filtered.filter(k => !k.active);
      }
    }
    
    this.filteredKeywords = filtered;
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

    this.filteredKeywords.sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredKeywords.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedKeywords = this.filteredKeywords.slice(startIndex, endIndex);
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

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingKeyword = null;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.keywordForm.reset({
      riskLevel: 'MEDIUM',
      riskScore: 50,
      active: true,
      caseSensitive: false,
      wholeWordOnly: true
    });
  }

  editKeyword(keyword: SuspiciousKeywordDto): void {
    this.editingKeyword = keyword;
    this.showCreateForm = true;
    
    this.keywordForm.patchValue({
      keyword: keyword.keyword,
      riskLevel: keyword.riskLevel,
      riskScore: keyword.riskScore,
      category: keyword.category,
      description: keyword.description,
      active: keyword.active,
      caseSensitive: keyword.caseSensitive,
      wholeWordOnly: keyword.wholeWordOnly
    });
  }

  onSaveKeyword(): void {
    if (this.keywordForm.invalid) return;

    this.savingKeyword = true;
    this.error = '';
    this.success = '';

    const keywordDto: SuspiciousKeywordDto = this.keywordForm.value;

    const request = this.editingKeyword
      ? this.adminService.updateKeyword(this.editingKeyword.id!, keywordDto)
      : this.adminService.addKeyword(keywordDto);

    request.subscribe({
      next: (keyword) => {
        this.success = `Keyword "${keyword.keyword}" ${this.editingKeyword ? 'updated' : 'added'} successfully!`;
        this.savingKeyword = false;
        this.resetForm();
        this.showCreateForm = false;
        this.editingKeyword = null;
        this.loadKeywords();
      },
      error: (err) => {
        this.error = err.error?.message || `Failed to ${this.editingKeyword ? 'update' : 'add'} keyword`;
        this.savingKeyword = false;
      }
    });
  }

  deleteKeyword(keyword: SuspiciousKeywordDto): void {
    if (!confirm(`Are you sure you want to delete keyword "${keyword.keyword}"?`)) return;

    this.adminService.deleteKeyword(keyword.id!).subscribe({
      next: () => {
        this.success = `Keyword "${keyword.keyword}" deleted successfully`;
        this.loadKeywords();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete keyword';
      }
    });
  }

  getRiskLevelBadgeClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-danger';
      case 'HIGH': return 'bg-warning';
      case 'MEDIUM': return 'bg-info';
      case 'LOW': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  onRiskLevelChange(): void {
    const riskLevel = this.keywordForm.get('riskLevel')?.value;
    let riskScore = 50;
    
    switch (riskLevel) {
      case 'CRITICAL': riskScore = 90; break;
      case 'HIGH': riskScore = 70; break;
      case 'MEDIUM': riskScore = 50; break;
      case 'LOW': riskScore = 30; break;
    }
    
    this.keywordForm.patchValue({ riskScore });
  }
  
  // Stats Methods
  getCriticalCount(): number {
    return this.keywords.filter(k => k.riskLevel === 'CRITICAL').length;
  }
  
  getHighCount(): number {
    return this.keywords.filter(k => k.riskLevel === 'HIGH').length;
  }
  
  getActiveCount(): number {
    return this.keywords.filter(k => k.active).length;
  }
  
  getTotalCount(): number {
    return this.keywords.length;
  }
}
