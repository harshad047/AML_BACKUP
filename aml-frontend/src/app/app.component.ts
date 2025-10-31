import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <main [class.with-navbar]="showNavbar" [class.auth-page]="!showNavbar">
      <router-outlet></router-outlet>
    </main>
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
  showNavbar = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
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
    // Get the URL without query parameters
    const urlWithoutParams = url.split('?')[0];
    
    // Hide navbar for authentication routes (check if URL starts with these paths)
    const authRoutes = ['/login', '/register', '/otp-verification', '/forgot-password'];
    this.showNavbar = !authRoutes.some(route => urlWithoutParams.startsWith(route) || urlWithoutParams === '/');
  }
}
