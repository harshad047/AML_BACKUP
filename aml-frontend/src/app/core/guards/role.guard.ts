import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];

    if (this.authService.hasAnyRole(requiredRoles)) {
      return true;
    } else {
      // Redirect to appropriate dashboard based on user role
      const user = this.authService.getCurrentUser();
      if (user) {
        switch (user.role) {
          case 'CUSTOMER':
            this.router.navigate(['/customer']);
            break;
          case 'OFFICER':
            this.router.navigate(['/compliance']);
            break;
          case 'ADMIN':
          case 'SUPER_ADMIN':
            this.router.navigate(['/admin']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
  }
}
