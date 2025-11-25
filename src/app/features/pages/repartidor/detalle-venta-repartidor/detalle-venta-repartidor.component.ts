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
      console.log('📅 Fecha recibida:', venta.fecha);
      console.log('⏰ Hora recibida:', venta.hora);
      console.log('🗓️ Fecha inicio ruta:', venta.fecha_inicio_ruta);
      console.log('🏁 Fecha fin ruta:', venta.fecha_fin_ruta);
    },
    error: (error) => {
      console.error('Error cargando detalle de venta:', error);
      this.error = 'Error al cargar los detalles de la venta';
      this.loading = false;
    }
  });
}
// Método mejorado y restrictivo para marcar como pagado
// Corrige el método marcarComoPagado en detalle-venta-repartidor.component.ts
// Agrega este método para navegar a rutas asignadas
irARutasAsignadas() {
  this.router.navigate(['/repartidor/rutas-asignadas']);
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
    // Intentar parsear la fecha de diferentes formas
    let fechaObj: Date;
    
    if (fecha.includes('-')) {
      // Formato YYYY-MM-DD
      const [year, month, day] = fecha.split('-').map(Number);
      fechaObj = new Date(year, month - 1, day);
    } else {
      // Otros formatos
      fechaObj = new Date(fecha);
    }
    
    return fechaObj.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
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
    console.error('Error formateando hora:', error);
    return hora;
  }
}
  // Nuevo método para formatear fecha y hora completa
// Nuevo método para formatear fecha y hora completa - CORREGIDO
// Método para formatear fecha y hora completa (mantener este)
formatearFechaHora(fechaHora: string | undefined): string {
  if (!fechaHora) return '';
  try {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha/hora:', error);
    return fechaHora || '';
  }
}

  // Verificar si la ruta fue iniciada
  isRutaIniciada(): boolean {
    return !!this.venta?.fecha_inicio_ruta;
  }

  // Verificar si la ruta fue finalizada
  isRutaFinalizada(): boolean {
    return !!this.venta?.fecha_fin_ruta;
  }

 // Calcular tiempo transcurrido - CORREGIDO
calcularTiempoTranscurrido(): string {
  if (!this.venta?.fecha_inicio_ruta) return '';
  
  try {
    const inicio = new Date(this.venta.fecha_inicio_ruta);
    const ahora = new Date();
    const diffMs = ahora.getTime() - inicio.getTime();
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas} horas ${minutos} minutos`;
    } else {
      return `${minutos} minutos`;
    }
  } catch (error) {
    return '';
  }
}

// Método para formatear fecha completa del pedido (fecha + hora)
formatearFechaCompleta(fechaHora: string): string {
  if (!fechaHora) return '';
  try {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    // Si falla, intentar con formato separado
    return this.formatearFechaSeparada(fechaHora);
  }
}

// Método alternativo para formatear fecha y hora por separado
formatearFechaSeparada(fechaHora: string): string {
  if (!fechaHora) return '';
  
  try {
    // Intentar diferentes formatos de fecha
    let fechaObj: Date;
    
    if (fechaHora.includes('T')) {
      // Formato ISO
      fechaObj = new Date(fechaHora);
    } else if (fechaHora.includes(' ')) {
      // Formato con espacio
      const [fechaPart, horaPart] = fechaHora.split(' ');
      const [year, month, day] = fechaPart.split('-').map(Number);
      const [hours, minutes, seconds] = horaPart.split(':').map(Number);
      fechaObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
    } else {
      // Solo fecha, sin hora
      const [year, month, day] = fechaHora.split('-').map(Number);
      fechaObj = new Date(year, month - 1, day);
    }
    
    return fechaObj.toLocaleString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return fechaHora; // Devolver original si falla
  }
}
// Método para calcular tiempo total de entrega (solo para entregas completadas)
calcularTiempoTotalEntrega(): string {
  if (!this.venta?.fecha_inicio_ruta || !this.venta?.fecha_fin_ruta) return '';
  
  try {
    const inicio = new Date(this.venta.fecha_inicio_ruta);
    const fin = new Date(this.venta.fecha_fin_ruta);
    const diffMs = fin.getTime() - inicio.getTime();
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos} minutos`;
    }
  } catch (error) {
    return '';
  }
}
// Método para navegar a entregas pendientes
irAEntregasPendientes() {
  this.router.navigate(['/repartidor/entregas-pendientes']);
}

}