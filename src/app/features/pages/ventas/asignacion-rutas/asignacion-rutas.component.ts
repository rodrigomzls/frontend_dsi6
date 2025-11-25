// src/app/features/pages/ventas/asignacion-rutas/asignacion-rutas.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VentasService, Venta, EstadoVenta } from '../../../../core/services/ventas.service';
import { RepartidorService } from '../../../../core/services/repartidor.service';
import { Repartidor } from '../../../../core/models/repartidor.model';
import { AuthService } from '../../../../core/services/auth.service';

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
  private router = inject(Router);

  // Datos
  ventasListas: Venta[] = []; // Ventas con estado "Listo para reparto" (4)
  ventasEnRuta: Venta[] = []; // Ventas con estado "En ruta" (5)
  repartidores: Repartidor[] = [];
  estadosVenta: EstadoVenta[] = [];

  // Filtros
  filtroRepartidor: number = 0; // 0 = Todos
  filtroZona: string = '';

  // Estados
  loading = false;
  error = '';
  success = '';

  // Agrupaciones para vista
  ventasPorRepartidor: { [key: number]: Venta[] } = {};
  zonasConVentas: { zona: string, cantidad: number }[] = []; // ✅ NUEVO: Para zonas

// En asignacion-rutas.component.ts - CORREGIR el ngOnInit
// En asignacion-rutas.component.ts - CORREGIR el ngOnInit
ngOnInit() {
  // ✅ VERIFICAR POR MÓDULO EN LUGAR DE SOLO ROL ADMIN
  if (!this.authService.hasModuleAccess('ventas_asignacion_rutas')) {
    console.log('❌ Usuario no tiene acceso a asignación de rutas');
    this.router.navigate(['/ventas']);
    return;
  }
  
  this.cargarDatos();
  this.estadosVenta = this.ventasService.getEstadosVenta();
}
// En el método cargarDatos
// ✅ MODIFICAR: Actualizar el método cargarDatos para incluir la última venta
cargarDatos() {
  this.loading = true;
  this.error = '';

  console.log('🔍 Cargando ventas con estado 4 (Listo para reparto)...');
  
  this.ventasService.getVentasPorEstado(4).subscribe({
    next: (ventas) => {
      console.log('📦 Ventas listas para reparto encontradas:', ventas);
      console.log('🔢 Cantidad:', ventas.length);
      
      this.ventasListas = ventas;
      this.calcularZonasConVentas();
      this.loading = false;
      
      // ✅ NUEVO: Cargar información de la última venta
      this.cargarUltimaVentaCreada();
    },
    error: (error) => {
      console.error('❌ Error cargando ventas listas:', error);
      this.error = 'Error cargando ventas listas';
      this.loading = false;
    }
  });

  console.log('🚚 Cargando repartidores activos...');
  this.repartidorService.getRepartidoresActivos().subscribe({
    next: (repartidores) => {
      console.log('✅ Repartidores activos cargados:', repartidores);
      console.log('🔢 Cantidad de repartidores:', repartidores.length);
      
      this.repartidores = repartidores;
      this.agruparVentasPorRepartidor();
    },
    error: (error) => {
      console.error('❌ Error cargando repartidores:', error);
      console.log('📋 Detalles del error:', error.status, error.message);
    }
  });
}
  // ✅ NUEVO: Calcular zonas con cantidad de ventas
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
    
    this.zonasConVentas = Array.from(zonasMap.entries()).map(([zona, cantidad]) => ({
      zona,
      cantidad
    }));
  }

  // Agrupar ventas por repartidor para mostrar en paneles
  agruparVentasPorRepartidor() {
    this.ventasPorRepartidor = {};
    
    // Inicializar con repartidores activos
    this.repartidores.forEach(repartidor => {
      this.ventasPorRepartidor[repartidor.id_repartidor] = [];
    });

    // Agrupar ventas en ruta por repartidor
    this.ventasEnRuta.forEach(venta => {
      if (venta.id_repartidor && this.ventasPorRepartidor[venta.id_repartidor]) {
        this.ventasPorRepartidor[venta.id_repartidor].push(venta);
      }
    });
  }

  // ✅ CORREGIDO: Asignar repartidor a una venta con validación
  // ✅ MEJORAR: Método asignarRepartidor para mejor feedback
