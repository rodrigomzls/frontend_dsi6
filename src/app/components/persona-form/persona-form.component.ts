import { Component, OnInit, Inject } from '@angular/core';
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
import { PersonaService } from '../../core/services/persona.service';

@Component({
  selector: 'app-persona-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './persona-form.component.html',
  styleUrls: ['./persona-form.component.css']
})
export class PersonaFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEditMode = false;

  tipos = ['DNI', 'RUC', 'CE'];

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PersonaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { persona?: any } | null
  ) {
    this.form = this.fb.group({
      tipo_documento: ['DNI', Validators.required],
      numero_documento: [''],
      nombre_completo: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      coordenadas: ['']
    });
  }

  ngOnInit(): void {
    // Si recibimos datos, abrimos en modo edición
    if (this.data && this.data.persona) {
      this.isEditMode = true;
      const p = this.data.persona;
      this.form.patchValue({
        tipo_documento: p.tipo_documento || 'DNI',
        numero_documento: p.numero_documento || '',
        nombre_completo: p.nombre_completo || '',
        telefono: p.telefono || '',
        direccion: p.direccion || '',
        coordenadas: p.coordenadas || ''
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = this.form.value;

    if (this.isEditMode && this.data?.persona?.id_persona) {
      const id = this.data.persona.id_persona;
      this.personaService.update(id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.dialogRef.close({ id_persona: id, nombre_completo: payload.nombre_completo });
          this.snackBar.open('Persona actualizada', 'Cerrar', { duration: 2500 });
        },
        error: (err) => {
          console.error('Error actualizando persona:', err);
          this.isLoading = false;
          this.snackBar.open(err?.message || 'Error actualizando persona', 'Cerrar', { duration: 4000 });
        }
      });
    } else {
      this.personaService.create(payload).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          const id = res?.id_persona || res?.insertId || null;
          this.dialogRef.close({ id_persona: id, nombre_completo: payload.nombre_completo });
          this.snackBar.open('Persona creada', 'Cerrar', { duration: 2500 });
        },
        error: (err) => {
          console.error('Error creando persona:', err);
          this.isLoading = false;
          this.snackBar.open(err?.message || 'Error creando persona', 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  clearForm(): void {
    this.form.reset({
      tipo_documento: 'DNI',
      numero_documento: '',
      nombre_completo: '',
      telefono: '',
      direccion: '',
      coordenadas: ''
    });
  }
}