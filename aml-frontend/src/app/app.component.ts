import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule, ToastContainerComponent],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <main [class.with-navbar]="showNavbar" [class.auth-page]="!showNavbar">
      <router-outlet></router-outlet>
    </main>
    <app-toast-container></app-toast-container>
  `,
  styles: [`
    main.with-navbar {
      min-height: calc(100vh - 56px);
      padding-top: 1rem;
    }
    
    main.auth-page {
      min-height: 100vh;
      padding: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'AML Banking System';
  showNavbar = false;
  isAuthenticated = false;

  constructor(private router: Router, private authService: AuthService) {
    // Ensure navbar is hidden initially
    this.showNavbar = false;
  }

  ngOnInit(): void {
    // Check authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.updateNavbarVisibility();
    });

    // Check initial route
    this.checkRoute(this.router.url);
    
    // Listen to route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkRoute(event.url);
    });
  }

  private checkRoute(url: string): void {
    this.updateNavbarVisibility(url);
  }

  private updateNavbarVisibility(url?: string): void {
    const currentUrl = url || this.router.url;
    // Get the URL without query parameters
    const urlWithoutParams = currentUrl.split('?')[0];
    
    // Hide navbar for authentication routes and root route, or when not authenticated
    const hideNavbarRoutes = ['/', '/auth'];
    const shouldHideForRoute = hideNavbarRoutes.some(route => 
      urlWithoutParams === route || urlWithoutParams.startsWith(route + '/')
    );
    
    // Show navbar only if user is authenticated and not on auth routes
    this.showNavbar = this.isAuthenticated && !shouldHideForRoute;
  }
}
