import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  // Clone the request and add the authorization header if token exists
  let clonedRequest = req;
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized responses (token expired/invalid)
      if (error.status === 401) {
        // Check if this is not a login request to avoid infinite loops
        const isAuthRequest = req.url.includes('/auth/login') || 
                             req.url.includes('/auth/register') || 
                             req.url.includes('/auth/forgot-password') ||
                             req.url.includes('/auth/send-login-otp') ||
                             req.url.includes('/auth/verify-login-otp');
        
        if (!isAuthRequest && authService.isAuthenticated() && !isLoggingOut) {
          console.warn('Token expired or invalid. Logging out user.');
          isLoggingOut = true;
          
          // Show user-friendly notification
          toastService.error('Your session has expired. Please login again.', 6000);
          
          // Automatically logout the user
          authService.logout();
          
          // Reset flag after a short delay
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
      }
      
      // Handle 403 Forbidden responses (insufficient permissions)
      if (error.status === 403) {
        const isAuthRequest = req.url.includes('/auth/');
        if (!isAuthRequest) {
          toastService.error('You do not have permission to access this resource.', 5000);
        }
      }
      
      return throwError(() => error);
    })
  );
};
