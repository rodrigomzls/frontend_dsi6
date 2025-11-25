// src/app/features/pages/ventas/panel-ventas/panel-ventas.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VentasService, Venta, EstadoVenta } from '../../../../core/services/ventas.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-panel-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-ventas.component.html',
  styleUrls: ['./panel-ventas.component.css']
})
export class PanelVentasComponent implements OnInit {
  public ventasService = inject(VentasService);
  public authService = inject(AuthService);
  public router = inject(Router);

  // Datos
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  estadosVenta: EstadoVenta[] = [];

  // Filtros
  filtroEstado: number = 0; // 0 = Todos
  filtroFecha: string = '';
  searchTerm: string = '';

  // Estados
  loading = false;
  error = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Método temporal para debug
verificarEstadosVentas() {
  console.log('🔍 VERIFICANDO ESTADOS DE VENTAS:');
  this.ventas.forEach(venta => {
    console.log(`Venta ${venta.id_venta}: Estado ID = ${venta.id_estado_venta}, Estado = ${venta.estado}`);
  });
  
  console.log('📋 ESTADOS DISPONIBLES:');
  this.estadosVenta.forEach(estado => {
    console.log(`ID: ${estado.id_estado_venta}, Nombre: ${estado.estado}`);
  });
}

// En panel-ventas.component.ts - agregar método de debug
verificarFechasVentas() {
  console.log('🔍 VERIFICANDO FECHAS DE VENTAS:');
  this.ventas.forEach(venta => {
    console.log(`Venta ${venta.id_venta}: Fecha BD = ${venta.fecha}, Hora BD = ${venta.hora}`);
  });
}

// Llamar después de cargar las ventas
ngOnInit() {
  this.cargarVentas();
  this.estadosVenta = this.ventasService.getEstadosVenta();
  setTimeout(() => {
    this.verificarEstadosVentas();
    this.verificarFechasVentas(); // ✅ NUEVO
  }, 1000);
}
  cargarVentas() {
    this.loading = true;
    this.error = '';

    this.ventasService.getVentas().subscribe({
      next: (ventas) => {
        console.log('📦 Ventas cargadas:', ventas); // Para debug
        this.ventas = ventas;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las ventas';
        this.loading = false;
        console.error('Error cargando ventas:', error);
      }
    });
  }

  // Formatear fecha para mostrar en tabla
// En panel-ventas.component.ts - CORREGIR formatearFechaTabla
formatearFechaTabla(fecha: string): string {
  if (!fecha) return '';
  
  try {
    // ✅ CORREGIDO: Manejar correctamente la zona horaria
    // Si la fecha viene como '2025-11-09', agregar 'T00:00:00' para evitar ajustes de zona horaria
    let fechaAjustada = fecha;
    if (fecha.length === 10) { // Formato YYYY-MM-DD
      fechaAjustada = fecha + 'T00:00:00';
    }
    
    const fechaObj = new Date(fechaAjustada);
    
    if (isNaN(fechaObj.getTime())) {
      console.warn('❌ Fecha inválida en formatearFechaTabla:', fecha);
      return fecha;
    }
    
    // ✅ Usar toLocaleDateString con timeZone explícita
    const fechaFormateada = fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima' // Especificar zona horaria de Perú
    });
    
