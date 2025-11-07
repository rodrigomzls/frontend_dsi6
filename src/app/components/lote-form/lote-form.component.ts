import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoteService } from '../../core/services/lote.service';
import { Lote, LoteCreate } from '../../core/models/lote.model';
import { ProductService } from '../../core/services/producto.service';
import { Product } from '../../core/models/producto.model';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lote-form',
  templateUrl: './lote-form.component.html',
  styleUrls: ['./lote-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ]
})
export class LoteFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  titulo = '';
  productos: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private loteService: LoteService,
    private productoService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LoteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Lote
  ) {
    this.form = this.fb.group({
      id_lote: [data?.id_lote || 0],
      id_producto: [data?.id_producto || null, Validators.required],
      numero_lote: [data?.numero_lote || '', [Validators.required, Validators.minLength(3)]],
      fecha_caducidad: [data?.fecha_caducidad || '', Validators.required],
      cantidad_inicial: [data?.cantidad_inicial || 0, [Validators.required, Validators.min(1)]],
      cantidad_actual: [data?.cantidad_actual || 0],
      activo: [data?.activo ?? true]
    });

    this.titulo = data && data.id_lote ? 'Editar Lote' : 'Nuevo Lote';
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.getProducts().subscribe({
      next: (data) => (this.productos = data),
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const formValue = this.form.value;
    
    if (formValue.id_lote) {
      // Actualizar lote existente
      const loteUpdate: Lote = {
        ...formValue,
        id_lote: formValue.id_lote
      };
      this.loteService.updateLote(formValue.id_lote, loteUpdate).subscribe({
        next: () => {
          this.snackBar.open('Lote actualizado correctamente.', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open('Error al actualizar el lote: ' + err.message, 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        },
        complete: () => (this.isLoading = false)
      });
    } else {
      // Crear nuevo lote
      const loteCreate: LoteCreate = {
        id_producto: formValue.id_producto,
        numero_lote: formValue.numero_lote,
        fecha_caducidad: formValue.fecha_caducidad,
        cantidad_inicial: formValue.cantidad_inicial
      };
      this.loteService.createLote(loteCreate).subscribe({
        next: () => {
          this.snackBar.open('Lote registrado correctamente.', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snackBar.open('Error al crear el lote: ' + err.message, 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        },
        complete: () => (this.isLoading = false)
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
