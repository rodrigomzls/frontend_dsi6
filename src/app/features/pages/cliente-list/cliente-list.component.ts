import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteFormComponent } from '../../../components/cliente-form/cliente-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { MapModalComponent } from '../../../components/map-modal/map-modal.component';

@Component({
  selector: 'app-cliente-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrl: './cliente-list.component.css',
})
export class ClienteListComponent implements OnInit {
  pageSize = 5; // default rows to show
  displayedColumns: string[] = [
    'numero',
    'nombre',
    'tipo_documento',
    'dni',
    'telefono',
    'direccion',
    'tipo_cliente',
    'razon_social',
    'acciones'
  ];

  dataSource: MatTableDataSource<any>;
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clienteService: ClienteService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // Asegurar que el paginador inicial tenga el pageSize definido
    try {
      if (this.paginator) this.paginator.pageSize = this.pageSize;
    } catch (e) { /* noop */ }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    if (this.paginator) {
      this.paginator.pageSize = size;
      this.dataSource.paginator = this.paginator;
      try {
        if ((this.paginator as any)._changePageSize) {
          (this.paginator as any)._changePageSize(size);
        } else {
          this.paginator.firstPage();
        }
      } catch (e) { /* noop */ }
    }
  }

  loadClientes(): void {
    this.isLoading = true;
    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.dataSource.data = clientes;
        // Asegurar pageSize actual en el paginador
        try { if (this.paginator) this.paginator.pageSize = this.pageSize; } catch (e) { /* noop */ }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoading = false;
        this.showErrorMessage('Error al cargar los clientes');
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '700px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'cliente-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
      }
    });
  }

  openEditDialog(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '700px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'cliente-form-dialog',
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClientes();
      }
    });
  }

  deleteCliente(cliente: Cliente): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        message: `¿Estás seguro de que deseas eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && cliente.id) {
        this.clienteService.deleteCliente(cliente.id).subscribe({
          next: () => {
            this.loadClientes();
            this.showSuccessMessage('Cliente eliminado correctamente');
          },
          error: (error) => {
            console.error('Error deleting client:', error);
            this.showErrorMessage('Error al eliminar el cliente');
          }
        });
      }
    });
  }

  openMapDialog(cliente: Cliente): void {
    // Verificar si hay dirección para geocodificar
    if (!cliente.direccion) {
      this.showErrorMessage('No hay dirección disponible para este cliente');
      return;
    }

    this.dialog.open(MapModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        tipo_cliente: cliente.tipo_cliente,
        razon_social: cliente.razon_social,
        coordenadas: cliente['coordenadas'] // Opcional, si decides agregar este campo
      }
    });
  }

  getTipoClienteColor(tipoCliente: string): string {
    const colors: { [key: string]: string } = {
      'Bodega': 'primary',
      'Restaurante': 'accent',
      'Gimnasio': 'warn',
      'Persona': 'basic',
      'Empresa': 'primary'
    };
    return colors[tipoCliente] || 'basic';
  }

  getTipoDocumentoColor(tipoDocumento: string): string {
    const colors: { [key: string]: string } = {
      'DNI': 'primary',
      'RUC': 'accent',
      'CE': 'warn'
    };
    return colors[tipoDocumento] || 'basic';
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}