// src/app/features/pages/inicio/home.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  
  userRole: number = 0;
  modulosPermitidos: string[] = [];

  ngOnInit() {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          // Normalizar la propiedad de rol: el backend puede enviar 'id_rol' o 'role'
          const role = (user as any).id_rol ?? (user as any).role ?? 0;
          this.userRole = Number(role);

          // Si el backend no envía 'modulos', asignar por rol
          if ((user as any).modulos && Array.isArray((user as any).modulos)) {
            this.modulosPermitidos = (user as any).modulos || [];
          } else {
            // Asignar módulos por rol
            switch (Number(role)) {
              case 1: // Administrador
                this.modulosPermitidos = [
                  'usuarios', 'personas', 'clientes', 'productos',
                  'ventas_nueva', 'ventas', 'ventas_asignacion_rutas'
                ];
                break;
              case 2: // Vendedor
                this.modulosPermitidos = [
                  'clientes', 'productos', 'ventas_nueva', 'ventas','ventas_asignacion_rutas'
                ];
                break;
              case 3: // Repartidor
                this.modulosPermitidos = [
                  'rutas_asignadas', 'entregas', 'historial_entregas'
                ];
                break;
              case 4: // Almacenero
                this.modulosPermitidos = [
                  'inventario', 'productos', 'inventario_movimiento', 'inventario_reportes'
                ];
                break;
              default:
                this.modulosPermitidos = [];
            }
          }
        }
        console.log('HomeComponent: user', user);
        console.log('HomeComponent: modulosPermitidos', this.modulosPermitidos);
      });
  }

   // Nuevo método para verificar acceso
  tieneAcceso(modulo: string): boolean {
    return this.modulosPermitidos.includes(modulo);
  }
  // Módulos compartidos
  // Métodos de navegación con verificación
  goToClientes() {
    if (this.tieneAcceso('clientes')) {
      this.router.navigate(['/clientes']);
    }
  }

  goToProductos() {
    if (this.tieneAcceso('productos')) {
      this.router.navigate(['/productos']);
    }
  }

nuevaVenta() {
  console.log('🔍 Intentando navegar a nueva venta');
  console.log('🔍 Módulos permitidos:', this.modulosPermitidos);
  console.log('🔍 Tiene acceso ventas_nueva:', this.tieneAcceso('ventas_nueva'));
  
  if (this.tieneAcceso('ventas_nueva')) {
    console.log('✅ Navegando a /ventas/nueva');
    this.router.navigate(['/ventas/nueva']);
  } else {
    console.log('❌ No tiene acceso a ventas_nueva');
  }
}

   goToVentas() {
    if (this.tieneAcceso('ventas')) {
      this.router.navigate(['/ventas']);
    }
  } 
  goToUsuarios() {
    if (this.tieneAcceso('usuarios')) {
      this.router.navigate(['/usuarios']);
    }
  }

  goToPersonas() {
    if (this.tieneAcceso('personas')) {
      this.router.navigate(['/personas']);
    }
  }
  goToRoles() {
    if (this.tieneAcceso('roles')) {
      this.router.navigate(['/roles']);
    }
  }
  // Módulos específicos del Administrador

goToRutas() {
  console.log('🔍 Intentando navegar a asignación rutas');
  console.log('🔍 Tiene acceso ventas_asignacion_rutas:', this.tieneAcceso('ventas_asignacion_rutas'));
  
  if (this.tieneAcceso('ventas_asignacion_rutas')) {
    console.log('✅ Navegando a /ventas/asignacion-rutas');
    this.router.navigate(['/ventas/asignacion-rutas']);
  } else {
    console.log('❌ No tiene acceso a ventas_asignacion_rutas');
  }
}
  // Módulos específicos del Repartidor
   goToRutasAsignadas() {
    if (this.tieneAcceso('rutas_asignadas')) {
      this.router.navigate(['/rutas/asignadas']);
    }
  }

  goToEntregas() {
    if (this.tieneAcceso('entregas')) {
      this.router.navigate(['/entregas']);
    }
  }

   verHistorialEntregas() {
    if (this.tieneAcceso('historial_entregas')) {
      this.router.navigate(['/entregas/historial']);
    }
  }

  // Módulos específicos del Almacenero
     goToInventario() {
    if (this.tieneAcceso('inventario')) {
      this.router.navigate(['/inventario']);
    }
  }
    registrarMovimiento() {
    if (this.tieneAcceso('inventario_movimiento')) {
      this.router.navigate(['/inventario/movimiento']);
    }
  }

      verReportes() {
    if (this.tieneAcceso('inventario_reportes')) {
      this.router.navigate(['/inventario/reportes']);
    }
  }
 
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
