import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoteService } from '../../../core/services/lote.service';
import { LoteFormComponent } from '../../../components/lote-form/lote-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { Lote } from '../../../core/models/lote.model';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-lote-list',
  templateUrl: './lote-list.component.html',
  styleUrls: ['./lote-list.component.css'],
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
export class LoteListComponent implements OnInit, AfterViewInit {
  // ✅ COLUMNAS CORREGIDAS (sin duplicados)
  displayedColumns: string[] = [
    'id', 
    'producto', 
    'numero_lote',
    'cantidad_inicial', 
    'cantidad_actual',  
    'fecha_caducidad',
    'dias_caducar',
    'fecha_creacion',
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Lote>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private loteService: LoteService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLotes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadLotes(): void {
    this.isLoading = true;
    this.loteService.getLotes().subscribe({
      next: (rows) => { 
        this.dataSource.data = rows; 
        this.isLoading = false;
        console.log('✅ Lotes cargados:', rows);
      },
      error: (error) => { 
        this.isLoading = false; 
        this.showError('Error al cargar lotes');
        console.error('❌ Error cargando lotes:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addLote(): void {
    const dialogRef = this.dialog.open(LoteFormComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.loadLotes(); });
  }

  editLote(lote: Lote): void {
    const dialogRef = this.dialog.open(LoteFormComponent, { width: '600px', data: lote });
    dialogRef.afterClosed().subscribe(res => { if (res) this.loadLotes(); });
  }

  deleteLote(lote: Lote): void {
    const nombreProducto = lote.producto?.nombre ?? 'desconocido';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { 
      width: '420px', 
      data: { message: `¿Eliminar lote "${lote.numero_lote}" del producto "${nombreProducto}"?` } 
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loteService.deleteLote(lote.id_lote).subscribe({
          next: () => { 
            this.showSuccess('Lote eliminado correctamente'); 
            this.loadLotes(); 
          },
          error: () => this.showError('Error al eliminar lote')
        });
      }
    });
  }

  // ✅ MÉTODOS HELPER MEJORADOS
  calcularDiasParaCaducar(fechaCaducidad: string): number {
    const hoy = new Date();
    const caducidad = new Date(fechaCaducidad);
    const diffTime = caducidad.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDiasClass(fechaCaducidad: string): string {
    const dias = this.calcularDiasParaCaducar(fechaCaducidad);
    
    if (dias < 0) return 'caducado';
    if (dias <= 7) return 'caducidad-critica';
    if (dias <= 30) return 'caducidad-proxima';
    if (dias <= 90) return 'caducidad-advertencia';
    return 'caducidad-normal';
  }

  getStockClass(lote: Lote): string {
    const porcentaje = (lote.cantidad_actual / lote.cantidad_inicial) * 100;
    
    if (lote.cantidad_actual === 0) return 'stock-agotado';
    if (porcentaje <= 20) return 'stock-bajo';
    if (porcentaje <= 50) return 'stock-medio';
    return 'stock-normal';
  }

  private showSuccess(msg: string) { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 3000, 
      panelClass: ['success-snackbar'] 
    }); 
  }
  
  private showError(msg: string) { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 5000, 
      panelClass: ['error-snackbar'] 
    }); 
  }
}