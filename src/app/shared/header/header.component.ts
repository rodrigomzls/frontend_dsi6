import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // Navegación
  irAlInicio(): void {
    this.router.navigate(['/inicio']);
  }

  goToUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  goToPersonas(): void {
    this.router.navigate(['/personas']);
  }

  goToClientes(): void {
    this.router.navigate(['/clientes']);
  }

  goToProductos(): void {
    this.router.navigate(['/productos']);
  }

  nuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  goToVentas(): void {
    this.router.navigate(['/ventas']);
  }

  goToRutas(): void {
    this.router.navigate(['/ventas/asignacion-rutas']);
  }

  goToRepartidores(): void {
    this.router.navigate(['/repartidores']);
  }

  goToRutasAsignadas(): void {
    this.router.navigate(['/rutas-asignadas']);
  }

  goToEntregas(): void {
    this.router.navigate(['/entregas']);
  }

  verHistorialEntregas(): void {
    this.router.navigate(['/historial-entregas']);
  }

  // Control de acceso
  tieneAcceso(modulo: string): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    // Aquí puedes implementar la lógica de permisos según el rol del usuario
    switch (modulo) {
      case 'usuarios':
        return user.roleName === 'Administrador';
      case 'personas':
      case 'clientes':
        return ['Administrador', 'Vendedor'].includes(user.roleName);
      case 'productos':
        return true; // Accesible para todos los usuarios autenticados
      case 'ventas':
      case 'ventas_nueva':
        return ['Administrador', 'Vendedor'].includes(user.roleName);
      case 'ventas_asignacion_rutas':
        return user.roleName === 'Administrador';
      case 'rutas_asignadas':
        return user.roleName === 'Repartidor';
      case 'repartidores':
        return user.roleName === 'Administrador';
      default:
        return false;
    }
  }

  tieneAccesoAGestion(): boolean {
    return this.tieneAcceso('usuarios') || 
           this.tieneAcceso('personas') || 
           this.tieneAcceso('clientes') || 
           this.tieneAcceso('repartidores');
  }

  tieneAccesoAVentas(): boolean {
    return this.tieneAcceso('ventas_nueva') || this.tieneAcceso('ventas');
  }

  tieneAccesoARutas(): boolean {
    return this.tieneAcceso('ventas_asignacion_rutas') || 
           this.tieneAcceso('rutas_asignadas');
  }

  tieneAccesoAEntregas(): boolean {
    return this.tieneAcceso('entregas') || 
           this.tieneAcceso('historial_entregas');
  }

  // Autenticación
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get nombreUsuario(): string {
    return this.authService.getCurrentUser()?.nombre || '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
