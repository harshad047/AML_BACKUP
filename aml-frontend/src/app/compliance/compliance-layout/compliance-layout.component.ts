                                                        import { Component, OnInit } from '@angular/core';
                                                        import { CommonModule } from '@angular/common';
                                                        import { RouterModule, Router } from '@angular/router';
                                                        import { AuthService, User } from '../../core/services/auth.service';

                                                        @Component({
                                                          selector: 'app-compliance-layout',
                                                          standalone: true,
                                                          imports: [CommonModule, RouterModule],
                                                          template: `
                                                            <div class="d-flex">
                                                              <!-- Sidebar -->
                                                              <nav class="sidebar bg-dark text-white p-3" [class.collapsed]="sidebarCollapsed">
                                                                <div class="d-flex align-items-center mb-4">
                                                                  <i class="fas fa-shield-alt fa-2x me-2" *ngIf="!sidebarCollapsed"></i>
                                                                  <i class="fas fa-shield-alt fa-lg" *ngIf="sidebarCollapsed"></i>
                                                                  <h5 class="mb-0" *ngIf="!sidebarCollapsed">AML Compliance</h5>
                                                                </div>
                                                                
                                                                <button class="btn btn-outline-light btn-sm mb-3 w-100" 
                                                                        (click)="toggleSidebar()">
                                                                  <i class="fas" [class.fa-chevron-left]="!sidebarCollapsed" 
                                                                    [class.fa-chevron-right]="sidebarCollapsed"></i>
                                                                  <span *ngIf="!sidebarCollapsed" class="ms-2">Collapse</span>
                                                                </button>

                                                                <ul class="nav nav-pills flex-column">
                                                                  <li class="nav-item mb-2">
                                                                    <a class="nav-link" routerLink="/compliance" routerLinkActive="active" 
                                                                      [routerLinkActiveOptions]="{exact: true}">
                                                                      <i class="fas fa-tachometer-alt me-2"></i>
                                                                      <span *ngIf="!sidebarCollapsed">Dashboard</span>
                                                                    </a>
                                                                  </li>
                                                                  <li class="nav-item mb-2">
                                                                    <a class="nav-link" routerLink="/compliance/alerts" routerLinkActive="active">
                                                                      <i class="fas fa-exclamation-triangle me-2"></i>
                                                                      <span *ngIf="!sidebarCollapsed">Alert Management</span>
                                                                    </a>
                                                                  </li>
                                                                  <li class="nav-item mb-2">
                                                                    <a class="nav-link" routerLink="/compliance/transactions" routerLinkActive="active">
                                                                      <i class="fas fa-exchange-alt me-2"></i>
                                                                      <span *ngIf="!sidebarCollapsed">Transaction Review</span>
                                                                    </a>
                                                                  </li>
                                                                  <li class="nav-item mb-2">
                                                                    <a class="nav-link" routerLink="/compliance/cases" routerLinkActive="active">
                                                                      <i class="fas fa-folder-open me-2"></i>
                                                                      <span *ngIf="!sidebarCollapsed">Case Management</span>
                                                                    </a>
                                                                  </li>
                                                                </ul>

                                                                <hr class="my-4">

                                                                <!-- User Info -->
                                                                <div class="user-info" *ngIf="currentUser">
                                                                  <div class="d-flex align-items-center mb-2">
                                                                    <div class="avatar bg-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                                                        [style.width.px]="sidebarCollapsed ? 32 : 40"
                                                                        [style.height.px]="sidebarCollapsed ? 32 : 40">
                                                                      <i class="fas fa-user"></i>
                                                                    </div>
                                                                    <div *ngIf="!sidebarCollapsed">
                                                                      <div class="fw-bold small">{{ currentUser.firstName }} {{ currentUser.lastName }}</div>
                                                                      <div class="text-muted small">{{ currentUser.role }}</div>
                                                                    </div>
                                                                  </div>
                                                                  <button class="btn btn-outline-light btn-sm w-100" (click)="logout()">
                                                                    <i class="fas fa-sign-out-alt me-2"></i>
                                                                    <span *ngIf="!sidebarCollapsed">Logout</span>
                                                                  </button>
                                                                </div>
                                                              </nav>

                                                              <!-- Main Content -->
                                                              <div class="main-content flex-grow-1">
                                                                <router-outlet></router-outlet>
                                                              </div>
                                                            </div>
                                                          `,
                                                          styles: [`
                                                            .sidebar {
                                                              width: 250px;
                                                              min-height: 100vh;
                                                              transition: width 0.3s ease;
                                                              position: fixed;
                                                              left: 0;
                                                              top: 0;
                                                              z-index: 1000;
                                                            }
                                                            
                                                            .sidebar.collapsed {
                                                              width: 80px;
                                                            }
                                                            
                                                            .main-content {
                                                              margin-left: 250px;
                                                              transition: margin-left 0.3s ease;
                                                              min-height: 100vh;
                                                              background-color: var(--bg-light);
                                                            }
                                                            
                                                            .sidebar.collapsed + .main-content {
                                                              margin-left: 80px;
                                                            }
                                                            
                                                            .nav-link {
                                                              color: rgba(255, 255, 255, 0.8);
                                                              border-radius: 0.375rem;
                                                              transition: all 0.2s;
                                                            }
                                                            
                                                            .nav-link:hover {
                                                              color: white;
                                                              background-color: rgba(255, 255, 255, 0.1);
                                                            }
                                                            
                                                            .nav-link.active {
                                                              color: white;
                                                              background-color: var(--primary-bank-blue);
                                                            }
                                                            
                                                            .avatar {
                                                              font-size: 0.875rem;
                                                            }
                                                            
                                                            .user-info {
                                                              position: absolute;
                                                              bottom: 20px;
                                                              left: 15px;
                                                              right: 15px;
                                                            }
                                                            
                                                            @media (max-width: 768px) {
                                                              .sidebar {
                                                                width: 80px;
                                                              }
                                                              
                                                              .main-content {
                                                                margin-left: 80px;
                                                              }
                                                            }
                                                          `]
                                                        })
                                                        export class ComplianceLayoutComponent implements OnInit {
                                                          currentUser: User | null = null;
                                                          sidebarCollapsed = false;

                                                          constructor(
                                                            private authService: AuthService,
                                                            private router: Router
                                                          ) {}

                                                          ngOnInit(): void {
                                                            this.authService.currentUser$.subscribe(user => {
                                                              this.currentUser = user;
                                                            });

                                                            // Auto-collapse on mobile
                                                            if (window.innerWidth <= 768) {
                                                              this.sidebarCollapsed = true;
                                                            }
                                                          }

                                                          toggleSidebar(): void {
                                                            this.sidebarCollapsed = !this.sidebarCollapsed;
                                                          }

                                                          logout(): void {
                                                            this.authService.logout();
                                                            this.router.navigate(['/login']);
                                                          }
                                                        }
