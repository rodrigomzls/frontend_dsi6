// src/app/features/pages/repartidor/entregas-pendientes/entregas-pendientes.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';
import { AuthService } from '../../../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-entregas-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entregas-pendientes.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class EntregasPendientesComponent implements OnInit, OnDestroy {
  private repartidorVentaService = inject(RepartidorVentaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  entregas: RepartidorVenta[] = [];
  loading = true;
  error = '';
  private timerSubscription!: Subscription;

  // ✅ AGREGAR esta propiedad para métodos de pago
  metodosPago: any[] = [
    { id_metodo_pago: 1, metodo_pago: 'Efectivo' },
    { id_metodo_pago: 2, metodo_pago: 'Yape' },
    { id_metodo_pago: 3, metodo_pago: 'Transferencia' },
    { id_metodo_pago: 4, metodo_pago: 'Tarjeta' }
  ];

  ngOnInit() {
    this.cargarEntregasPendientes();
    // Actualizar cada 30 segundos para mostrar tiempo transcurrido
    this.timerSubscription = interval(30000).subscribe(() => {
      this.actualizarTiempos();
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  cargarEntregasPendientes() {
    this.loading = true;
    this.repartidorVentaService.getEntregasPendientes().subscribe({
      next: (entregas) => {
        this.entregas = entregas;
        this.loading = false;
        this.actualizarTiempos();
        this.verificarEstadosVentas();
      },
      error: (error) => {
        console.error('Error cargando entregas pendientes:', error);
        this.error = 'Error al cargar las entregas pendientes';
        this.loading = false;
      }
    });
  }

  private actualizarTiempos() {
    // Forzar actualización de la vista
    this.entregas = [...this.entregas];
  }

  // MEJORA: Método para navegar a rutas asignadas
  irARutasAsignadas() {
    this.router.navigate(['/repartidor/rutas-asignadas']);
  }

  // MEJORA: Método para verificar estado al cargar
  verificarEstadosVentas() {
    this.entregas.forEach(entrega => {
      if (entrega.id_estado_venta === 5 && !entrega.fecha_inicio_ruta) {
        console.warn(`⚠️ Venta #${entrega.id_venta} en estado "En ruta" pero sin fecha de inicio`);
        console.log('📋 Datos de la venta:', {
          id_venta: entrega.id_venta,
          estado: entrega.estado,
          id_estado_venta: entrega.id_estado_venta,
          fecha_inicio_ruta: entrega.fecha_inicio_ruta,
          ubicacion_inicio_ruta: entrega.ubicacion_inicio_ruta
        });
      } else if (entrega.id_estado_venta === 5 && entrega.fecha_inicio_ruta) {
        console.log(`✅ Venta #${entrega.id_venta} correcta: ruta iniciada el ${entrega.fecha_inicio_ruta}`);
      }
    });
  }

  // ✅ CORREGIDO: Un solo método marcarComoEntregado
  async marcarComoEntregado(idVenta: number) {
    const entrega = this.entregas.find(e => e.id_venta === idVenta);
    if (!entrega) return;

    // Verificación especial para Yape
    if (entrega.id_metodo_pago === 2) {
      const yapeConfirmado = await this.verificarPagoYape(idVenta);
      if (!yapeConfirmado) return;
    }

    // Resto del código del método...
    this.repartidorVentaService.verificarPuedeMarcarPagado(idVenta).subscribe({
      next: (verificacion) => {
        if (!verificacion.puede) {
          alert(`❌ No puede marcar como pagado:\n${verificacion.mensaje}`);
          return;
        }

        if (confirm('¿Está seguro de que ha completado la entrega y recibido el pago del cliente?')) {
          this.repartidorVentaService.marcarComoPagado(idVenta).subscribe({
            next: () => {
              alert('✅ Entrega marcada como pagada correctamente');
              this.cargarEntregasPendientes();
            },
            error: (error) => {
              console.error('Error marcando como pagado:', error);
              alert(`❌ Error: ${error.error?.error || 'No se pudo completar la operación'}`);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error en verificación:', error);
        alert('Error al verificar condiciones de pago');
      }
    });
  }

  marcarComoCancelado(idVenta: number) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (motivo !== null) {
      this.repartidorVentaService.marcarComoCancelado(idVenta, motivo).subscribe({
        next: () => {
          alert('Entrega cancelada correctamente');
          this.cargarEntregasPendientes();
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
      const [lat, lng] = coordenadas.split(',');
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(direccion)}`, '_blank');
    }
  }

  // MEJORA: Método para formatear fecha y hora
  formatearFechaHora(fechaHora: string | undefined): string {
    if (!fechaHora) return '';
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaHora || '';
    }
  }

  // Calcular tiempo transcurrido desde el inicio de la ruta
  calcularTiempoTranscurrido(fechaInicio: string | undefined): string {
    if (!fechaInicio) return '';
    
    try {
      const inicio = new Date(fechaInicio);
      const ahora = new Date();
      const diffMs = ahora.getTime() - inicio.getTime();
      
      const horas = Math.floor(diffMs / (1000 * 60 * 60));
      const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (horas > 0) {
        return `${horas}h ${minutos}m`;
      } else {
        return `${minutos}m`;
      }
    } catch (error) {
      return '';
    }
  }

  // Verificar si una ruta fue iniciada
  isRutaIniciada(venta: RepartidorVenta): boolean {
    return !!venta.fecha_inicio_ruta;
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

  // ✅ AGREGAR este método para cambiar método de pago
  cambiarMetodoPago(idVenta: number) {
    // Buscar la entrega actual
    const entrega = this.entregas.find(e => e.id_venta === idVenta);
    if (!entrega) return;

    // Crear lista de métodos de pago disponibles (excluyendo el actual)
    const metodosDisponibles = this.metodosPago.filter(
      metodo => metodo.id_metodo_pago !== entrega.id_metodo_pago
    );

    if (metodosDisponibles.length === 0) {
      alert('No hay otros métodos de pago disponibles');
      return;
    }

    // Crear mensaje con opciones
    let mensaje = `Cambiar método de pago para Entrega #${idVenta}\n\n`;
    mensaje += `Método actual: ${entrega.metodo_pago}\n\n`;
    mensaje += 'Seleccione nuevo método:\n';
    
    metodosDisponibles.forEach((metodo, index) => {
      mensaje += `${index + 1}. ${metodo.metodo_pago}\n`;
    });

    const seleccion = prompt(mensaje + '\nIngrese el número del método:');
    
    if (seleccion === null) return;

    const numeroSeleccion = parseInt(seleccion);
    if (isNaN(numeroSeleccion) || numeroSeleccion < 1 || numeroSeleccion > metodosDisponibles.length) {
      alert('Selección inválida');
      return;
    }

    const nuevoMetodo = metodosDisponibles[numeroSeleccion - 1];
    
    if (confirm(`¿Cambiar método de pago a: ${nuevoMetodo.metodo_pago}?`)) {
      this.repartidorVentaService.cambiarMetodoPago(idVenta, nuevoMetodo.id_metodo_pago).subscribe({
        next: (response) => {
          alert(`✅ Método de pago cambiado a: ${nuevoMetodo.metodo_pago}`);
          
          // Actualizar la entrega localmente
          const entregaIndex = this.entregas.findIndex(e => e.id_venta === idVenta);
          if (entregaIndex !== -1) {
            this.entregas[entregaIndex].id_metodo_pago = nuevoMetodo.id_metodo_pago;
            this.entregas[entregaIndex].metodo_pago = nuevoMetodo.metodo_pago;
          }
        },
        error: (error) => {
          console.error('Error cambiando método de pago:', error);
          alert(`❌ Error: ${error.error?.error || 'No se pudo cambiar el método de pago'}`);
        }
      });
    }
  }

  // Método opcional para verificación avanzada de Yape
  verificarPagoYape(idVenta: number): Promise<boolean> {
    return new Promise((resolve) => {
      const mensaje = `🔐 VERIFICACIÓN DE PAGO YAPE\n\n` +
                     `Por seguridad, confirme:\n\n` +
                     `1. ¿Escaneó el código QR del cliente?\n` +
                     `2. ¿Verificó que el pago apareció en su aplicación Yape?\n` +
                     `3. ¿Confirmó el monto correcto (S/ ${this.getTotalVenta(idVenta)})?\n\n` +
                     `¿Todo es correcto?`;
      
      const confirmado = confirm(mensaje);
      resolve(confirmado);
    });
  }

  // Método auxiliar para obtener total
  private getTotalVenta(idVenta: number): number {
    const entrega = this.entregas.find(e => e.id_venta === idVenta);
    return entrega ? entrega.total : 0;
  }
}