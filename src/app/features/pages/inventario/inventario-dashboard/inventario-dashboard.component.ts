import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { InventarioService } from '../../../../core/services/inventario.service';


@Component({
  selector: 'app-inventario-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './inventario-dashboard.component.html',
  styleUrls: ['./inventario-dashboard.component.css']
})
export class InventarioDashboardComponent implements OnInit {
  totalStock = 0;
  productosStockBajo = 0;
  lotesActivos = 0;
  lotesPorCaducar = 0;

  alertas: any[] = []; // ✅ Inicializar como array vacío

  constructor(
    private router: Router,
    private inventarioService: InventarioService // ✅ Inyectar el servicio
  ) {}

// En inventario-dashboard.component.ts
ngOnInit() {
  this.cargarEstadisticasReales();
}

cargarEstadisticasReales() {
  this.inventarioService.getDashboardData().subscribe({
   next: (data: any) => { // ✅ Especificar tipo 'any' o crear interfaz
      const stats = data.estadisticas;
      this.totalStock = stats.totalStock;
      this.productosStockBajo = stats.productosStockBajo;
      this.lotesActivos = stats.lotesActivos;
      this.lotesPorCaducar = stats.lotesPorCaducar;
      
      // Actualizar alertas con datos reales
      this.actualizarAlertas(data.alertas);
    },
    error: (error: any) => { // ✅ Especificar tipo
        console.error('Error cargando dashboard:', error);
        // Cargar datos por defecto si hay error
        this.cargarEstadisticasPorDefecto();
      }
  });
}
  // ✅ CREAR MÉTODO actualizarAlertas
  private actualizarAlertas(alertasBackend: any) {
    this.alertas = [];

    // Alertas de stock bajo
    if (alertasBackend?.stockBajo && alertasBackend.stockBajo.length > 0) {
      this.alertas.push({
        tipo: 'warning',
        icono: 'warning',
        titulo: 'Stock Bajo Detectado',
        mensaje: `${alertasBackend.stockBajo.length} productos están por debajo del stock mínimo`,
        accion: 'Revisar',
        data: alertasBackend.stockBajo
      });
    }

    // Alertas de lotes por caducar
    if (alertasBackend?.lotesPorCaducar && alertasBackend.lotesPorCaducar.length > 0) {
      this.alertas.push({
        tipo: 'danger',
        icono: 'schedule',
        titulo: 'Lotes por Caducar',
        mensaje: `${alertasBackend.lotesPorCaducar.length} lotes caducan en los próximos 30 días`,
        accion: 'Ver Detalles',
        data: alertasBackend.lotesPorCaducar
      });
    }

    // Si no hay alertas del backend, mostrar mensaje
    if (this.alertas.length === 0) {
      this.alertas.push({
        tipo: 'success',
        icono: 'check_circle',
        titulo: 'Todo en orden',
        mensaje: 'No hay alertas críticas en este momento',
        accion: 'Continuar'
      });
    }
  }

  // ✅ MÉTODO DE FALLBACK POR SI EL BACKEND NO RESPONDE
  private cargarEstadisticasPorDefecto() {
    // Usar datos por defecto o de la versión anterior
    this.totalStock = 527;
    this.productosStockBajo = 3;
    this.lotesActivos = 15;
    this.lotesPorCaducar = 2;
    
    // Alertas por defecto
    this.alertas = [
      {
        tipo: 'warning',
        icono: 'warning',
        titulo: 'Stock Bajo Detectado',
        mensaje: '3 productos están por debajo del stock mínimo',
        accion: 'Revisar'
      },
      {
        tipo: 'danger',
        icono: 'schedule',
        titulo: 'Lotes por Caducar',
        mensaje: '2 lotes caducan en los próximos 30 días',
        accion: 'Ver Detalles'
      }
    ];
  }


  goToMovimientos() {
    this.router.navigate(['/inventario/movimiento']);
  }

  goToReportes() {
    this.router.navigate(['/inventario/reportes']);
  }

  goToLotes() {
    this.router.navigate(['/lotes']);
  }

  goToProductos() {
    this.router.navigate(['/productos']);
  }

  goToPedidosProveedor() {
    this.router.navigate(['/pedidos-proveedor']);
  }

  goToProveedores() {
    this.router.navigate(['/proveedores']);
  }

  resolverAlerta(alerta: any) {
    switch(alerta.tipo) {
      case 'warning':
        this.goToProductos();
        break;
      case 'danger':
        this.goToLotes();
        break;
         default:
        // Para alertas de éxito, no hacer nada o recargar
        this.cargarEstadisticasReales();
        break;
    }
  }
}