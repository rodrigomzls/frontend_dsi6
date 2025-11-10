// src/app/features/pages/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  credentials = {
    nombre_usuario: '',
   password: '' // CAMBIAR de "contrasena" a "contraseña"
  };
  loading = false;
  error = '';

  onSubmit(): void {
    if (!this.credentials.nombre_usuario || !this.credentials.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials.nombre_usuario, this.credentials.password)
      .subscribe({
        next: () => {
          // Si el usuario tiene acceso a crear nueva venta, redirigir directamente
          try {
            const canNewSale = this.authService.hasModuleAccess
              ? this.authService.hasModuleAccess('ventas_nueva')
              : false;

            if (canNewSale) {
              this.router.navigate(['/ventas/nueva']);
            } else {
              // fallback: ir al inicio
              this.router.navigate(['/inicio']);
            }
          } catch (err) {
            console.warn('No se pudo comprobar permisos, redirigiendo a inicio', err);
            this.router.navigate(['/inicio']);
          }
        },
        error: (error) => {
          this.error = error.error?.error || 'Error al iniciar sesión';
          this.loading = false;
          console.error('Error de login:', error);
        }
      });
  }
}