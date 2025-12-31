// src/app/features/pages/repartidor/historial-entregas/historial-entregas.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { EntregaDineroService } from '../../../../core/services/entrega-dinero.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';

@Component({
  selector: 'app-historial-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-entregas.component.html',
  styleUrls: ['../repartidor-styles.css']
})
export class HistorialEntregasComponent implements OnInit, OnDestroy {
  private repartidorVentaService = inject(RepartidorVentaService);
  private entregaDineroService = inject(EntregaDineroService);
  private router = inject(Router);
  private subscription: Subscription = new Subscription();
private dataSubscription: Subscription = new Subscription();
  // Datos principales
  historial: RepartidorVenta[] = [];
  historialFiltrado: RepartidorVenta[] = [];
  loading = true;
  error = '';
  
  // Filtros
  terminoBusqueda = '';
  filtroFecha = '';
  filtroMetodoPago = 'todos';
  filtroEstado = 'todos';
  
  // Control de dinero
  totalEntregadoAlAdmin = 0;
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  historialPaginado: RepartidorVenta[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

ngOnDestroy() {
  // Limpiar todas las suscripciones
  if (this.dataSubscription) {
    this.dataSubscription.unsubscribe();
  }
  this.subscription.unsubscribe();
}

// En historial-entregas.component.ts
// Modificar cargarDatos() para usar una sola suscripción
// En el método cargarDatos(), quita la llamada problemática:
cargarDatos() {
  this.loading = true;
  this.error = '';
  
  // Limpiar suscripción anterior si existe
  if (this.dataSubscription) {
    this.dataSubscription.unsubscribe();
  }

  // Crear nueva suscripción combinada
  this.dataSubscription = new Subscription();
  
  // 1. Cargar historial de entregas
  const historialSub = this.repartidorVentaService.getHistorialEntregas().subscribe({
    next: (historial) => {
      console.log('📊 Historial recibido:', historial.length, 'entregas');
      this.historial = historial;
      // Una vez que tenemos el historial, aplicar filtros
      this.aplicarFiltros();
      this.loading = false; // IMPORTANTE: quitar loading aquí
    },
    error: (error) => {
      console.error('Error cargando historial:', error);
      this.error = 'Error al cargar el historial de entregas.';
      this.loading = false;
    }
  });

  // 2. Cargar total entregado hoy
  const totalSub = this.entregaDineroService.getTotalEntregadoAlAdmin().subscribe({
    next: (response) => {
      if (response.success && response.data && response.data.hoy) {
        this.totalEntregadoAlAdmin = response.data.hoy.total || 0;
        console.log('💰 Total entregado hoy:', this.totalEntregadoAlAdmin);
      }
    },
    error: (error) => {
      console.error('Error cargando total entregado:', error);
      this.totalEntregadoAlAdmin = 0;
    }
  });

  // Agregar las suscripciones (solo las que funcionan)
  this.dataSubscription.add(historialSub);
  this.dataSubscription.add(totalSub);
}


private cargarHistorialEntregas(): Promise<void> {
  return new Promise((resolve, reject) => {
    this.repartidorVentaService.getHistorialEntregas().subscribe({
      next: (historial) => {
        console.log('📊 Historial recibido:', historial.length, 'entregas');
        this.historial = historial;
        resolve();
      },
      error: (error) => {
        console.error('Error cargando historial:', error);
        this.error = 'Error al cargar el historial de entregas.';
        reject(error);
      }
    });
  });
}

private cargarTotalEntregado(): Promise<void> {
  return new Promise((resolve) => {
    this.entregaDineroService.getTotalEntregadoAlAdmin().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.hoy) {
          this.totalEntregadoAlAdmin = response.data.hoy.total || 0;
          console.log('💰 Total entregado hoy:', this.totalEntregadoAlAdmin);
        }
        resolve();
      },
      error: (error) => {
        console.error('Error cargando total entregado:', error);
        this.totalEntregadoAlAdmin = 0;
        resolve();
      }
    });
  });
}

