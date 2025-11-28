import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MovimientoStockService } from '../../../core/services/movimiento-stock.service';
import { MovimientoStockFormComponent } from '../../../components/movimiento-stock-form/movimiento-stock-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { MovimientoStock } from '../../../core/models/movimiento-stock.model';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MovimientoStockUnificadoFormComponent } from '../../../components/movimiento-stock-unificado-form/movimiento-stock-unificado-form.component';
import { MatDatepickerModule } from '@angular/material/datepicker'; // ✅ Añadir
import { MatNativeDateModule } from '@angular/material/core'; // ✅ Añadir
@Component({
  selector: 'app-movimiento-stock-list',
  templateUrl: './movimiento-stock-list.component.html',
  styleUrls: ['./movimiento-stock-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule, // ✅ Añadir
    MatNativeDateModule // ✅ Añadir
  ]
})
export class MovimientoStockListComponent implements OnInit, AfterViewInit {
  // En la clase MovimientoStockListComponent, actualizar displayedColumns:
displayedColumns: string[] = ['id', 'producto', 'tipo', 'lote', 'cantidad', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<MovimientoStock>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private movimientoService: MovimientoStockService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}


  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

 // En el método loadMovimientos() del componente
loadMovimientos(): void {
  this.isLoading = true;
  this.movimientoService.getMovimientos().subscribe({
    next: rows => { 
      console.log('📦 Movimientos cargados:', rows); // ✅ DEBUG: Ver datos
      this.dataSource.data = rows; 
      this.isLoading = false; 
    },
    error: () => { this.isLoading = false; this.showError('Error al cargar movimientos'); }
  });
}

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

 addMovimiento(): void {
  const dialogRef = this.dialog.open(MovimientoStockFormComponent, { 
    width: '500px',
    maxWidth: '95vw',
    maxHeight: '85vh', // ✅ LIMITAR ALTURA MÁXIMA
    panelClass: 'movimiento-stock-dialog' // ✅ CLASE PARA ESTILOS GLOBALES
  });
  
  dialogRef.afterClosed().subscribe(res => { 
    if (res) this.loadMovimientos(); 
  });
}

editMovimiento(movimiento: MovimientoStock): void {
  const dialogRef = this.dialog.open(MovimientoStockFormComponent, { 
    width: '500px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    panelClass: 'movimiento-stock-dialog',
    data: movimiento // ✅ CORREGIDO: Enviar el objeto directamente, no {movimiento}
  });
  dialogRef.afterClosed().subscribe(res => { 
    if(res) this.loadMovimientos(); 
  });
}
  deleteMovimiento(movimiento: MovimientoStock): void {
    const nombreProducto = movimiento.producto?.nombre ?? 'desconocido';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { message: `Eliminar movimiento del producto "${nombreProducto}"?` } });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.movimientoService.deleteMovimiento(movimiento.id_movimiento!).subscribe({
          next: () => { this.showSuccess('Movimiento eliminado'); this.loadMovimientos(); },
          error: () => this.showError('Error al eliminar movimiento')
        });
      }
    });
  }

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
// En movimiento-stock-list.component.ts - agregar estos métodos
displayedColumnsProfessional: string[] = [
  'id', 'fecha', 'producto', 'tipo', 'cantidad', 'lote', 'usuario', 'acciones'
];

mostrarFiltrosAvanzados = false;

// Métodos adicionales
ngOnInit(): void { 
  this.loadMovimientos();
  window.addEventListener('inventario-actualizado', () => {
    this.loadMovimientos();
  });
}

toggleFiltrosAvanzados(): void {
  this.mostrarFiltrosAvanzados = !this.mostrarFiltrosAvanzados;
}

getTipoIcon(tipo: string): string {
  const iconMap: { [key: string]: string } = {
    'ingreso': 'arrow_downward',
    'egreso': 'arrow_upward', 
    'ajuste': 'autorenew',
    'devolucion': 'refresh'
  };
  return iconMap[tipo] || 'help';
}

getTipoText(tipo: string): string {
  const textMap: { [key: string]: string } = {
    'ingreso': 'Ingreso',
    'egreso': 'Egreso',
    'ajuste': 'Ajuste',
    'devolucion': 'Devolución'
  };
  return textMap[tipo] || tipo;
}

getMovimientosHoy(): any[] {
  const hoy = new Date().toDateString();
  return this.dataSource.data.filter(mov => 
    new Date(mov.fecha).toDateString() === hoy
  );
}

getIngresosMes(): any[] {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  
  return this.dataSource.data.filter(mov => 
    new Date(mov.fecha) >= inicioMes && mov.tipo_movimiento === 'ingreso'
  );
}

getTotalIngresos(): number {
  return this.dataSource.data
    .filter(mov => mov.tipo_movimiento === 'ingreso')
    .reduce((sum, mov) => sum + mov.cantidad, 0);
}

getTotalEgresos(): number {
  return this.dataSource.data
    .filter(mov => mov.tipo_movimiento === 'egreso')
    .reduce((sum, mov) => sum + mov.cantidad, 0);
}

getPromedioDiario(): number {
  const movimientosUltimaSemana = this.dataSource.data.filter(mov => {
    const fechaMov = new Date(mov.fecha);
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    return fechaMov >= unaSemanaAtras;
  });
  
  return movimientosUltimaSemana.length > 0 
    ? Math.round(movimientosUltimaSemana.length / 7) 
    : 0;
}

getBalanceTotal(): number {
  return this.dataSource.filteredData.reduce((balance, mov) => {
    if (mov.tipo_movimiento === 'ingreso') {
      return balance + mov.cantidad;
    } else if (mov.tipo_movimiento === 'egreso') {
      return balance - mov.cantidad;
    }
    return balance;
  }, 0);
}

aplicarFiltroTipo(tipos: string[]): void {
  if (tipos.length === 0) {
    this.dataSource.filter = '';
  } else {
    this.dataSource.filter = tipos.join('|');
  }
}

aplicarFiltroFecha(): void {
  // Implementar filtro por fecha
}

limpiarFiltros(): void {
  this.dataSource.filter = '';
  this.mostrarFiltrosAvanzados = false;
}

exportarExcel(): void {
  // Implementar exportación a Excel
}

recargarDatos(): void {
  this.loadMovimientos();
}

verDetallesMovimiento(movimiento: any): void {
  // Implementar vista de detalles
}

crearMovimientoUnificado(): void {
  const dialogRef = this.dialog.open(MovimientoStockUnificadoFormComponent, {
    width: '650px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    panelClass: 'movimiento-unificado-dialog'
  });
  
  dialogRef.afterClosed().subscribe((result: any) => {
    if (result) {
      this.loadMovimientos();
    }
  });
}
}
