import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriaService } from '../../../core/services/categoria.service';
import { CategoriaFormComponent } from '../../../components/categoria-form/categoria-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { Categoria } from '../../../core/models/categoria.model';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-categoria-list',
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.css'],
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
export class CategoriaListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<Categoria>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoriaService: CategoriaService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCategorias(): void {
    this.isLoading = true;
    this.categoriaService.getCategorias().subscribe({
      next: (rows) => { this.dataSource.data = rows; this.isLoading = false; },
      error: () => { this.isLoading = false; this.showError('Error al cargar categorías'); }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addCategoria(): void {
    const dialogRef = this.dialog.open(CategoriaFormComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.loadCategorias(); });
  }

 editCategoria(categoria: Categoria): void {
  const dialogRef = this.dialog.open(CategoriaFormComponent, { 
    width: '500px', 
    data: categoria  // ← Cambiar esto: pasar directamente el objeto categoria
  });
  dialogRef.afterClosed().subscribe(res => { if (res) this.loadCategorias(); });
}

  deleteCategoria(categoria: Categoria): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { message: `Eliminar categoría "${categoria.nombre}"?` } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoriaService.deleteCategoria(categoria.id_categoria!).subscribe({
          next: () => { this.showSuccess('Categoría eliminada'); this.loadCategorias(); },
          error: () => this.showError('Error al eliminar categoría')
        });
      }
    });
  }

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
}
