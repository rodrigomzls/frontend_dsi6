// src/app/app.ts
import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit, OnDestroy {
  protected readonly title = signal('my-app-dsi6');
  private authSubscription!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('🔄 Estado de autenticación cambiado:', user ? 'Autenticado' : 'No autenticado');
      
      // Si el usuario cierra sesión y está en una ruta protegida, redirigir al login
      if (!user && this.isProtectedRoute()) {
        console.log('🔐 Sesión cerrada - Redirigiendo al login');
        this.router.navigate(['/login']);
      }
    });

    // Verificar autenticación al cargar la app
    this.authService.checkToken();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Mostrar header solo cuando esté autenticado y NO esté en páginas de auth
  shouldShowHeaderFooter = computed(() => {
    const currentUrl = this.router.url;
    const isAuthRoute = currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/';
    
    return this.authService.isLoggedIn() && !isAuthRoute;
  });

  // Verificar si la ruta actual es protegida
  private isProtectedRoute(): boolean {
    const protectedRoutes = ['/inicio', '/clientes', '/productos'];
    return protectedRoutes.some(route => this.router.url.startsWith(route));
  }

  shouldShowHeader(): boolean {
  const currentUrl = this.router.url;
  const isAuthRoute = currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/';
  return !isAuthRoute;
}

}