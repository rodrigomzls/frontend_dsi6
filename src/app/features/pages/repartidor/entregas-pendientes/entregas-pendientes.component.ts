// src/app/features/pages/repartidor/entregas-pendientes/entregas-pendientes.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-entregas-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entregas-pendientes.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class EntregasPendientesComponent implements OnInit {
  private repartidorVentaService = inject(RepartidorVentaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  entregas: RepartidorVenta[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.cargarEntregasPendientes();
  }

  cargarEntregasPendientes() {
    this.loading = true;
    this.repartidorVentaService.getEntregasPendientes().subscribe({
      next: (entregas) => {
        this.entregas = entregas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando entregas pendientes:', error);
        this.error = 'Error al cargar las entregas pendientes';
        this.loading = false;
      }
    });
  }

  marcarComoEntregado(idVenta: number) {
    if (confirm('¿Confirmar que esta entrega ha sido completada y pagada?')) {
      this.repartidorVentaService.marcarComoPagado(idVenta).subscribe({
        next: () => {
          alert('Entrega marcada como pagada correctamente');
          this.cargarEntregasPendientes(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error marcando como pagado:', error);
          alert('Error al marcar la entrega como pagada');
        }
      });
    }
  }

  marcarComoCancelado(idVenta: number) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (motivo !== null) {
      this.repartidorVentaService.marcarComoCancelado(idVenta, motivo).subscribe({
        next: () => {
          alert('Entrega cancelada correctamente');
          this.cargarEntregasPendientes(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error cancelando entrega:', error);
          alert('Error al cancelar la entrega');
        }
      });
    }
  }

  verDetalleVenta(idVenta: number) {
    this.router.navigate(['/repartidor/venta', idVenta]);
  }

  abrirMapa(direccion: string, coordenadas?: string) {
    if (coordenadas) {
      // Abrir en Google Maps con coordenadas
      const [lat, lng] = coordenadas.split(',');
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      // Abrir con dirección
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(direccion)}`, '_blank');
    }
  }
}