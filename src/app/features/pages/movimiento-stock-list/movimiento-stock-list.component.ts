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
    MatProgressSpinnerModule
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

  ngOnInit(): void { this.loadMovimientos(); }
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
}
