// src/app/features/pages/inicio/home.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  goToClientes() {
    this.router.navigate(['/clientes']);
  }

  goToProductos() {
    this.router.navigate(['/productos']);
  }

  nuevaVenta() {
    this.router.navigate(['/ventas/nueva']);
  }

  goToVentas() {
    this.router.navigate(['/ventas']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
