import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MovimientoStockService } from '../../core/services/movimiento-stock.service';
import { ProductService } from '../../core/services/producto.service';
import { MovimientoStock } from '../../core/models/movimiento-stock.model';
import { Product } from '../../core/models/producto.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-movimiento-stock-form',
  templateUrl: './movimiento-stock-form.component.html',
  styleUrls: ['./movimiento-stock-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class MovimientoStockFormComponent implements OnInit {
  form: FormGroup;
  productos: Product[] = [];
  isLoading = false;
  titulo = '';

  tiposMovimiento = [
    { value: 'ingreso', label: 'Ingreso' },
    { value: 'egreso', label: 'Egreso' },
    { value: 'ajuste', label: 'Ajuste' },
    { value: 'venta', label: 'Venta' },
    { value: 'devolucion', label: 'Devolución' }
  ];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoStockService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MovimientoStockFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoStock
  ) {
    this.form = this.fb.group({
      id_movimiento: [data?.id_movimiento || 0],
      id_producto: [data?.id_producto || null, Validators.required],
      tipo_movimiento: [data?.tipo_movimiento || '', Validators.required],
      cantidad: [data?.cantidad || '', [Validators.required, Validators.min(1)]],
      descripcion: [data?.descripcion || '']
    });

    this.titulo = data && data.id_movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento';
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productService.getProducts().subscribe({
      next: (productos) => (this.productos = productos),
      error: (err) => {
        this.snackBar.open('Error al cargar productos: ' + err.message, 'Cerrar', { duration: 3000 });
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const movimiento = this.form.value as MovimientoStock;

    const request = movimiento.id_movimiento
      ? this.movimientoService.updateMovimiento(movimiento.id_movimiento, movimiento)
      : this.movimientoService.createMovimiento(movimiento);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          movimiento.id_movimiento
            ? 'Movimiento actualizado correctamente.'
            : 'Movimiento registrado correctamente.',
          'Cerrar',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open('Ocurrió un error: ' + err.message, 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
