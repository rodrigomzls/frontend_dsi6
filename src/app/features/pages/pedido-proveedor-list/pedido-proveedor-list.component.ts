// pedido-proveedor-list.component.ts - CORREGIDO
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
import { PedidoProveedorService } from '../../../core/services/pedido-proveedor.service';
import { PedidoProveedorFormComponent } from '../../../components/pedido-proveedor-form/pedido-proveedor-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { PedidoProveedor } from '../../../core/models/pedido-proveedor.model';

@Component({
  selector: 'app-pedido-proveedor-list',
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
  templateUrl: './pedido-proveedor-list.component.html',
  styleUrls: ['./pedido-proveedor-list.component.css']
})
export class PedidoProveedorListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id_pedido', 'proveedor', 'fecha', 'total', 'estado', 'detalles', 'acciones']; // ✅ Agregar 'detalles'
  dataSource = new MatTableDataSource<PedidoProveedor>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private pedidoService: PedidoProveedorService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.loadPedidos(); }
  
  ngAfterViewInit(): void { 
    this.dataSource.paginator = this.paginator; 
    this.dataSource.sort = this.sort; 
  }

  loadPedidos(): void {
    this.isLoading = true;
    this.pedidoService.getPedidos().subscribe({
      next: rows => { 
        this.dataSource.data = rows; 
        this.isLoading = false; 
      },
      error: () => { 
        this.isLoading = false; 
        this.showError('Error al cargar pedidos'); 
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

// En pedido-proveedor-list.component.ts
// En pedido-proveedor-list.component.ts - actualizar el método addPedido
addPedido(): void {
  const dialogRef = this.dialog.open(PedidoProveedorFormComponent, { 
    width: '800px', // Más ancho para mejor visualización
    maxWidth: '95vw',
    height: '85vh', // Mayor altura
    maxHeight: '85vh',
    panelClass: ['responsive-dialog', 'pedido-proveedor-dialog'],
    autoFocus: false,
    disableClose: true
  });
  dialogRef.afterClosed().subscribe(res => { 
    if(res) this.loadPedidos(); 
  });
}

editPedido(pedido: PedidoProveedor): void {
  const dialogRef = this.dialog.open(PedidoProveedorFormComponent, { 
    width: '800px',
    maxWidth: '95vw',
    height: '85vh',
    maxHeight: '85vh',
    panelClass: ['responsive-dialog', 'pedido-proveedor-dialog'],
    autoFocus: false,
    disableClose: true,
    data: { pedido } 
  });
  dialogRef.afterClosed().subscribe(res => { 
    if(res) this.loadPedidos(); 
  });
}

  deletePedido(pedido: PedidoProveedor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { 
      width: '450px', 
      data: { message: `¿Eliminar pedido "${pedido.id_pedido}"?` } 
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.pedidoService.deletePedido(pedido.id_pedido).subscribe({
          next: () => { 
            this.showSuccess('Pedido eliminado'); 
            this.loadPedidos(); 
          },
          error: () => this.showError('Error al eliminar pedido')
        });
      }
    });
  }

  // ✅ MÉTODO VER DETALLES CORREGIDO
  verDetalles(pedido: PedidoProveedor): void {
    const detallesText = pedido.detalles.map(det => {
      const subtotalFormateado = new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }).format(det.subtotal);
      
      return `${det.insumo?.nombre}: ${det.cantidad} ${det.insumo?.unidad_medida} - ${subtotalFormateado}`;
    }).join('\n');

    this.snackBar.open(`Detalles del pedido:\n${detallesText}`, 'Cerrar', {
      duration: 8000,
      panelClass: ['info-snackbar']
    });
  }

  // ✅ MOVER MÉTODOS PRIVADOS ARRIBA O DEJARLOS PÚBLICOS
  private showSuccess(msg: string): void { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 3000, 
      panelClass: ['success-snackbar'] 
    }); 
  }

  private showError(msg: string): void { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 5000, 
      panelClass: ['error-snackbar'] 
    }); 
  }
}