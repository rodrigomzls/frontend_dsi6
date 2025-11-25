// inventario-reportes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventarioService } from '../../../../core/services/inventario.service';
import { ExportService } from '../../../../core/services/export.service';

@Component({
  selector: 'app-inventario-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './inventario-reportes.component.html',
  styleUrls: ['./inventario-reportes.component.css']
})
export class InventarioReportesComponent implements OnInit {
  filtrosForm: FormGroup;
  datosCargados = false;
  cargando = false;
  exportando = false;
  
  metricas = {
    totalProductos: 0,
    valorTotal: 0,
    totalMovimientos: 0
  };

  datosReporte: any[] = [];
  productosConProblemas = 0;
  filtrosAplicados: any = {};

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) {
    this.filtrosForm = this.fb.group({
      tipoReporte: ['stock-general'],
      fechaInicio: [null],
      fechaFin: [null]
    });
  }

  ngOnInit() {}

generarReporte() {
  if (this.filtrosForm.invalid) {
    this.snackBar.open('Por favor complete los filtros requeridos', 'Cerrar', {
      duration: 3000
    });
    return;
  }

  this.cargando = true;
  const filtros = this.filtrosForm.value;
  this.filtrosAplicados = { ...filtros };

  // ✅ CORRECCIÓN: Formatear fechas para incluir días completos
  const filtrosParaBackend = {
    tipoReporte: filtros.tipoReporte,
    fechaInicio: filtros.fechaInicio ? this.formatearFecha(filtros.fechaInicio, 'inicio') : null,
    fechaFin: filtros.fechaFin ? this.formatearFecha(filtros.fechaFin, 'fin') : null
  };

  console.log('Filtros enviados al backend:', filtrosParaBackend);

  this.inventarioService.getReporteStock(filtrosParaBackend).subscribe({
    next: (response: any) => {
      this.cargando = false;
      this.datosCargados = true;
      
      // Procesar datos del backend
      this.procesarDatosReporte(response);
      
      this.snackBar.open('Reporte generado exitosamente', 'Cerrar', {
        duration: 3000
      });
    },
    error: (error) => {
      this.cargando = false;
      console.error('Error al generar reporte:', error);
      this.snackBar.open('Error al generar el reporte', 'Cerrar', {
        duration: 3000
      });
    }
  });
}
  /**
   * Exportar a PDF
   */
  async exportarPDF() {
    if (!this.datosCargados) {
      this.snackBar.open('Primero genere un reporte', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }

    this.exportando = true;
    
    try {
      // Intentar exportar la tabla completa (método con captura de pantalla)
      await this.exportService.exportToPDF(
        'tabla-reporte',
        this.generarNombreArchivo('inventario'),
        this.generarTituloReporte(),
        this.metricas
      );
      
      this.snackBar.open('PDF exportado exitosamente', 'Cerrar', { 
        duration: 3000 
      });
    } catch (error) {
      console.warn('Error en exportación PDF avanzada, usando método simple:', error);
      
      // Fallback: método simple
      try {
        this.exportService.exportSimplePDF(
          this.datosReporte,
          this.generarNombreArchivo('inventario'),
          this.generarTituloReporte(),
          this.metricas
        );
        
        this.snackBar.open('PDF exportado exitosamente', 'Cerrar', { 
          duration: 3000 
        });
      } catch (simpleError) {
        console.error('Error en exportación PDF simple:', simpleError);
        this.snackBar.open('Error al exportar PDF', 'Cerrar', { 
          duration: 3000 
        });
      }
    } finally {
      this.exportando = false;
    }
  }

  /**
   * Exportar a Excel
   */
  exportarExcel() {
    if (!this.datosCargados) {
      this.snackBar.open('Primero genere un reporte', 'Cerrar', { 
        duration: 3000 
      });
      return;
    }

    this.exportando = true;

    try {
      this.exportService.exportToExcel(
        this.datosReporte,
        this.generarNombreArchivo('inventario'),
        this.generarNombreHoja()
      );
      
      this.snackBar.open('Excel exportado exitosamente', 'Cerrar', { 
        duration: 3000 
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      this.snackBar.open('Error al exportar Excel', 'Cerrar', { 
        duration: 3000 
      });
    } finally {
      this.exportando = false;
    }
  }

  /**
   * Generar nombre de archivo con timestamp
   */
  private generarNombreArchivo(base: string): string {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    
    let tipoReporte = 'general';
    switch(this.filtrosAplicados.tipoReporte) {
      case 'stock-bajo': tipoReporte = 'stock-bajo'; break;
      case 'agotado': tipoReporte = 'agotados'; break;
    }
    
    return `${base}_${tipoReporte}_${timestamp}`;
  }

  /**
   * Generar título del reporte según filtros
   */
  private generarTituloReporte(): string {
    let titulo = 'Reporte de Inventario - ';
    
    switch(this.filtrosAplicados.tipoReporte) {
      case 'stock-general':
        titulo += 'Stock General';
        break;
      case 'stock-bajo':
        titulo += 'Stock Bajo';
        break;
      case 'agotado':
        titulo += 'Productos Agotados';
        break;
      default:
        titulo += 'Inventario';
    }

    // Agregar rango de fechas si está disponible
    if (this.filtrosAplicados.fechaInicio && this.filtrosAplicados.fechaFin) {
      const fechaInicio = new Date(this.filtrosAplicados.fechaInicio).toLocaleDateString('es-PE');
      const fechaFin = new Date(this.filtrosAplicados.fechaFin).toLocaleDateString('es-PE');
      titulo += ` (${fechaInicio} al ${fechaFin})`;
    }

    return titulo;
  }

  /**
   * Generar nombre de hoja Excel
   */
  private generarNombreHoja(): string {
    switch(this.filtrosAplicados.tipoReporte) {
      case 'stock-general': return 'Stock General';
      case 'stock-bajo': return 'Stock Bajo';
      case 'agotado': return 'Productos Agotados';
      default: return 'Inventario';
    }
  }

// En inventario-reportes.component.ts - actualizar procesarDatosReporte
private procesarDatosReporte(response: any) {
  console.log('Respuesta del backend:', response);
  
  // Actualizar métricas
  this.metricas = {
    totalProductos: response.metricas?.total_productos || 0,
    valorTotal: parseFloat(response.metricas?.valor_total) || 0,
    // ✅ USAR el total de movimientos calculado por el backend
    totalMovimientos: response.metricas?.total_movimientos || 
                     response.movimientos?.reduce((sum: number, mov: any) => 
                       sum + (mov.cantidad_movimientos || 0), 0) || 0
  };

  // Procesar productos para la tabla
  this.datosReporte = response.productos?.map((producto: any) => ({
    producto: producto.nombre,
    descripcion: producto.descripcion,
    stockActual: producto.stock,
    stockMinimo: producto.stock_minimo,
    precio: producto.precio,
    estado: producto.estado_stock,
    categoria: producto.categoria,
    marca: producto.marca,
    valorTotal: producto.valor_total
  })) || [];

  // Calcular productos con problemas
  this.productosConProblemas = this.datosReporte.filter(item => 
    item.estado === 'bajo' || item.estado === 'agotado'
  ).length;

  console.log('Métricas calculadas:', this.metricas);
  console.log('Productos con problemas:', this.productosConProblemas);
}

  // Métodos auxiliares para la vista
  getRowClass(item: any): string {
    return `row-${item.estado}`;
  }

  getStockClass(item: any): string {
    return item.stockActual <= item.stockMinimo ? 'stock-bajo' : 'stock-normal';
  }

  getDiferenciaClass(item: any): string {
    const diferencia = item.stockActual - item.stockMinimo;
    if (diferencia >= 10) return 'diferencia-positiva';
    if (diferencia >= 0) return 'diferencia-normal';
    if (diferencia >= -5) return 'diferencia-negativa';
    return 'diferencia-critica';
  }

  getEstadoIcon(estado: string): string {
    switch(estado) {
      case 'normal': return 'check_circle';
      case 'bajo': return 'warning';
      case 'agotado': return 'cancel';
      default: return 'help';
    }
  }

  getEstadoText(estado: string): string {
    switch(estado) {
      case 'normal': return 'NORMAL';
      case 'bajo': return 'BAJO';
      case 'agotado': return 'AGOTADO';
      default: return estado.toUpperCase();
    }
  }

  getEstadoTooltip(item: any): string {
    switch(item.estado) {
      case 'normal':
        return `Stock saludable. ${item.stockActual - item.stockMinimo} unidades por encima del mínimo`;
      case 'bajo':
        return `Stock bajo. ${item.stockMinimo - item.stockActual} unidades por debajo del mínimo requerido`;
      case 'agotado':
        return 'Producto agotado. Requiere reposición inmediata';
      default:
        return 'Estado desconocido';
    }
  }

  contarPorEstado(estado: string): number {
    return this.datosReporte.filter(item => item.estado === estado).length;
  }

  // ✅ CORRECCIÓN: Mejorar el formateo de fechas
private formatearFecha(fecha: Date, tipo: 'inicio' | 'fin' = 'inicio'): string {
  if (tipo === 'fin') {
    // Para fecha fin, no ajustamos - el backend se encarga de incluir todo el día
    return fecha.toISOString().split('T')[0];
  }
  // Para fecha inicio, usar el día completo desde las 00:00
  return fecha.toISOString().split('T')[0];
}
}