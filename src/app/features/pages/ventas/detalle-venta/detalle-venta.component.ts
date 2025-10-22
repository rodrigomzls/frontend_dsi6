// src/app/features/pages/ventas/detalle-venta/detalle-venta.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VentasService, Venta } from '../../../../core/services/ventas.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-venta.component.html',
  styleUrls: ['./detalle-venta.component.css']
})
export class DetalleVentaComponent implements OnInit {
  private ventasService = inject(VentasService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);

  venta: Venta | null = null;
  loading = false;
  error = '';
  notFound = false;

  ngOnInit() {
    this.cargarVenta();
  }

  cargarVenta() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de venta no válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.notFound = false;

    this.ventasService.getVentaById(+id).subscribe({
      next: (venta) => {
        console.log('📦 Venta cargada:', venta);
        this.venta = venta;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 404) {
          this.notFound = true;
          this.error = 'Venta no encontrada';
        } else {
          this.error = 'Error al cargar la venta';
        }
        console.error('Error cargando venta:', error);
      }
    });
  }

  // Obtener clase CSS para el estado
  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'Pendiente': 'estado-pendiente',
      'Confirmado': 'estado-confirmado',
      'En preparación': 'estado-preparacion',
      'Listo para repartos': 'estado-listo',
      'En ruta': 'estado-ruta',
      'Entregado': 'estado-entregado',
      'Pagado': 'estado-pagado',
      'Cancelado': 'estado-cancelado'
    };
    return classes[estado] || 'estado-desconocido';
  }

  // ✅ CORREGIDO: Formatear fecha correctamente
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      // Si la fecha viene como '2025-10-21T05:00:00.000Z' o '2025-10-21'
      const fechaObj = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Fecha original:', fecha);
      return 'Error en fecha';
    }
  }

  // ✅ NUEVO: Formatear hora en formato 12 horas (09:34 AM/PM)
  formatearHora(hora: string): string {
    if (!hora) return 'Hora no disponible';
    
    try {
      // Si la hora viene como '15:38:08'
      const [horas, minutos, segundos] = hora.split(':');
      const fecha = new Date();
      fecha.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos || '0'));
      
      return fecha.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formateando hora:', error, 'Hora original:', hora);
      return hora; // Devolver la hora original si hay error
    }
  }

  // Navegación
  volverAPanel() {
    this.router.navigate(['/ventas']);
  }

  imprimirDetalle() {
    window.print();
  }

  // Método para cambiar estado
  cambiarEstado() {
    if (!this.venta?.id_venta) return;
    
    const nuevoEstado = prompt('Ingrese el nuevo estado (1-8):\n1. Pendiente\n2. Confirmado\n3. En preparación\n4. Listo para repartos\n5. En ruta\n6. Entregado\n7. Pagado\n8. Cancelado');
    
    if (nuevoEstado && +nuevoEstado >= 1 && +nuevoEstado <= 8) {
      this.ventasService.updateEstadoVenta(this.venta.id_venta!, +nuevoEstado).subscribe({
        next: () => {
          alert('✅ Estado actualizado correctamente');
          this.cargarVenta();
        },
        error: (error) => {
          alert('❌ Error al actualizar estado');
          console.error('Error:', error);
        }
      });
    }
  }

  // Solo admin puede cambiar estados
  get puedeCambiarEstado(): boolean {
    return this.authService.isAdmin();
  }
}