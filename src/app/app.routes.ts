// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/pages/login/login.component';
import { RegisterComponent } from './features/pages/register/register.component';
import { ClienteListComponent } from './features/pages/cliente-list/cliente-list.component';
import { ProductoListComponent } from './features/pages/producto-list/producto-list.component';
import { HomeComponent } from './features/pages/inicio/home.component';
import { NuevaVentaComponent } from './features/pages/ventas/nueva-venta/nueva-venta.component';
import { PanelVentasComponent } from './features/pages/ventas/panel-ventas/panel-ventas.component';
import { DetalleVentaComponent } from './features/pages/ventas/detalle-venta/detalle-venta.component';
import { AsignacionRutasComponent } from './features/pages/ventas/asignacion-rutas/asignacion-rutas.component';
// Guards para standalone
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Rutas protegidas
  { 
    path: 'inicio', 
    component: HomeComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'clientes', 
    component: ClienteListComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [1, 2] } // Admin(1) y Vendedor(2)
  },
  { 
    path: 'productos', 
    component: ProductoListComponent,
    canActivate: [authGuard] // Todos los autenticados
  },
  
  // Módulo de Ventas - ORDEN CORREGIDO
  { 
    path: 'ventas', 
    component: PanelVentasComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [1, 2] } // Admin y Vendedor
  },
  { 
    path: 'ventas/nueva', 
    component: NuevaVentaComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [1, 2] } // Admin y Vendedor
  },
  // ✅ MOVER ASIGNACION-RUTAS ANTES DE :id
  { 
    path: 'ventas/asignacion-rutas', 
    component: AsignacionRutasComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [1] } // Solo Admin
  },
  { 
    path: 'ventas/:id', 
    component: DetalleVentaComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: [1, 2] }
  },
  { path: '**', redirectTo: '/login' }
];