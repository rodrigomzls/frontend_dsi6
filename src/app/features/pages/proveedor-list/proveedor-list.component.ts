import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { ProveedorFormComponent } from '../../../components/proveedor-form/proveedor-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { Proveedor } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrls: ['./proveedor-list.component.css']
})
export class ProveedorListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'razon_social', 'nombre', 'documento', 'telefono', 'direccion', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Proveedor>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private proveedorService: ProveedorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.loadProveedores(); }
  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  loadProveedores(): void {
    this.isLoading = true;
    this.proveedorService.getProveedores().subscribe({
      next: rows => { this.dataSource.data = rows; this.isLoading = false; },
      error: () => { this.isLoading = false; this.showError('Error al cargar proveedores'); }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addProveedor(): void {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { width: '600px' });
    dialogRef.afterClosed().subscribe(res => { if(res) this.loadProveedores(); });
  }

  editProveedor(proveedor: Proveedor): void {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { width: '600px', data: { proveedor } });
    dialogRef.afterClosed().subscribe(res => { if(res) this.loadProveedores(); });
  }

  deleteProveedor(proveedor: Proveedor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '450px', data: { message: `Eliminar proveedor "${proveedor.razon_social}"?` } });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.proveedorService.deleteProveedor(proveedor.id_proveedor!).subscribe({
          next: () => { this.showSuccess('Proveedor eliminado'); this.loadProveedores(); },
          error: () => this.showError('Error al eliminar proveedor')
        });
      }
    });
  }

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
}
