// src/app/features/pages/repartidor/historial-entregas/historial-entregas.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ AGREGAR ESTA IMPORTACIÓN
import { Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';

@Component({
  selector: 'app-historial-entregas',
  standalone: true,
  imports: [
    CommonModule
    , FormsModule  // ✅ AGREGAR FORMSMODULE A LOS IMPORTS
    ],
  templateUrl: './historial-entregas.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class HistorialEntregasComponent implements OnInit {
  private repartidorVentaService = inject(RepartidorVentaService);
  private router = inject(Router);

  historial: RepartidorVenta[] = [];
  loading = true;
  error = '';
  filtroEstado = 'todos';

  ngOnInit() {
    this.cargarHistorial();
  }
// En el método cargarHistorial, agregar logging:
 cargarHistorial() {
  this.loading = true;
  this.repartidorVentaService.getHistorialEntregas().subscribe({
    next: (historial) => {
      console.log('📊 Historial recibido:', historial);
      console.log('💰 Ventas pagadas:', historial.filter(e => e.estado === 'Pagado'));
      console.log('💵 Totales de ventas pagadas:', historial.filter(e => e.estado === 'Pagado').map(e => e.total));
      
      this.historial = historial;
      this.loading = false;
      
      // Debug adicional
      console.log('🔢 Total entregas:', this.getTotalEntregas());
      console.log('❌ Total canceladas:', this.getTotalCanceladas());
      console.log('💲 Total ingresos:', this.getTotalIngresos());
    },
    error: (error) => {
      console.error('Error cargando historial:', error);
      this.error = 'Error al cargar el historial de entregas';
      this.loading = false;
    }
  });
}

  get historialFiltrado(): RepartidorVenta[] {
    if (this.filtroEstado === 'todos') {
      return this.historial;
    }
    return this.historial.filter(entrega => 
      entrega.estado.toLowerCase() === this.filtroEstado.toLowerCase()
    );
  }

  verDetalleVenta(idVenta: number) {
    this.router.navigate(['/repartidor/venta', idVenta]);
  }

  getEstadoBadgeClass(estado: string): string {
    const estadoClass: { [key: string]: string } = {
      'Pagado': 'badge-success',
      'Cancelado': 'badge-danger',
      'En ruta': 'badge-warning',
      'Listo para repartos': 'badge-info'
    };
    return estadoClass[estado] || 'badge-secondary';
  }

  getTotalEntregas(): number {
    return this.historial.filter(e => e.estado === 'Pagado').length;
  }

  getTotalCanceladas(): number {
    return this.historial.filter(e => e.estado === 'Cancelado').length;
  }

 // También mejorar getTotalIngresos con manejo de errores:
getTotalIngresos(): number {
  try {
    const ventasPagadas = this.historial.filter(e => e.estado === 'Pagado');
    const total = ventasPagadas.reduce((sum, e) => {
      // Asegurarse de que total sea un número
      const totalVenta = Number(e.total) || 0;
      return sum + totalVenta;
    }, 0);
    
    console.log('💰 Cálculo de ingresos:', {
      ventasPagadas: ventasPagadas.length,
      totalCalculado: total,
      detalles: ventasPagadas.map(v => ({ id: v.id_venta, total: v.total }))
    });
    
    return total;
  } catch (error) {
    console.error('Error calculando ingresos:', error);
    return 0;
  }
}
}