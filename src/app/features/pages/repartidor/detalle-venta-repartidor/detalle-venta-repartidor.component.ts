// src/app/features/pages/repartidor/detalle-venta-repartidor/detalle-venta-repartidor.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta, VentaDetalle } from '../../../../core/models/repartidor-venta.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-detalle-venta-repartidor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-venta-repartidor.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class DetalleVentaRepartidorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private repartidorVentaService = inject(RepartidorVentaService);
  private authService = inject(AuthService);

  venta: RepartidorVenta | null = null;
  loading = true;
  error = '';

  ngOnInit() {
    this.cargarDetalleVenta();
  }

  cargarDetalleVenta() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de venta no válido';
      this.loading = false;
      return;
    }

    const ventaId = parseInt(id);
    this.repartidorVentaService.getVentaDetalle(ventaId).subscribe({
      next: (venta) => {
        this.venta = venta;
        this.loading = false;
        console.log('✅ Detalle de venta cargado:', venta);
      },
      error: (error) => {
        console.error('Error cargando detalle de venta:', error);
        this.error = 'Error al cargar los detalles de la venta';
        this.loading = false;
      }
    });
  }

  // Métodos para acciones del repartidor
  marcarComoPagado() {
    if (!this.venta) return;

    if (confirm('¿Confirmar que esta entrega ha sido completada y pagada?')) {
      this.repartidorVentaService.marcarComoPagado(this.venta.id_venta).subscribe({
        next: () => {
          alert('Entrega marcada como pagada correctamente');
          this.venta!.estado = 'Pagado';
          this.venta!.id_estado_venta = 7;
        },
        error: (error) => {
          console.error('Error marcando como pagado:', error);
          alert('Error al marcar la entrega como pagada');
        }
      });
    }
  }

  marcarComoCancelado() {
    if (!this.venta) return;

    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (motivo !== null) {
      this.repartidorVentaService.marcarComoCancelado(this.venta.id_venta, motivo).subscribe({
        next: () => {
          alert('Entrega cancelada correctamente');
          this.venta!.estado = 'Cancelado';
          this.venta!.id_estado_venta = 8;
          if (motivo) {
            this.venta!.notas = motivo;
          }
        },
        error: (error) => {
          console.error('Error cancelando entrega:', error);
          alert('Error al cancelar la entrega');
        }
      });
    }
  }

  abrirMapa() {
    if (!this.venta) return;

    const direccion = this.venta.direccion;
    const coordenadas = this.venta.coordenadas;

    if (coordenadas) {
      const [lat, lng] = coordenadas.split(',');
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(direccion)}`, '_blank');
    }
  }

  volverAtras() {
    this.router.navigate(['/repartidor/entregas-pendientes']);
  }

  // Métodos auxiliares para la vista
  getEstadoBadgeClass(estado: string): string {
    const estadoClass: { [key: string]: string } = {
      'Pagado': 'badge-success',
      'Cancelado': 'badge-danger',
      'En ruta': 'badge-warning',
      'Listo para repartos': 'badge-info'
    };
    return estadoClass[estado] || 'badge-secondary';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return fecha;
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    try {
      const [horas, minutos, segundos] = hora.split(':');
      const fecha = new Date();
      fecha.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos || '0'));
      
      return fecha.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return hora;
    }
  }
}