// frontend/src/app/features/pages/sunat/pages/sunat-principal/sunat-principal.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { saveAs } from 'file-saver';

import { SunatService, ComprobanteSunat } from '../../../../../core/services/sunat.service';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe'; // Ajusta la ruta

@Component({
  selector: 'app-sunat-principal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    TruncatePipe, // ✅ AGREGAR EL PIPE AQUÍ
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './sunat-principal.component.html',
  styleUrls: ['./sunat-principal.component.css']
})
export class SunatPrincipalComponent implements OnInit {
  private sunatService = inject(SunatService);
  
  // Datos
  comprobantes: ComprobanteSunat[] = [];
  comprobanteSeleccionado: ComprobanteSunat | null = null;
  
  // Filtros
  filtroTipo: string = '';
  filtroEstado: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  searchTerm: string = '';
  
  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalItems: number = 0;
  
  // Estados
  loading: boolean = false;
  error: string = '';
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'id_comprobante',
    'venta',
    'tipo',
    'serie_numero',
    'cliente',
    'total',
    'estado',
    'fecha_envio',
    'acciones'
  ];
  
  // Tipos y estados para filtros
  tiposComprobante: any[] = [
    { value: '', label: 'Todos' },
    { value: 'FACTURA', label: 'Factura' },
    { value: 'BOLETA', label: 'Boleta' }
  ];
  
  estadosComprobante: any[] = [
    { value: '', label: 'Todos' },
    { value: 'ACEPTADO', label: 'Aceptado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
    { value: 'PENDIENTE', label: 'Pendiente' }
  ];

  ngOnInit() {
    this.cargarComprobantes();
  }

  cargarComprobantes() {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      pagina: this.paginaActual,
      limite: this.itemsPorPagina
    };
    
    if (this.filtroTipo) params.tipo = this.filtroTipo;
    if (this.filtroEstado) params.estado = this.filtroEstado;
    if (this.filtroFechaDesde) params.fecha_desde = this.filtroFechaDesde;
    if (this.filtroFechaHasta) params.fecha_hasta = this.filtroFechaHasta;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.sunatService.getComprobantes(params).subscribe({
      next: (response) => {
        this.comprobantes = response.comprobantes;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.error || 'Error al cargar comprobantes';
        this.loading = false;
        console.error('Error cargando comprobantes:', error);
      }
    });
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    this.cargarComprobantes();
  }

  limpiarFiltros() {
    this.filtroTipo = '';
    this.filtroEstado = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.searchTerm = '';
    this.paginaActual = 1;
    this.cargarComprobantes();
  }

  cambiarPagina(event: any) {
    this.paginaActual = event.pageIndex + 1;
    this.itemsPorPagina = event.pageSize;
    this.cargarComprobantes();
  }

  verDetalle(comprobante: ComprobanteSunat) {
    this.comprobanteSeleccionado = comprobante;
  }

  cerrarDetalle() {
    this.comprobanteSeleccionado = null;
  }

  descargarXml(comprobante: ComprobanteSunat) {
    this.sunatService.descargarXml(comprobante.id_comprobante).subscribe({
      next: (blob) => {
        const fecha = new Date().toISOString().split('T')[0];
        saveAs(blob, `comprobante-${comprobante.serie}-${comprobante.numero_secuencial}-${fecha}.xml`);
      },
      error: (error) => {
        console.error('Error descargando XML:', error);
        alert('Error al descargar el XML');
      }
    });
  }

  reenviarComprobante(comprobante: ComprobanteSunat) {
    if (!confirm(`¿Reenviar comprobante ${comprobante.serie}-${comprobante.numero_secuencial} a SUNAT?`)) {
      return;
    }
    
    this.sunatService.reenviarComprobante(comprobante.id_comprobante).subscribe({
      next: (response) => {
        alert('Comprobante reenviado exitosamente');
        this.cargarComprobantes();
      },
      error: (error) => {
        alert('Error al reenviar: ' + (error.error?.error || error.message));
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ACEPTADO': return 'estado-aceptado';
      case 'RECHAZADO': return 'estado-rechazado';
      case 'PENDIENTE': return 'estado-pendiente';
      default: return 'estado-desconocido';
    }
  }

  getTipoClass(tipo: string): string {
    return tipo === 'FACTURA' ? 'tipo-factura' : 'tipo-boleta';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalItems / this.itemsPorPagina);
  }
}