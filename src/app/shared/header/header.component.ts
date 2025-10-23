import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // Redirigir al inicio al hacer clic en el logo
  irAlInicio(): void {
    this.router.navigate(['/inicio']);
  }

  // Cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Verificar si hay sesión activa
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Mostrar el nombre del usuario (opcional)
  get nombreUsuario(): string {
    return this.authService.getCurrentUser()?.nombre || '';
  }
}
