// src/app/features/pages/inicio/home.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="welcome-card">
        <h1>¡Bienvenido al Sistema de Agua! 💧</h1>
        
        <div class="user-info" *ngIf="authService.currentUser$ | async as user">
          <p><strong>Usuario:</strong> {{ user.nombre }}</p>
          <p><strong>Rol:</strong> {{ user.roleName }}</p>
        </div>
        
        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="action-buttons">
            <button (click)="goToClientes()" class="btn-primary">👥 Gestionar Clientes</button>
            <button (click)="goToProductos()" class="btn-secondary">📦 Ver Productos</button>
            <button (click)="nuevaVenta()" class="btn-success">🛒 Nueva Venta</button>
            <button (click)="goToVentas()" class="btn-info">📋 Panel de Ventas</button>
            <button (click)="logout()" class="btn-logout">🚪 Cerrar Sesión</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .welcome-card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .user-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #009949;
    }
    .quick-actions {
      margin-top: 30px;
      text-align: center;
    }
    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    button {
      padding: 15px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    .btn-primary { background: #009949; color: white; }
    .btn-secondary { background: #057cbe; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-info { background: #17a2b8; color: white; }
    .btn-logout { background: #dc3545; color: white; }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    @media (max-width: 768px) {
      .action-buttons {
        grid-template-columns: 1fr;
      }
    }
  `]
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