// src/components/pedido-proveedor-form/pedido-proveedor-form.component.ts - CORREGIDO

import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PedidoProveedorCreate, PedidoProveedor } from '../../core/models/pedido-proveedor.model';
import { PedidoProveedorService } from '../../core/services/pedido-proveedor.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { ProductService } from '../../core/services/producto.service';
import { Proveedor } from '../../core/models/proveedor.model';
import { Product } from '../../core/models/producto.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

interface EstadoPedido {
  id_estado_pedido: number;
  estado: string;
}

@Component({
  selector: 'app-pedido-proveedor-form',
  templateUrl: './pedido-proveedor-form.component.html',
  styleUrls: ['./pedido-proveedor-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class PedidoProveedorFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  proveedores: Proveedor[] = [];
  productos: Product[] = [];
  estados: EstadoPedido[] = [];
  isEditMode = false;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoProveedorService,
    private proveedorService: ProveedorService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PedidoProveedorFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido?: PedidoProveedor }
  ) { 
    this.isEditMode = !!data?.pedido;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadProveedores();
    this.loadProductos();
    this.loadEstados();
    
    if (this.isEditMode && this.data.pedido) {
      this.loadPedidoData(this.data.pedido);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.form = this.fb.group({
      id_proveedor: [null, Validators.required],
      id_producto: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      id_estado_pedido: [1, Validators.required],
      costo_unitario: [0, [Validators.required, Validators.min(0)]],
      total: [{ value: 0, disabled: true }]
    });

    // Actualizar total automáticamente
    this.form.get('cantidad')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateTotal());
      
    this.form.get('costo_unitario')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateTotal());
  }

  loadPedidoData(pedido: PedidoProveedor): void {
    this.form.patchValue({
      id_proveedor: pedido.id_proveedor,
      id_producto: pedido.id_producto,
      fecha: pedido.fecha,
      cantidad: pedido.cantidad,
      id_estado_pedido: pedido.id_estado_pedido,
      costo_unitario: pedido.costo_unitario || 0
    });
    this.updateTotal();
  }

  loadProveedores(): void {
    this.proveedorService.getProveedores().subscribe({
      next: data => this.proveedores = data,
      error: () => this.showError('Error al cargar proveedores')
    });
  }

  loadProductos(): void {
    this.productService.getProducts().subscribe({
      next: data => this.productos = data,
      error: () => this.showError('Error al cargar productos')
    });
  }

  loadEstados(): void {
    this.pedidoService.getEstadosPedido().subscribe({
      next: data => this.estados = data,
      error: () => {
        // Fallback si hay error
        this.estados = [
          { id_estado_pedido: 1, estado: 'Solicitado' },
          { id_estado_pedido: 2, estado: 'Confirmado' },
          { id_estado_pedido: 3, estado: 'En camino' },
          { id_estado_pedido: 4, estado: 'Recibido' },
          { id_estado_pedido: 5, estado: 'Cancelado' }
        ];
      }
    });
  }

  updateTotal(): void {
    const cantidad = this.form.get('cantidad')?.value || 0;
    const costo = this.form.get('costo_unitario')?.value || 0;
    const total = cantidad * costo;
    this.form.get('total')?.setValue(total);
  }

  submit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const formValue = this.form.getRawValue();
    const payload: PedidoProveedorCreate = {
      id_proveedor: formValue.id_proveedor,
      id_producto: formValue.id_producto,
      fecha: formValue.fecha,
      cantidad: formValue.cantidad,
      id_estado_pedido: formValue.id_estado_pedido,
      costo_unitario: formValue.costo_unitario,
      total: formValue.total
    };

    const request = this.isEditMode 
      ? this.pedidoService.updatePedido(this.data.pedido!.id_pedido, payload)
      : this.pedidoService.createPedido(payload);

    request.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess(
          this.isEditMode 
            ? 'Pedido actualizado correctamente' 
            : 'Pedido creado correctamente'
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error.message || 'Error al guardar el pedido');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', { 
      duration: 3000, 
      panelClass: ['success-snackbar'] 
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { 
      duration: 5000, 
      panelClass: ['error-snackbar'] 
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}