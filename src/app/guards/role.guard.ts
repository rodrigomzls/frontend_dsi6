// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles = route.data['expectedRoles'] as number[];
  
  // Forzar verificación del token
  authService.checkToken();
  
  if (authService.isLoggedIn() && expectedRoles.some(role => authService.hasRole(role))) {
    return true;
  } else {
    console.log('🚫 Acceso denegado por rol - Redirigiendo al login');
    router.navigate(['/login']);
    return false;
  }
};