import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userRole: number = 0;
  modulosPermitidos: string[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Normalizar la propiedad de rol
        const role = (user as any).id_rol ?? (user as any).role ?? 0;
        this.userRole = Number(role);

        // Si el backend no envía 'modulos', asignar por rol
        if ((user as any).modulos && Array.isArray((user as any).modulos)) {
          this.modulosPermitidos = (user as any).modulos || [];
        } else {
          // Asignar módulos por rol (igual que en HomeComponent)
          switch (Number(role)) {
            case 1: // Administrador
              this.modulosPermitidos = [
                'usuarios', 'personas', 'clientes', 'productos',
                'ventas_nueva', 'ventas', 'ventas_asignacion_rutas', 'repartidores'
                , 'sunat'
              ];
              break;
            case 2: // Vendedor
              this.modulosPermitidos = [
                'clientes', 'productos', 'ventas_nueva', 'ventas', 'ventas_asignacion_rutas'
                , 'sunat'
              ];
              break;
            case 3: // Repartidor
              this.modulosPermitidos = [
                'rutas_asignadas', 'entregas_pendientes', 'historial_entregas'
              ];
              break;
            case 4: // Almacenero
              this.modulosPermitidos = [
                'inventario', 'productos', 'inventario_movimiento', 'inventario_reportes',
                'lotes', 'proveedores', 'pedido_proveedor', 'categorias', 'marcas'
              ];
              break;
            default:
              this.modulosPermitidos = [];
          }
        }
      }
    });
  }

  // Control de acceso
  tieneAcceso(modulo: string): boolean {
    return this.modulosPermitidos.includes(modulo);
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
    return this.tieneAcceso('entregas_pendientes') || 
           this.tieneAcceso('historial_entregas');
  }

  tieneAccesoAInventario(): boolean {
    return this.tieneAcceso('inventario') || 
           this.tieneAcceso('inventario_movimiento') || 
           this.tieneAcceso('inventario_reportes') ||
           this.tieneAcceso('lotes') ||
           this.tieneAcceso('proveedores') ||
           this.tieneAcceso('pedido_proveedor') ||
           this.tieneAcceso('categorias') ||
           this.tieneAcceso('marcas');
  }

  // Navegación
  irAlInicio(): void {
    this.router.navigate(['/inicio']);
  }

  goToUsuarios(): void {
    if (this.tieneAcceso('usuarios')) {
      this.router.navigate(['/usuarios']);
    }
  }

  goToPersonas(): void {
    if (this.tieneAcceso('personas')) {
      this.router.navigate(['/personas']);
    }
  }

  goToClientes(): void {
    if (this.tieneAcceso('clientes')) {
      this.router.navigate(['/clientes']);
    }
  }

  goToProductos(): void {
    if (this.tieneAcceso('productos')) {
      this.router.navigate(['/productos']);
    }
  }

  nuevaVenta(): void {
    if (this.tieneAcceso('ventas_nueva')) {
      this.router.navigate(['/ventas/nueva']);
    }
  }

  goToVentas(): void {
    if (this.tieneAcceso('ventas')) {
      this.router.navigate(['/ventas']);
    }
  }

  goToRutas(): void {
    if (this.tieneAcceso('ventas_asignacion_rutas')) {
      this.router.navigate(['/ventas/asignacion-rutas']);
    }
  }

  goToRepartidores(): void {
    if (this.tieneAcceso('repartidores')) {
      this.router.navigate(['/repartidores']);
    }
  }

  goToRutasAsignadas(): void {
    if (this.tieneAcceso('rutas_asignadas')) {
      this.router.navigate(['/repartidor/rutas-asignadas']);
    }
  }

  goToEntregas(): void {
    if (this.tieneAcceso('entregas_pendientes')) {
      this.router.navigate(['/repartidor/entregas-pendientes']);
    }
  }

  verHistorialEntregas(): void {
    if (this.tieneAcceso('historial_entregas')) {
      this.router.navigate(['/repartidor/historial-entregas']);
    }
  }

  // Módulos de Almacén
// header.component.ts - Agregar estos métodos en la sección de navegación:

// ✅ NUEVO: Navegación al Inventario Unificado
goToInventarioUnificado(): void {
  if (this.tieneAcceso('inventario')) {
    this.router.navigate(['/inventario']);
  }
}


// Los demás métodos se mantienen igual...



  goToInventario(): void {
    if (this.tieneAcceso('inventario')) {
      this.router.navigate(['/inventario']);
    }
  }

  registrarMovimiento(): void {
    if (this.tieneAcceso('inventario_movimiento')) {
      this.router.navigate(['/inventario/movimiento']);
    }
  }

  verReportes(): void {
    if (this.tieneAcceso('inventario_reportes')) {
      this.router.navigate(['/inventario/reportes']);
    }
  }

  goToProveedores(): void {
    if (this.tieneAcceso('proveedores')) {
      this.router.navigate(['/proveedores']);
    }
  }

  goPedidosProveedor(): void {
    if (this.tieneAcceso('pedido_proveedor')) {
      this.router.navigate(['/pedidos-proveedor']);
    }
  }

  goCategorias(): void {
    if (this.tieneAcceso('categorias')) {
      this.router.navigate(['/categorias']);
    }
  }

  goMarcas(): void {
    if (this.tieneAcceso('marcas')) {
      this.router.navigate(['/marcas']);
    }
  }

  // Navegación a módulo SUNAT
  goToSunat(): void {
    if (this.tieneAcceso('sunat')) {
      this.router.navigate(['/sunat']);
    }
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