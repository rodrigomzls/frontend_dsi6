import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarcaService } from '../../../core/services/marca.service';
import { MarcaFormComponent } from '../../../components/marca-form/marca-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { Marca } from '../../../core/models/marca.model';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-marca-list',
  templateUrl: './marca-list.component.html',
  styleUrls: ['./marca-list.component.css'],
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
export class MarcaListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<Marca>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private marcaService: MarcaService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMarcas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadMarcas(): void {
    this.isLoading = true;
    this.marcaService.getMarcas().subscribe({
      next: (rows) => { this.dataSource.data = rows; this.isLoading = false; },
      error: () => { this.isLoading = false; this.showError('Error al cargar marcas'); }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addMarca(): void {
    const dialogRef = this.dialog.open(MarcaFormComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(res => { if (res) this.loadMarcas(); });
  }

 editMarca(marca: Marca): void {
  const dialogRef = this.dialog.open(MarcaFormComponent, { 
    width: '500px', 
    data: marca  // ← Cambiar esto: quitar el objeto { marca }
  });
  dialogRef.afterClosed().subscribe(res => { if (res) this.loadMarcas(); });
}

deleteMarca(marca: Marca): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, { 
    width: '420px', 
    data: { message: `¿Eliminar marca "${marca.nombre}"?` } 
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.marcaService.deleteMarca(marca.id_marca).subscribe({ // ← Cambiar id_marca por id
        next: () => { 
          this.showSuccess('Marca eliminada'); 
          this.loadMarcas(); 
        },
        error: () => this.showError('Error al eliminar marca')
      });
    }
  });
}

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
}
