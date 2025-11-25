import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
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
import { Product } from '../../../core/models/producto.model';
import { ProductService } from '../../../core/services/producto.service';
import { ProductoFormComponent } from '../../../components/producto-form/producto-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-producto-list',
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
    MatSelectModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css'],

})
export class ProductoListComponent implements OnInit {
  pageSize = 5; // Default page size (ajustado a 5 por petición)
  displayedColumns: string[] = [
    'numero',
    'nombre',
    'descripcion',
    'precio',
    'stock',
    'categoria',
    'marca',
    'proveedor',
    'paisOrigen',
    'acciones'
  ];

  dataSource: MatTableDataSource<any>;
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    this.loadProductsWithDetails();
  }

  ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;
  // Asegurar que el paginador inicial tenga el pageSize definido
  try {
    if (this.paginator) this.paginator.pageSize = this.pageSize;
  } catch (e) { /* noop */ }

  }

  loadProductsWithDetails(): void {
  this.isLoading = true;
  this.productService.getProductsWithDetails().subscribe({
    next: (productsWithDetails) => {
      console.log('Productos con detalles:', productsWithDetails); 
      this.dataSource = new MatTableDataSource(productsWithDetails);

      // 🔧 Aseguramos que el paginador y el sort se asignen correctamente
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      // Asegurar pageSize actual en el paginador
      try { if (this.paginator) this.paginator.pageSize = this.pageSize; } catch (e) { /* noop */ }

      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading products with details:', error);
      this.isLoading = false;
      this.loadProducts();
    }
  });
}


  loadProducts(): void {
  this.productService.getProducts().subscribe({
    next: (products) => {
      this.dataSource = new MatTableDataSource(products);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      try { if (this.paginator) this.paginator.pageSize = this.pageSize; } catch (e) { /* noop */ }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading products:', error);
      this.isLoading = false;
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

  changePageSize(size: number): void {
    this.pageSize = size;
    if (this.paginator) {
      this.paginator.pageSize = size;
      this.dataSource.paginator = this.paginator;
      // Forzar evento de cambio de tamaño si el paginator expone el método interno
      try {
        // _changePageSize es una implementación interna en MatPaginator que dispara el evento correctamente
        if ((this.paginator as any)._changePageSize) {
          (this.paginator as any)._changePageSize(size);
        } else {
          this.paginator.firstPage();
        }
      } catch (e) { /* noop */ }
    }
    this.cdr.detectChanges();
  }

openAddDialog(): void {
   const dialogRef = this.dialog.open(ProductoFormComponent, {
    width: '600px', // Reducido de 800px
    maxWidth: '95vw',
    height: 'auto',
    maxHeight: '85vh',
    panelClass: 'product-form-dialog',
    autoFocus: false
  });
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadProductsWithDetails();
    }
  });
}

openEditDialog(product: Product): void {
  const dialogRef = this.dialog.open(ProductoFormComponent, {
    width: '600px', // Reducido de 800px
    maxWidth: '95vw',
    height: 'auto',
    maxHeight: '85vh',
    panelClass: 'product-form-dialog',
    autoFocus: false,
    data: { product }
  });


  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadProductsWithDetails();
    }
  });
}
  deleteProduct(product: Product): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        message: `¿Estás seguro de que deseas eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(product.id!).subscribe({
          next: () => {
            this.loadProductsWithDetails();
            this.showSuccessMessage('Producto eliminado correctamente');
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.showErrorMessage('Error al eliminar el producto');
          }
        });
      }
    });
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
