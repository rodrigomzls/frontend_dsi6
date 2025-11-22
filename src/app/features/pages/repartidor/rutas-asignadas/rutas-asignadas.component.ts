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
    // Obtener ubicación GPS si está disponible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          this.confirmarInicioRuta(idVenta, coords);
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación GPS:', error);
          // Iniciar sin coordenadas
          this.confirmarInicioRuta(idVenta);
        },
        { 
          timeout: 10000,
          enableHighAccuracy: true 
        }
      );
    } else {
      this.confirmarInicioRuta(idVenta);
    }
  }
private confirmarInicioRuta(idVenta: number, coordenadas?: string) {
    const venta = this.ventas.find(v => v.id_venta === idVenta);
    
    if (venta?.fecha_inicio_ruta) {
      alert('Esta ruta ya fue iniciada anteriormente.');
      return;
    }

    if (confirm('¿Está seguro de iniciar la ruta de entrega?\n\nSe activará el seguimiento y se registrará su ubicación de inicio.')) {
      this.repartidorVentaService.iniciarRutaEntrega(idVenta, coordenadas).subscribe({
        next: (response) => {
          if (response.success) {
            alert('¡Ruta iniciada correctamente! El seguimiento está ahora activo.');
            this.cargarVentasAsignadas(); // Recargar para actualizar estado
            
            // Opcional: Redirigir al mapa con la ruta activa
            // this.router.navigate(['/repartidor/mapa'], { 
            //   queryParams: { venta: idVenta } 
            // });
          }
        },
        error: (error) => {
          console.error('Error iniciando ruta:', error);
          const mensajeError = error.error?.error || 'Error al iniciar la ruta';
          alert(mensajeError);
        }
      });
    }
  }

 // Verificar si una ruta ya fue iniciada
  isRutaIniciada(venta: RepartidorVenta): boolean {
    return !!venta.fecha_inicio_ruta;
  }
   // Obtener texto del botón según estado
  getTextoBoton(venta: RepartidorVenta): string {
    return this.isRutaIniciada(venta) ? 'Ruta en Curso' : 'Iniciar Entrega';
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