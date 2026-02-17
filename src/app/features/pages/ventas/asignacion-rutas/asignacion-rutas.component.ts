// src/app/features/pages/ventas/asignacion-rutas/asignacion-rutas.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VentasService, Venta, EstadoVenta } from '../../../../core/services/ventas.service';
import { RepartidorService } from '../../../../core/services/repartidor.service';
import { Repartidor } from '../../../../core/models/repartidor.model';
import { AuthService } from '../../../../core/services/auth.service';
import { FechaService } from '../../../../core/services/fecha.service'; // ← AÑADIR
import Swal from 'sweetalert2';

@Component({
  selector: 'app-asignacion-rutas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignacion-rutas.component.html',
  styleUrls: ['./asignacion-rutas.component.css']
})
export class AsignacionRutasComponent implements OnInit {
  private ventasService = inject(VentasService);
  private repartidorService = inject(RepartidorService);
  private authService = inject(AuthService);
  public fechaService = inject(FechaService); // ← AÑADIR
  private router = inject(Router);

  // Datos
  ventasListas: Venta[] = [];
  ventasEnRuta: Venta[] = [];
  repartidores: Repartidor[] = [];
  estadosVenta: EstadoVenta[] = [];

  // Estados
  loading = false;
  error = '';
  success = '';

  // Agrupaciones para vista
  ventasPorRepartidor: { [key: number]: Venta[] } = {};
  zonasConVentas: { zona: string, cantidad: number }[] = [];

  ngOnInit() {
    if (!this.authService.hasModuleAccess('ventas_asignacion_rutas')) {
      console.log('❌ Usuario no tiene acceso a asignación de rutas');
      this.router.navigate(['/ventas']);
      return;
    }
    
    this.cargarDatos();
    this.estadosVenta = this.ventasService.getEstadosVenta();
  }

  cargarDatos() {
  this.loading = true;
  this.error = '';

  // Cargar ventas listas para reparto
  this.ventasService.getVentasPorEstado(4).subscribe({
    next: (ventas) => {
      console.log('📦 Ventas listas para reparto encontradas:', ventas.length);
      
      // DEBUG: Mostrar información detallada de cada venta
      ventas.forEach((venta, index) => {
        console.log(`Venta ${index + 1}:`, {
          id: venta.id_venta,
          estadoId: venta.id_estado_venta,
          estado: venta.estado,
          total: venta.total,
          nombre: venta.nombre_completo
        });
      });
      
      this.ventasListas = ventas;
      this.calcularZonasConVentas();
      this.loading = false;
      this.cargarUltimaVentaCreada();
    },
    error: (error) => {
      console.error('❌ Error cargando ventas listas:', error);
      this.error = 'Error cargando ventas listas para reparto';
      this.loading = false;
    }
  });

    // Cargar repartidores activos
    this.repartidorService.getRepartidoresActivos().subscribe({
      next: (repartidores) => {
        console.log('🚚 Repartidores activos cargados:', repartidores.length);
        this.repartidores = repartidores;
        this.agruparVentasPorRepartidor();
      },
      error: (error) => {
        console.error('❌ Error cargando repartidores:', error);
        this.error = 'Error cargando información de repartidores';
      }
    });

    // Cargar ventas en ruta
    this.ventasService.getVentasPorEstado(5).subscribe({
      next: (ventas) => {
        this.ventasEnRuta = ventas;
        this.agruparVentasPorRepartidor();
      },
      error: (error) => {
        console.error('❌ Error cargando ventas en ruta:', error);
      }
    });
  }