asignarRepartidor(venta: Venta, repartidorId: string) {
  const id = parseInt(repartidorId);
  if (!id) return;
  
  const repartidor = this.getRepartidorById(id);
  if (!repartidor) {
    this.error = 'Repartidor no encontrado';
    return;
  }

  if (!confirm(`¿Asignar la venta #${venta.id_venta} a ${repartidor.persona?.nombre_completo}?`)) {
    return;
  }

  this.ventasService.asignarRepartidor(venta.id_venta!, repartidor.id_repartidor).subscribe({
    next: (response) => {
      this.success = `✅ Venta #${venta.id_venta} asignada a ${repartidor.persona?.nombre_completo}. Estado cambiado a EN RUTA.`;
      
      // Actualizar datos locales
      venta.id_repartidor = repartidor.id_repartidor;
      venta.id_estado_venta = 5; // En ruta
      venta.repartidor = repartidor.persona?.nombre_completo;
      venta.estado = 'En ruta'; // Actualizar el nombre del estado
      
      // Mover de listas a en ruta
      this.ventasListas = this.ventasListas.filter(v => v.id_venta !== venta.id_venta);
      this.ventasEnRuta.push(venta);
      this.agruparVentasPorRepartidor();
      this.calcularZonasConVentas();
      
      setTimeout(() => this.success = '', 5000);
    },
    error: (error) => {
      this.error = 'Error asignando repartidor';
      console.error('Error:', error);
    }
  });
}

  // ✅ CORREGIDO: Asignación masiva por zona con validación
  asignarZona(repartidorId: string, zona: string) {
    const id = parseInt(repartidorId);
    if (!id) return;
    
    const repartidor = this.getRepartidorById(id);
    if (!repartidor) {
      this.error = 'Repartidor no encontrado';
      return;
    }

    const ventasZona = this.ventasListas.filter(venta => 
      this.ventaPerteneceAZona(venta, zona)
    );

    if (ventasZona.length === 0) {
      alert('No hay ventas en esta zona');
      return;
    }

    if (!confirm(`¿Asignar ${ventasZona.length} ventas de zona "${zona}" a ${repartidor.persona?.nombre_completo}?`)) {
      return;
    }

    let asignadas = 0;
    let errores = 0;

    ventasZona.forEach(venta => {
      this.ventasService.asignarRepartidor(venta.id_venta!, repartidor.id_repartidor).subscribe({
        next: () => {
          asignadas++;
          venta.id_repartidor = repartidor.id_repartidor;
          venta.id_estado_venta = 5;
          venta.repartidor = repartidor.persona?.nombre_completo;
          
          if (asignadas + errores === ventasZona.length) {
            if (errores > 0) {
              this.success = `Se asignaron ${asignadas} de ${ventasZona.length} ventas a ${repartidor.persona?.nombre_completo}`;
            } else {
              this.success = `Se asignaron ${asignadas} ventas a ${repartidor.persona?.nombre_completo}`;
            }
            this.actualizarListas();
            setTimeout(() => this.success = '', 5000);
          }
        },
        error: (error) => {
          errores++;
          console.error(`Error asignando venta ${venta.id_venta}:`, error);
          
          if (asignadas + errores === ventasZona.length) {
            this.success = `Se asignaron ${asignadas} de ${ventasZona.length} ventas a ${repartidor.persona?.nombre_completo}`;
            this.actualizarListas();
            setTimeout(() => this.success = '', 5000);
          }
        }
      });
    });
  }

  // ✅ NUEVO: Verificar si una venta pertenece a una zona
  ventaPerteneceAZona(venta: Venta, zona: string): boolean {
    if (!venta.direccion) return false;
    
    const direccion = venta.direccion.toLowerCase();
    const zonaLower = zona.toLowerCase();
    
    if (zonaLower.includes('avenidas')) return direccion.includes('av.');
    if (zonaLower.includes('jirones')) return direccion.includes('jr.');
    if (zonaLower.includes('calles')) return direccion.includes('calle');
    if (zonaLower.includes('otras')) return true;
    
    return false;
  }
  // Actualizar listas después de cambios
  actualizarListas() {
    this.ventasListas = this.ventasListas.filter(v => v.id_estado_venta === 4);
    this.ventasEnRuta = this.ventasEnRuta.filter(v => v.id_estado_venta === 5);
    this.agruparVentasPorRepartidor();
    this.calcularZonasConVentas(); // ✅ Recalcular zonas
  }

  // Navegación
