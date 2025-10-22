// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Dar tiempo para que la sincronización entre pestañas funcione
  setTimeout(() => {
    if (!authService.isLoggedIn()) {
      console.log('🚫 Acceso denegado - Redirigiendo al login');
      router.navigate(['/login']);
    }
  }, 100);

  // Permitir acceso inicialmente mientras se verifica
  return authService.isLoggedIn();
};