  // ✅ MEJORADO: Método de asignación con redirección automática
  asignarRepartidor(venta: Venta, repartidorId: string) {
    const id = parseInt(repartidorId);
    if (!id) return;
    
    const repartidor = this.getRepartidorById(id);
    if (!repartidor) {
      this.mostrarError('Repartidor no encontrado');
      return;
    }

    Swal.fire({
      title: '¿Asignar repartidor?',
      html: `¿Desea asignar la venta <strong>#${venta.id_venta}</strong> al repartidor <strong>${repartidor.persona?.nombre_completo}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      customClass: {
        popup: 'swal-custom-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarAsignacion(venta, repartidor);
      } else {
        // Resetear el select si cancela
        const selectElement = document.querySelector(`#venta-${venta.id_venta} select`) as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = '';
        }
      }
    });
  }

  private procesarAsignacion(venta: Venta, repartidor: Repartidor) {
    this.ventasService.asignarRepartidor(venta.id_venta!, repartidor.id_repartidor).subscribe({
      next: (response) => {
        // Mostrar mensaje de éxito
        Swal.fire({
          title: '✅ Asignación Exitosa',
          html: `La venta <strong>#${venta.id_venta}</strong> ha sido asignada a <strong>${repartidor.persona?.nombre_completo}</strong>`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          customClass: {
            popup: 'swal-custom-popup success'
          }
        }).then(() => {
          // ✅ REDIRECCIÓN AUTOMÁTICA después del mensaje
          this.router.navigate(['/ventas']);
        });

        // Actualizar datos locales inmediatamente
        this.actualizarDatosLocales(venta, repartidor);
      },
      error: (error) => {
        console.error('Error asignando repartidor:', error);
        this.mostrarError('Error al asignar el repartidor. Por favor, intente nuevamente.');
        
        // Resetear el select en caso de error
        const selectElement = document.querySelector(`#venta-${venta.id_venta} select`) as HTMLSelectElement;
        if (selectElement) {
          selectElement.value = '';
        }
      }
    });
  }

  private actualizarDatosLocales(venta: Venta, repartidor: Repartidor) {
    // Actualizar la venta
    venta.id_repartidor = repartidor.id_repartidor;
    venta.id_estado_venta = 5;
    venta.repartidor = repartidor.persona?.nombre_completo;
    venta.estado = 'En ruta';
    
    // Mover de listas a en ruta
    this.ventasListas = this.ventasListas.filter(v => v.id_venta !== venta.id_venta);
    this.ventasEnRuta.push(venta);
    
    // Actualizar agrupaciones
    this.agruparVentasPorRepartidor();
    this.calcularZonasConVentas();
  }

  private mostrarError(mensaje: string) {
    Swal.fire({
      title: '❌ Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      customClass: {
        popup: 'swal-custom-popup error'
      }
    });
  }

  // Resto de métodos existentes (sin cambios)
  calcularZonasConVentas() {
    const zonasMap = new Map<string, number>();
    this.ventasListas.forEach(venta => {
      if (venta.direccion) {
        const direccion = venta.direccion.toLowerCase();
        let zona = 'Otras Zonas';
        if (direccion.includes('av.')) zona = 'Avenidas Principales';
        else if (direccion.includes('jr.')) zona = 'Jirones';
        else if (direccion.includes('calle')) zona = 'Calles';
        zonasMap.set(zona, (zonasMap.get(zona) || 0) + 1);
      }
    });
    this.zonasConVentas = Array.from(zonasMap.entries()).map(([zona, cantidad]) => ({ zona, cantidad }));
  }

  agruparVentasPorRepartidor() {
    this.ventasPorRepartidor = {};
    this.repartidores.forEach(repartidor => {
      this.ventasPorRepartidor[repartidor.id_repartidor] = [];
    });
    this.ventasEnRuta.forEach(venta => {
      if (venta.id_repartidor && this.ventasPorRepartidor[venta.id_repartidor]) {
        this.ventasPorRepartidor[venta.id_repartidor].push(venta);
      }
    });
  }

 // En asignacion-rutas.component.ts, modificar el método verDetalleVenta:
verDetalleVenta(id: any) {
  const ventaId = Number(id);
  if (!ventaId || isNaN(ventaId) || ventaId <= 0) {
    this.mostrarError('ID de venta no válido');
    return;
  }
  
  // Guardar la ruta actual antes de navegar
  localStorage.setItem('previous_ventas_route', '/ventas/asignacion-rutas');
  
  this.router.navigate(['/ventas', ventaId]);
}

  volverAPanel() {
    this.router.navigate(['/ventas']);
  }

