import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { Product } from '../../core/models/producto.model';
import { ProductService } from '../../core/services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css'],
})
export class ProductoFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  isLoading = false;

  // Listas para los selects
  categorias: any[] = [];
  marcas: any[] = [];
  proveedores: any[] = [];
  paises: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProductoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product: Product }
  ) {
    this.productForm = this.createForm();
  }

 ngOnInit(): void {
  this.loadData();
  
  // No establecer isEditMode inmediatamente, esperar a que los datos estén listos
  if (this.data?.product) {
    this.isEditMode = true;
    // La carga del formulario ahora se hace en loadData después de cargar las listas
  }
}

isFormReady(): boolean {
  if (this.isEditMode) {
    // Verificar que todos los campos requeridos tengan valores
    const values = this.productForm.value;
    return !!(
      values.nombre &&
      values.descripcion &&
      values.precio &&
      values.stock !== null &&
      values.categoriaId &&
      values.marcaId &&
      values.proveedorId &&
      values.paisOrigenId
    );
  }
  return true;
}

  private createForm(): FormGroup {
  return this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.minLength(3)]], // Cambiado de 5 a 3
    precio: ['', [Validators.required, Validators.min(0.01)]],
    stock: ['', [Validators.required, Validators.min(0)]],
    categoriaId: ['', Validators.required],
    marcaId: ['', Validators.required],
    proveedorId: ['', Validators.required],
    paisOrigenId: ['', Validators.required],
  });
}

private loadFormData(product: Product): void {
  console.log('Cargando datos del producto:', product);
  console.log('Estado del formulario antes de patch:', this.productForm.valid);
  
  // Debug: verificar el estado de cada campo antes
  Object.keys(this.productForm.controls).forEach(key => {
    const control = this.productForm.get(key);
    console.log(`Campo ${key}:`, {
      value: control?.value,
      valid: control?.valid,
      errors: control?.errors,
      touched: control?.touched
    });
  });
  
  setTimeout(() => {
    this.productForm.patchValue({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: product.precio || 0,
      stock: product.stock || 0,
      categoriaId: product.categoriaId || '',
      marcaId: product.marcaId || '',
      proveedorId: product.proveedorId || '',
      paisOrigenId: product.paisOrigenId || '',
    });
    
    console.log('Estado del formulario después de patch:', this.productForm.valid);
    console.log('Valores del formulario:', this.productForm.value);
    
    // Debug: verificar el estado de cada campo después del patch
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      console.log(`Campo ${key} después de patch:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors
      });
    });
    
    this.productForm.updateValueAndValidity();
  }, 0);
}
private loadData(): void {
  this.isLoading = true;

  forkJoin({
    categorias: this.productService.getCategorias(),
    marcas: this.productService.getMarcas(),
    proveedores: this.productService.getProveedores(),
    paises: this.productService.getPaises()
  }).subscribe({
    next: (data) => {
      this.categorias = data.categorias;
      this.marcas = data.marcas;
      this.proveedores = data.proveedores;
      this.paises = data.paises;
      this.isLoading = false;

      // Solo cargar los datos del producto después de que las listas estén disponibles
      if (this.data?.product) {
        this.loadFormData(this.data.product);
      }
    },
    error: (err) => {
      console.error('Error cargando datos:', err);
      this.isLoading = false;
      this.showMessage('Error al cargar los datos del formulario', 'error');
    }
  });
}

  private showMessage(message: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formData = this.productForm.value;

      const request$ = this.isEditMode
        ? this.productService.updateProduct(this.data.product.id!, formData)
        : this.productService.createProduct(formData);

      this.isLoading = true;

      request$.subscribe({
        next: () => {
          this.isLoading = false;
          this.showMessage(
            this.isEditMode
              ? '✅ Producto actualizado correctamente'
              : '✅ Producto creado correctamente',
            'success'
          );
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error guardando producto:', error);
          this.showMessage('❌ Error al guardar el producto', 'error');
        },
      });
    } else {
      this.showMessage('⚠️ Complete todos los campos requeridos correctamente', 'warn');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}