    console.log(`📅 Formateando fecha: ${fecha} -> ${fechaFormateada}`);
    return fechaFormateada;
    
  } catch (error) {
    console.error('❌ Error en formatearFechaTabla:', error, 'Fecha:', fecha);
    return fecha;
  }
}

  // Formatear hora para mostrar en tabla
  formatearHoraTabla(hora: string): string {
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

  // ✅ CORREGIDO: Método aplicarFiltros mejorado
// En panel-ventas.component.ts - CORREGIR filtro por fecha
aplicarFiltros() {
  console.log('🔍 Aplicando filtros:', {
    estado: this.filtroEstado,
    fecha: this.filtroFecha,
    busqueda: this.searchTerm
  });

  let filtered = [...this.ventas];

  // ✅ CORREGIDO: Filtro por estado con conversión de tipo
  if (this.filtroEstado > 0) {
    const estadoFiltro = Number(this.filtroEstado);
    console.log(`🎯 Filtrando por estado: ${estadoFiltro} (tipo: ${typeof estadoFiltro})`);
    
    filtered = filtered.filter(venta => {
      const coincide = venta.id_estado_venta === estadoFiltro;
      console.log(`   Estado venta ${venta.id_venta}: ${venta.id_estado_venta} (tipo: ${typeof venta.id_estado_venta}) -> ${coincide}`);
      return coincide;
    });
  }

  // ✅ CORREGIDO: Filtro por fecha simplificado
  if (this.filtroFecha) {
    console.log(`📅 Filtrando por fecha: ${this.filtroFecha}`);
    
    filtered = filtered.filter(venta => {
      if (!venta.fecha) {
        console.log(`   Venta ${venta.id_venta}: sin fecha -> false`);
        return false;
      }
      
      const fechaVenta = new Date(venta.fecha).toISOString().split('T')[0];
      const coincide = fechaVenta === this.filtroFecha;
      
      console.log(`   Venta ${venta.id_venta}: ${fechaVenta} -> ${coincide}`);
      return coincide;
    });
  }

  // Filtro por búsqueda
  if (this.searchTerm) {
    const term = this.searchTerm.toLowerCase();
    filtered = filtered.filter(venta => {
      const coincide = 
        venta.nombre_completo?.toLowerCase().includes(term) ||
        venta.id_venta?.toString().includes(term) ||
        venta.estado?.toLowerCase().includes(term) ||
        venta.telefono?.includes(term);
      
      return coincide;
    });
  }

  console.log(`📊 Resultados filtrados: ${filtered.length} de ${this.ventas.length}`);
  console.log('✅ Ventas filtradas:', filtered.map(v => ({ id: v.id_venta, estado: v.id_estado_venta, fecha: v.fecha })));
  
  this.ventasFiltradas = filtered;
  this.totalItems = filtered.length;
  this.currentPage = 1;
}

  // Propiedades computadas para estadísticas - CORREGIDAS
  get ventasPendientes(): number {
    return this.ventas.filter(v => v.id_estado_venta === 1).length;
  }

  get ventasLista(): number {
    return this.ventas.filter(v => v.id_estado_venta === 4).length;
  }

  // Cambiar estado de venta (solo admin)
// En panel-ventas.component.ts - actualiza cambiarEstadoVenta
// En panel-ventas.component.ts - corrige cambiarEstadoVenta
cambiarEstadoVenta(venta: Venta, nuevoEstado: any) {
    if (!this.authService.isAdmin() && !this.authService.isVendedor()) {
        alert('Solo administradores y vendedores pueden cambiar el estado de las ventas');
        return;
    }

    const estadoNumerico = Number(nuevoEstado);
    
    // ✅ RESTRICCIONES PARA VENDEDORES
    if (this.authService.isVendedor() && !this.authService.isAdmin()) {
        const estadosPermitidosVendedor = [1, 4, 8]; // Pendiente, Confirmado, En preparación, Cancelado
        if (!estadosPermitidosVendedor.includes(estadoNumerico)) {
            alert('Los vendedores solo pueden cambiar a: Pendiente, Listo para repartos,Cancelado');
            return;
        }
    }

    const estadoEncontrado = this.estadosVenta.find(e => e.id_estado_venta === estadoNumerico);
    const nombreEstado = estadoEncontrado?.estado || 'Desconocido';

    if (confirm(`¿Cambiar estado a "${nombreEstado}"?`)) {
        this.ventasService.updateEstadoVenta(venta.id_venta!, estadoNumerico).subscribe({
            next: (response) => {
                venta.id_estado_venta = estadoNumerico;
                venta.estado = nombreEstado;
                this.aplicarFiltros();
                alert('✅ Estado actualizado correctamente');
            },
            error: (error) => {
                alert('Error al actualizar el estado');
                console.error('Error actualizando estado:', error);
            }
        });
    }
}

// Método para recargar una venta específica
recargarVenta(id: number) {
  this.ventasService.getVentaById(id).subscribe({
    next: (ventaActualizada) => {
      // Actualizar la venta en el array local
      const index = this.ventas.findIndex(v => v.id_venta === id);
      if (index !== -1) {
        this.ventas[index] = ventaActualizada;
        this.aplicarFiltros();
      }
    },
    error: (error) => {
      console.error('Error recargando venta:', error);
    }
  });
}

  // Obtener nombre del estado
 // En el método getEstadoNombre - agrega debug
// En panel-ventas.component.ts - actualiza getEstadoNombre
getEstadoNombre(idEstado: any): string { // Cambia a 'any'
  // ✅ CONVERTIR a número
  const idNumerico = Number(idEstado);
  
  console.log('🔍 Buscando estado con ID:', {
    idOriginal: idEstado,
    idConvertido: idNumerico,
    tipoOriginal: typeof idEstado,
    tipoConvertido: typeof idNumerico
  });
  
  console.log('📋 Estados disponibles:', this.estadosVenta);
  
  const estado = this.estadosVenta.find(e => e.id_estado_venta === idNumerico);
  const nombre = estado?.estado || 'Desconocido';
  
  console.log('✅ Estado encontrado:', nombre);
  return nombre;
}

  // Obtener clase CSS para el estado
  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'Pendiente': 'estado-pendiente',
      'Listo para repartos': 'estado-listo',
      'En ruta': 'estado-ruta',
      'Pagado': 'estado-pagado',
      'Cancelado': 'estado-cancelado'
    };
    return classes[estado] || 'estado-desconocido';
  }

// En panel-ventas.component.ts - agregar método
goToAsignacionRutas() {
  if (this.authService.hasModuleAccess('ventas_asignacion_rutas')) {
    this.router.navigate(['/ventas/asignacion-rutas']);
  }
}


  // Navegación
  verDetalleVenta(id: number) {
    this.router.navigate(['/ventas', id]);
  }

  nuevaVenta() {
    this.router.navigate(['/ventas/nueva']);
  }

  irAAsignacionRutas() {
  this.router.navigate(['/ventas/asignacion-rutas']);
}
  // Paginación
  get ventasPaginadas(): Venta[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.ventasFiltradas.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  cambiarPagina(pagina: number) {
    this.currentPage = pagina;
  }

  get paginas(): number[] {
    const pages = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEstado = 0;
    this.filtroFecha = '';
    this.searchTerm = '';
    this.aplicarFiltros();
  }
}