// REEMPLAZAR los métodos formatearFecha y formatearHora


  getRepartidorById(id: number): Repartidor | undefined {
    return this.repartidores.find(r => r.id_repartidor === id);
  }

  cargarUltimaVentaCreada() {
    if (this.ventasListas.length > 0) {
      const ventasOrdenadas = this.ventasListas.sort((a, b) => 
        new Date(b.fecha + 'T' + b.hora).getTime() - new Date(a.fecha + 'T' + a.hora).getTime()
      );
      const ultimaVenta = ventasOrdenadas[0];
      this.success = `Venta #${ultimaVenta.id_venta} lista para asignar repartidor`;
      
      setTimeout(() => {
        const elementoVenta = document.getElementById(`venta-${ultimaVenta.id_venta}`);
        if (elementoVenta) {
          elementoVenta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }

  esVentaReciente(venta: Venta): boolean {
    if (!venta.fecha || !venta.hora) return false;
    try {
      const fechaVenta = new Date(venta.fecha + 'T' + venta.hora);
      const ahora = new Date();
      const diferenciaMinutos = (ahora.getTime() - fechaVenta.getTime()) / (1000 * 60);
      return diferenciaMinutos <= 10;
    } catch (error) {
      return false;
    }
  }
// Método para cancelar venta antes de asignar repartidor
cancelarVenta(idVenta: number, venta: Venta) {
  // Verificar permisos
  if (!this.authService.isAdmin() && !this.authService.isVendedor()) {
    alert('Solo administradores y vendedores pueden cancelar ventas');
    return;
  }

  // Manejar nombre undefined
  const nombreCliente = venta.nombre_completo || 'Cliente sin nombre';
  const totalVenta = venta.total || 0;

  // Mostrar confirmación con SweetAlert2
  Swal.fire({
    title: '⚠️ Cancelar Venta',
    html: `¿Está seguro de cancelar la venta <strong>#${idVenta}</strong>?<br><br>
           <strong>Cliente:</strong> ${nombreCliente}<br>
           <strong>Total:</strong> S/ ${totalVenta}<br>
           <strong>Fecha:</strong> ${this.fechaService.formatFechaTabla(venta.fecha)} ${this.fechaService.formatHora(venta.hora)}<br><br>
           <span class="text-danger" style="color: #dc3545; font-weight: bold;">
             ⚠️ Esta acción cambiará el estado a "Cancelado" y no se podrá revertir.
           </span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar venta',
    cancelButtonText: 'No, mantener venta',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'swal-custom-popup'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Mostrar loading
      Swal.fire({
        title: 'Procesando cancelación...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Llamar al servicio para cancelar la venta
      this.ventasService.updateEstadoVenta(idVenta, 8).subscribe({
        next: (response) => {
          // Remover de la lista local
          this.ventasListas = this.ventasListas.filter(v => v.id_venta !== idVenta);
          
          // Actualizar estadísticas
          this.calcularZonasConVentas();
          
          Swal.fire({
            title: '✅ Venta Cancelada',
            html: `La venta <strong>#${idVenta}</strong> ha sido cancelada correctamente.<br><br>
                   <strong>Cliente:</strong> ${nombreCliente}<br>
                   <strong>Total:</strong> S/ ${totalVenta}`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true,
            willClose: () => {
              // Recargar datos si es necesario
              if (this.ventasListas.length === 0) {
                this.cargarDatos();
              }
            }
          });
        },
        error: (error) => {
          console.error('Error cancelando venta:', error);
          Swal.fire({
            title: '❌ Error',
            html: `No se pudo cancelar la venta:<br><br>
                   <strong>${error.error?.error || error.message || 'Error del sistema'}</strong><br><br>
                   Por favor, intente nuevamente.`,
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        }
      });
    }
  });
}
}