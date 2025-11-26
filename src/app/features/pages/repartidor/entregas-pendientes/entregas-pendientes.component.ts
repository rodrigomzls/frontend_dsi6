// src/app/features/pages/repartidor/entregas-pendientes/entregas-pendientes.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorVentaService } from '../../../../core/services/repartidor-venta.service';
import { RepartidorVenta } from '../../../../core/models/repartidor-venta.model';
import { AuthService } from '../../../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
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

// Reemplaza el método marcarComoEntregado:
async marcarComoEntregado(idVenta: number) {
  const entrega = this.entregas.find(e => e.id_venta === idVenta);
  if (!entrega) return;

  // Verificación especial para Yape
  if (entrega.id_metodo_pago === 2) {
    const yapeConfirmado = await this.verificarPagoYape(idVenta);
    if (!yapeConfirmado) return;
  }

  this.repartidorVentaService.verificarPuedeMarcarPagado(idVenta).subscribe({
    next: (verificacion) => {
      if (!verificacion.puede) {
        Swal.fire({
          title: '❌ No se puede completar',
          text: verificacion.mensaje,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      // ✅ ELIMINAR el confirm y proceder directamente
      this.repartidorVentaService.marcarComoPagado(idVenta).subscribe({
        next: () => {
          // ✅ SweetAlert2 automático para éxito
          Swal.fire({
            title: '✅ ¡Pagado!',
            text: 'Entrega marcada como pagada correctamente',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true,
            willClose: () => {
              this.cargarEntregasPendientes();
            }
          });
        },
        error: (error) => {
          console.error('Error marcando como pagado:', error);
          Swal.fire({
            title: '❌ Error',
            text: error.error?.error || 'No se pudo completar la operación',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        }
      });
    },
    error: (error) => {
      console.error('Error en verificación:', error);
      Swal.fire({
        title: '❌ Error',
        text: 'Error al verificar condiciones de pago',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });
}


// Reemplaza el método marcarComoCancelado completo por este:
marcarComoCancelado(idVenta: number) {
  const entrega = this.entregas.find(e => e.id_venta === idVenta);
  if (!entrega) return;

  const motivosPredefinidos: { [key: string]: string } = {
    'cliente_no_disponible': '👤 Cliente no disponible en la dirección',
    'direccion_incorrecta': '📍 Dirección incorrecta o inexistente',
    'producto_danado': '📦 Producto dañado durante el transporte',
    'cliente_rechazo': '❌ Cliente rechazó el pedido',
    'problema_vehiculo': '🚚 Problema con el vehículo de reparto',
    'cliente_no_pago': '💳 Cliente no puede realizar el pago',
    'zona_insegura': '⚠️ Zona insegura para la entrega',
    'horario_inconveniente': '⏰ Horario de entrega inconveniente',
    'otro': '📝 Otro motivo (especificar)'
  };

  Swal.fire({
    title: '❌ Cancelar Entrega',
    html: `
      <div style="text-align: left; margin-bottom: 1rem;">
        <p><strong>Entrega #${idVenta}</strong></p>
        <p><strong>Cliente:</strong> ${entrega.nombre_completo}</p>
        <p><strong>Total:</strong> S/ ${entrega.total}</p>
        <p><strong>Dirección:</strong> ${entrega.direccion}</p>
      </div>
      <p>Seleccione el motivo de cancelación:</p>
    `,
    input: 'select',
    inputOptions: motivosPredefinidos,
    inputPlaceholder: 'Seleccione un motivo...',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe seleccionar un motivo de cancelación';
      }
      return null;
    },
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Mantener entrega',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    width: '600px'
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const motivoKey = result.value;
      let motivo = motivosPredefinidos[motivoKey];
      
      // Si selecciona "otro", pedir texto personalizado
      if (motivoKey === 'otro') {
        this.solicitarMotivoPersonalizado(idVenta, entrega);
      } else {
        this.confirmarCancelacion(idVenta, entrega, motivo);
      }
    }
  });
}

private solicitarMotivoPersonalizado(idVenta: number, entrega: any) {
  Swal.fire({
    title: '✏️ Motivo de cancelación',
    html: `
      <div style="text-align: left; margin-bottom: 1rem;">
        <p><strong>Entrega #${idVenta}</strong> - ${entrega.nombre_completo}</p>
        <p>Describa detalladamente el motivo de la cancelación:</p>
      </div>
    `,
    input: 'textarea',
    inputLabel: 'Motivo personalizado',
    inputPlaceholder: 'Ingrese el motivo específico de la cancelación...',
    inputAttributes: {
      'maxlength': '500',
      'minlength': '10'
    },
    inputValidator: (value) => {
      if (!value) {
        return 'Debe ingresar un motivo para la cancelación';
      }
      if (value.length < 10) {
        return 'El motivo debe tener al menos 10 caracteres';
      }
      if (value.length > 500) {
        return 'El motivo no puede exceder los 500 caracteres';
      }
      return null;
    },
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Volver',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d'
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.confirmarCancelacion(idVenta, entrega, result.value);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // Si presiona "Volver", regresar a la selección de motivos
      this.marcarComoCancelado(idVenta);
    }
  });
}

private confirmarCancelacion(idVenta: number, entrega: any, motivo: string) {
  Swal.fire({
    title: '⚠️ Confirmar Cancelación',
    html: `
      <div style="text-align: left;">
        <p>¿Está seguro de cancelar la entrega?</p>
        <div style="background: #fff3cd; padding: 1rem; border-radius: 0.375rem; margin: 1rem 0;">
          <p><strong>Entrega #${idVenta}</strong></p>
          <p><strong>Cliente:</strong> ${entrega.nombre_completo}</p>
          <p><strong>Motivo:</strong> ${motivo}</p>
        </div>
        <p style="color: #dc3545; font-weight: bold;">
          ⚠️ Esta acción no se puede deshacer
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar entrega',
    cancelButtonText: 'No, mantener',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    focusCancel: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.procesarCancelacion(idVenta, motivo);
    }
  });
}

private procesarCancelacion(idVenta: number, motivo: string) {
  // Mostrar loading
  Swal.fire({
    title: 'Procesando cancelación...',
    text: 'Por favor espere',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  this.repartidorVentaService.marcarComoCancelado(idVenta, motivo).subscribe({
    next: () => {
      Swal.fire({
        title: '✅ Cancelada',
        text: 'La entrega ha sido cancelada correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        willClose: () => {
          this.cargarEntregasPendientes();
        }
      });
    },
    error: (error) => {
      console.error('Error cancelando entrega:', error);
      Swal.fire({
        title: '❌ Error',
        html: `
          <div style="text-align: left;">
            <p>No se pudo cancelar la entrega:</p>
            <p><strong>${error.error?.error || 'Error del sistema'}</strong></p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });
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

 // También actualiza cambiarMetodoPago para usar SweetAlert2:
cambiarMetodoPago(idVenta: number) {
  const entrega = this.entregas.find(e => e.id_venta === idVenta);
  if (!entrega) return;

  const metodosDisponibles = this.metodosPago.filter(
    metodo => metodo.id_metodo_pago !== entrega.id_metodo_pago
  );

  if (metodosDisponibles.length === 0) {
    Swal.fire({
      title: 'ℹ️ Información',
      text: 'No hay otros métodos de pago disponibles',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  // Crear opciones para SweetAlert2
  const opciones = metodosDisponibles.map(metodo => ({
    text: metodo.metodo_pago,
    value: metodo.id_metodo_pago
  }));

  Swal.fire({
    title: `Cambiar método de pago - Entrega #${idVenta}`,
    text: `Método actual: ${entrega.metodo_pago}`,
    input: 'select',
    inputOptions: opciones.reduce((acc, opcion) => {
      acc[opcion.value] = opcion.text;
      return acc;
    }, {} as {[key: number]: string}),
    inputPlaceholder: 'Seleccione nuevo método',
    showCancelButton: true,
    confirmButtonText: 'Cambiar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe seleccionar un método de pago';
      }
      return null;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const nuevoMetodoId = parseInt(result.value);
      const nuevoMetodo = this.metodosPago.find(m => m.id_metodo_pago === nuevoMetodoId);
      
      if (nuevoMetodo) {
        this.repartidorVentaService.cambiarMetodoPago(idVenta, nuevoMetodoId).subscribe({
          next: (response) => {
            Swal.fire({
              title: '✅ Método cambiado',
              text: `Método de pago cambiado a: ${nuevoMetodo.metodo_pago}`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true
            });
            
            // Actualizar la entrega localmente
            const entregaIndex = this.entregas.findIndex(e => e.id_venta === idVenta);
            if (entregaIndex !== -1) {
              this.entregas[entregaIndex].id_metodo_pago = nuevoMetodoId;
              this.entregas[entregaIndex].metodo_pago = nuevoMetodo.metodo_pago;
            }
          },
          error: (error) => {
            console.error('Error cambiando método de pago:', error);
            Swal.fire({
              title: '❌ Error',
              text: error.error?.error || 'No se pudo cambiar el método de pago',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    }
  });
}

// Reemplaza el método verificarPagoYape:
verificarPagoYape(idVenta: number): Promise<boolean> {
  return new Promise((resolve) => {
    Swal.fire({
      title: '🔐 Verificación de Pago Yape',
      html: `
        <div style="text-align: left;">
          <p><strong>Por seguridad, confirme:</strong></p>
          <p>✅ ¿Escaneó el código QR del cliente?</p>
          <p>✅ ¿Verificó que el pago apareció en su aplicación Yape?</p>
          <p>✅ ¿Confirmó el monto correcto (S/ ${this.getTotalVenta(idVenta)})?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, todo correcto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      resolve(result.isConfirmed);
    });
  });
}
  // Método auxiliar para obtener total
  private getTotalVenta(idVenta: number): number {
    const entrega = this.entregas.find(e => e.id_venta === idVenta);
    return entrega ? entrega.total : 0;
  }
}