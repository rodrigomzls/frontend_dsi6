// src/app/features/pages/repartidor/rutas-asignadas/rutas-asignadas.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-rutas-asignadas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutas-asignadas.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class RutasAsignadasComponent implements OnInit {
  private repartidorVentaService = inject(RepartidorVentaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ventas: RepartidorVenta[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.cargarVentasAsignadas();
  }

  cargarVentasAsignadas() {
    this.loading = true;
    this.repartidorVentaService.getVentasAsignadas().subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando rutas asignadas:', error);
        this.error = 'Error al cargar las rutas asignadas';
        this.loading = false;
      }
    });
  }

  verDetalleVenta(idVenta: number) {
    this.router.navigate(['/repartidor/venta', idVenta]);
  }

  iniciarEntrega(idVenta: number) {
    // Aquí podrías implementar la lógica para iniciar la ruta en el mapa
    console.log('Iniciando entrega para venta:', idVenta);
    alert(`Iniciando entrega #${idVenta}`);
  }

  getEstadoBadgeClass(estado: string): string {
    const estadoClass: { [key: string]: string } = {
      'En ruta': 'badge-warning',
      'Listo para repartos': 'badge-info',
      'Pagado': 'badge-success',
      'Cancelado': 'badge-danger'
    };
    return estadoClass[estado] || 'badge-secondary';
  }
}