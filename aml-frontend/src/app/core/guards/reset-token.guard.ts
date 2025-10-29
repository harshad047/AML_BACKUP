import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const ResetTokenGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = sessionStorage.getItem('reset_token');
  if (!token) {
    router.navigate(['/customer/change-password/verify']);
    return false;
  }
  return true;
};