// ✅ CORREGIDO: Navegación con validación
// Versión más robusta del método verDetalleVenta
verDetalleVenta(id: any) {
  // Convertir a número y validar
  const ventaId = Number(id);
  
  if (!ventaId || isNaN(ventaId) || ventaId <= 0) {
    console.error('ID de venta inválido:', id, 'Convertido:', ventaId);
    this.error = `ID de venta no válido: ${id}`;
    
    // Mostrar datos de debug
    console.log('Ventas listas:', this.ventasListas);
    console.log('Ventas en ruta:', this.ventasEnRuta);
    
    return;
  }
  
  console.log('✅ Navegando a detalle de venta:', ventaId);
  this.router.navigate(['/ventas', ventaId]);
}
  volverAPanel() {
    this.router.navigate(['/ventas']);
  }

 // ✅ CORREGIR: Método formatearFecha (por si acaso también necesita mejoras)
formatearFecha(fecha: string): string {
  if (!fecha) return '';
  try {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return fecha;
  }
}

  // Obtener nombre del estado
  getEstadoNombre(idEstado: number): string {
    const estado = this.estadosVenta.find(e => e.id_estado_venta === idEstado);
    return estado?.estado || 'Desconocido';
  }

  // ✅ CORREGIDO: Obtener repartidor por ID con tipo seguro
  getRepartidorById(id: number): Repartidor | undefined {
    return this.repartidores.find(r => r.id_repartidor === id);
  }

  // ✅ REEMPLAZADO: Usar el nuevo array zonasConVentas
  get zonasUnicas(): string[] {
    return this.zonasConVentas.map(z => z.zona);
  }

// ✅ NUEVO: Cargar la última venta creada (para asignación inmediata)
// ✅ CORREGIR: Método cargarUltimaVentaCreada usando fecha en lugar de fecha_creacion
cargarUltimaVentaCreada() {
  // Obtener las ventas listas para reparto y buscar la más reciente
  this.ventasService.getVentasPorEstado(4).subscribe({
    next: (ventas) => {
      if (ventas.length > 0) {
        // Ordenar por fecha descendente (la más reciente primero)
        const ventasOrdenadas = ventas.sort((a, b) => 
          new Date(b.fecha + 'T' + b.hora).getTime() - new Date(a.fecha + 'T' + a.hora).getTime()
        );
        
        const ultimaVenta = ventasOrdenadas[0];
        console.log('🆕 Última venta creada:', ultimaVenta);
        
        // Mostrar mensaje informativo
        this.success = `Venta #${ultimaVenta.id_venta} lista para asignar repartidor`;
        
        // Scroll a la venta recién creada (opcional)
        setTimeout(() => {
          const elementoVenta = document.getElementById(`venta-${ultimaVenta.id_venta}`);
          if (elementoVenta) {
            elementoVenta.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    },
    error: (error) => {
      console.error('Error cargando última venta:', error);
    }
  });
}


// ✅ CORREGIR: Método para identificar ventas recientes usando fecha + hora
esVentaReciente(venta: Venta): boolean {
  if (!venta.fecha || !venta.hora) return false;
  
  try {
    const fechaVenta = new Date(venta.fecha + 'T' + venta.hora);
    const ahora = new Date();
    const diferenciaMinutos = (ahora.getTime() - fechaVenta.getTime()) / (1000 * 60);
    
    return diferenciaMinutos <= 10; // Considerar "reciente" si tiene menos de 10 minutos
  } catch (error) {
    console.error('Error calculando fecha de venta:', error);
    return false;
  }
}

// ✅ CORREGIR: Método para formatear hora
formatearHora(hora: string): string {
  if (!hora) return '';
  
  try {
    const [horas, minutos] = hora.split(':');
    const fecha = new Date();
    fecha.setHours(parseInt(horas), parseInt(minutos));
    
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