private cargarDineroPendiente(): Promise<void> {
  return new Promise((resolve) => {
    this.entregaDineroService.getDineroRealmentePendiente().subscribe({
      next: (response) => {
        console.log('💰 Dinero realmente pendiente:', response.pendiente);
        // Aquí podrías actualizar una variable específica para dinero pendiente
        resolve();
      },
      error: (error) => {
        console.error('Error cargando dinero pendiente:', error);
        resolve();
      }
    });
  });
}
  // ========== MÉTODOS DE FILTRADO ==========
  aplicarFiltros() {
    let filtrado = [...this.historial];

    // 1. Filtro por búsqueda de texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      filtrado = filtrado.filter(entrega => {
        return (
          entrega.nombre_completo?.toLowerCase().includes(termino) ||
          entrega.razon_social?.toLowerCase().includes(termino) ||
          entrega.direccion?.toLowerCase().includes(termino) ||
          entrega.telefono?.includes(termino) ||
          entrega.id_venta.toString().includes(termino)
        );
      });
    }

    // 2. Filtro por fecha
    if (this.filtroFecha) {
      filtrado = filtrado.filter(entrega =>
        entrega.fecha === this.filtroFecha
      );
    }

    // 3. Filtro por método de pago
    if (this.filtroMetodoPago !== 'todos') {
      filtrado = filtrado.filter(entrega =>
        entrega.id_metodo_pago?.toString() === this.filtroMetodoPago
      );
    }

    // 4. Filtro por estado
    if (this.filtroEstado !== 'todos') {
      filtrado = filtrado.filter(entrega =>
        entrega.estado?.toLowerCase() === this.filtroEstado.toLowerCase()
      );
    }

    // Ordenar por fecha más reciente primero
    filtrado.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion);
      const fechaB = new Date(b.fecha_creacion);
      return fechaB.getTime() - fechaA.getTime();
    });

    this.historialFiltrado = filtrado;
    this.paginaActual = 1; // Reiniciar paginación
    this.actualizarPaginacion();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroFecha = '';
    this.filtroMetodoPago = 'todos';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  removerFiltro(tipo: string) {
    switch (tipo) {
      case 'busqueda':
        this.terminoBusqueda = '';
        break;
      case 'fecha':
        this.filtroFecha = '';
        break;
      case 'metodoPago':
        this.filtroMetodoPago = 'todos';
        break;
      case 'estado':
        this.filtroEstado = 'todos';
        break;
    }
    this.aplicarFiltros();
  }

  hayFiltrosActivos(): boolean {
    return (
      this.terminoBusqueda.trim() !== '' ||
      this.filtroFecha !== '' ||
      this.filtroMetodoPago !== 'todos' ||
      this.filtroEstado !== 'todos'
    );
  }

  // ========== MÉTODOS DE UTILIDAD ==========
  obtenerNombreMetodoPago(idMetodo: string): string {
    const metodos: { [key: string]: string } = {
      '1': 'Efectivo',
      '2': 'Yape',
      '3': 'Transferencia',
      '4': 'Tarjeta'
    };
    return metodos[idMetodo] || 'Desconocido';
  }

  getIconoMetodoPago(idMetodo: number): string {
    const iconos: { [key: number]: string } = {
      1: 'fa-money-bill-wave',
      2: 'fa-mobile-alt',
      3: 'fa-university',
      4: 'fa-credit-card'
    };
    return iconos[idMetodo] || 'fa-credit-card';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatearFechaHora(fechaHora: string): string {
    if (!fechaHora) return '';
    const date = new Date(fechaHora);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

// ========== MÉTODOS DE DINERO ==========
// En historial-entregas.component.ts - MÉTODO MEJORADO
registrarEntregaDinero() {
  const totalPorEntregar = this.getTotalIngresos();
  
  if (totalPorEntregar <= 0) {
    alert('💰 No tienes dinero pendiente de entrega.');
    return;
  }

  // Verificar si ya hay una entrega pendiente/reciente
  this.verificarEntregaReciente().then((tieneEntregaReciente) => {
    if (tieneEntregaReciente) {
      alert('⚠️ Ya tienes una entrega registrada recientemente. Espera unos minutos antes de registrar otra.');
      return;
    }

    const confirmacion = confirm(
      `¿Deseas registrar la entrega de S/ ${totalPorEntregar.toFixed(2)} al administrador?\n\n` +
      `Esto registrará oficialmente que has entregado el dinero recaudado hoy.`
    );

    if (confirmacion) {
      this.registrarEntregaSegura(totalPorEntregar);
    }
  });
}

private async verificarEntregaReciente(): Promise<boolean> {
  try {
    // Obtener entregas del día
    const hoy = new Date().toISOString().split('T')[0];
    const entregasHoy = await this.entregaDineroService.getEntregasPorFecha(hoy).toPromise();
    
    if (entregasHoy && entregasHoy.length > 0) {
      // Verificar si hay entregas en los últimos 30 minutos
      const ahora = new Date();
      const entregasRecientes = entregasHoy.filter(entrega => {
        const fechaEntrega = new Date(entrega.fecha_entrega);
        const diferenciaMinutos = (ahora.getTime() - fechaEntrega.getTime()) / (1000 * 60);
        return diferenciaMinutos < 30;
      });
      
      return entregasRecientes.length > 0;
    }
    return false;
  } catch (error) {
    console.error('Error verificando entregas recientes:', error);
    return false;
  }
}

private registrarEntregaSegura(total: number) {
  this.loading = true;
  
  this.entregaDineroService.registrarEntrega(total, 'efectivo').subscribe({
    next: (response) => {
      console.log('✅ Entrega registrada:', response);
      
      // 1. Mostrar mensaje de éxito
      alert('✅ Entrega de dinero registrada exitosamente');
      
      // 2. Forzar recarga completa de datos
      this.recargarDatosCompletamente();
      
      // 3. Limpiar temporizadores
      this.loading = false;
    },
    error: (error) => {
      console.error('Error registrando entrega:', error);
      alert('❌ Error al registrar entrega: ' + (error.error?.error || error.message));
      this.loading = false;
    }
  });
}

private recargarDatosCompletamente() {
  // Recargar todos los datos
  this.cargarDatos();
  
  // Forzar actualización de vistas
  setTimeout(() => {
    // Actualizar estadísticas
    this.cargarTotalEntregado();
    this.cargarDineroPendiente();
    
    // Forzar detección de cambios
    // @ts-ignore
    this.cdr?.detectChanges();
  }, 1000);
}

verHistorialEntregasDinero() {
  this.entregaDineroService.getHistorialEntregas().subscribe({
    next: (response) => {
      console.log('📋 Respuesta completa del historial:', response);
      
      if (response && response.data && response.data.entregas) {
        const historial = response.data.entregas;
        
        if (historial.length === 0) {
          alert('📋 No hay entregas de dinero registradas.');
          return;
        }

        let mensaje = '📋 Historial de entregas de dinero:\n\n';
        historial.forEach((entrega: any, index: number) => {
          const fecha = entrega.fecha || entrega.fecha_entrega || 'Sin fecha';
          const total = Number(entrega.total) || 0; // ✅ Asegurar que es número
          const metodo = entrega.metodo_entrega || 'efectivo';
          const hora = entrega.hora || '';
          
          mensaje += `${index + 1}. ${fecha} ${hora} - `;
          mensaje += `S/ ${total.toFixed(2)} - ${metodo}`; // ✅ total ya es número
          
          if (entrega.notas) {
            mensaje += `\n   📝 ${entrega.notas}`;
          }
          mensaje += '\n';
        });
        
        if (response.data.estadisticas) {
          const stats = response.data.estadisticas;
          const montoTotal = Number(stats.monto_total) || 0; // ✅ Convertir a número
          
          mensaje += `\n📊 Estadísticas:\n`;
          mensaje += `   - Total entregas: ${stats.total_entregas || 0}\n`;
          mensaje += `   - Monto total: S/ ${montoTotal.toFixed(2)}\n`; // ✅ Usar número
        }
        
        alert(mensaje);
      } else {
        console.error('❌ Estructura inesperada:', response);
        alert('❌ No se pudo obtener el historial.');
      }
    },
    error: (error) => {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  });
}

  // ========== MÉTODOS DE PAGINACIÓN ==========
  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.historialPaginado = this.historialFiltrado.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.historialFiltrado.length / this.itemsPorPagina);
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ========== MÉTODOS DE CÁLCULO ==========
  getTotalEntregas(): number {
    return this.historial.filter(e => e.estado === 'Pagado').length;
  }

  getTotalCanceladas(): number {
    return this.historial.filter(e => e.estado === 'Cancelado').length;
  }

// En historial-entregas.component.ts - MÉTODO MEJORADO
// Modifica getTotalIngresos() para que sea más robusto:
// En historial-entregas.component.ts - MÉTODO CORREGIDO
getTotalIngresos(): number {
  try {
    // 1. Obtener fecha actual (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    
    // 2. Filtrar SOLO ventas pagadas HOY
    const ventasPagadasHoy = this.historial.filter(e => {
      if (!e.fecha_creacion) return false;
      const fechaVenta = new Date(e.fecha_creacion).toISOString().split('T')[0];
      const esPagado = e.estado === 'Pagado';
      const esHoy = fechaVenta === hoy;
      
      console.log(`📊 Validación: ID ${e.id_venta}, Fecha: ${fechaVenta}, Hoy: ${hoy}, Pagado: ${esPagado}, Es hoy: ${esHoy}`);
      
      return esPagado && esHoy;
    });
    
    console.log(`📊 Ventas pagadas HOY: ${ventasPagadasHoy.length} ventas`);
    
    if (ventasPagadasHoy.length === 0) {
      return 0;
    }
    
    // 3. Sumar SOLO ventas de hoy
    const totalVentasHoy = ventasPagadasHoy.reduce((sum, e) => {
      const monto = Number(e.total) || 0;
      console.log(`➕ Sumando venta #${e.id_venta}: S/ ${monto}`);
      return sum + monto;
    }, 0);
    
    // 4. Restar lo YA entregado hoy
    const pendiente = Math.max(0, totalVentasHoy - this.totalEntregadoAlAdmin);
    
    console.log(`💰 RESUMEN DIARIO:`);
    console.log(`   - Ventas pagadas hoy: ${ventasPagadasHoy.length} ventas`);
    console.log(`   - Total ventas hoy: S/ ${totalVentasHoy.toFixed(2)}`);
    console.log(`   - Ya entregado hoy: S/ ${this.totalEntregadoAlAdmin.toFixed(2)}`);
    console.log(`   = POR ENTREGAR: S/ ${pendiente.toFixed(2)}`);
    
    return pendiente;
    
  } catch (error) {
    console.error('Error calculando ingresos:', error);
    return 0;
  }
}
// Método adicional para mostrar información clara
getCantidadVentasHoy(): number {
  const hoy = new Date().toISOString().split('T')[0];
  return this.historial.filter(e => {
    if (!e.fecha_creacion) return false;
    const fechaVenta = new Date(e.fecha_creacion).toISOString().split('T')[0];
    return e.estado === 'Pagado' && fechaVenta === hoy;
  }).length;
}
// Para detectar si hay dinero pendiente de días anteriores
hayDineroPendienteDeDiasAnteriores(): boolean {
  const hoy = new Date().toISOString().split('T')[0];
  const ventasPagadasNoHoy = this.historial.filter(e => {
    if (!e.fecha_creacion) return false;
    const fechaVenta = new Date(e.fecha_creacion).toISOString().split('T')[0];
    return e.estado === 'Pagado' && fechaVenta !== hoy;
  });
  
  return ventasPagadasNoHoy.length > 0;
}

// Para mostrar un total histórico pendiente (solo para información)
getTotalHistoricoPendiente(): number {
  const hoy = new Date().toISOString().split('T')[0];
  const todasVentasPagadas = this.historial.filter(e => e.estado === 'Pagado');
  
  const totalTodasVentas = todasVentasPagadas.reduce((sum, e) => {
    return sum + (Number(e.total) || 0);
  }, 0);
  
  return Math.max(0, totalTodasVentas - this.totalEntregadoAlAdmin);
}
// Asegúrate de que en el HTML uses toFixed(2) correctamente
// Si totalEntregadoAlAdmin es undefined, mostrar 0.00
get totalEntregadoAlAdminFixed(): string {
  return (this.totalEntregadoAlAdmin || 0).toFixed(2);
}

get totalIngresosFixed(): string {
  return this.getTotalIngresos().toFixed(2);
}

// ELIMINAR el método calcularDineroRealmentePendiente() o hacerlo privado y síncrono
private calcularDineroRealmentePendiente(totalVentasHoy: number): number {
  // Ya no hacer llamadas HTTP aquí
  return Math.max(0, totalVentasHoy - this.totalEntregadoAlAdmin);
}
  // ========== MÉTODOS EXISTENTES ==========
  cargarHistorial() {
    this.cargarDatos();
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

  // Utilidad para Math en template
  get Math() {
    return Math;
  }

}