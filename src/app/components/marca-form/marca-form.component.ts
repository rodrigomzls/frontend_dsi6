import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarcaService } from '../../core/services/marca.service';
import { Marca } from '../../core/models/marca.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-marca-form',
  templateUrl: './marca-form.component.html',
  styleUrls: ['./marca-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class MarcaFormComponent {
  form: FormGroup;
  isLoading = false;
  titulo = '';

  constructor(
    private fb: FormBuilder,
    private marcaService: MarcaService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MarcaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Marca
  ) {
    this.form = this.fb.group({
      id_marca: [data?.id_marca || 0],
      nombre: [data?.nombre || '', [Validators.required, Validators.minLength(2)]],
    });

    this.titulo = data && data.id_marca ? 'Editar Marca' : 'Nueva Marca';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const marca = this.form.value as Marca;

    const request = marca.id_marca
      ? this.marcaService.updateMarca(marca.id_marca, marca)
      : this.marcaService.createMarca(marca);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          marca.id_marca ? 'Marca actualizada correctamente.' : 'Marca registrada correctamente.',
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
