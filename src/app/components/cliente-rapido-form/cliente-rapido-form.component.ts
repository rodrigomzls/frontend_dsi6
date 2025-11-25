import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService } from '../../core/services/cliente.service';

// Validadores personalizados actualizados
export class CustomValidators {
  // Validador para solo letras, espacios y acentos
  static soloLetras(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return regex.test(control.value) ? null : { soloLetras: true };
  }

  // Validador para solo números
  static soloNumeros(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const regex = /^\d+$/;
    return regex.test(control.value) ? null : { soloNumeros: true };
  }

  // Validador para teléfono peruano (9 dígitos que empiezan con 9)
  static telefonoPeruano(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const regex = /^9\d{8}$/;
    return regex.test(control.value) ? null : { telefonoPeruano: true };
  }

  // Validador para DNI peruano (8 dígitos) - ahora opcional
  static dniPeruano(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') return null;
    
    const regex = /^\d{8}$/;
    return regex.test(control.value) ? null : { dniPeruano: true };
  }

  // Validador para RUC peruano (11 dígitos) - ahora opcional
  static rucPeruano(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') return null;
    
    const regex = /^\d{11}$/;
    return regex.test(control.value) ? null : { rucPeruano: true };
  }

  // Validador para Carnet de Extranjería (9-12 caracteres alfanuméricos) - ahora opcional
  static carnetExtranjeria(control: AbstractControl): ValidationErrors | null {
    if (!control.value || control.value.trim() === '') return null;
    
    const regex = /^[a-zA-Z0-9]{9,12}$/;
    return regex.test(control.value) ? null : { carnetExtranjeria: true };
  }
}

@Component({
  selector: 'app-cliente-rapido-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      ➕ Agregar Cliente Rápido
    </h2>

    <mat-dialog-content>
      <form [formGroup]="clienteForm" class="cliente-form-rapido">
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre Completo *</mat-label>
            <input matInput formControlName="nombre" required>
            <mat-error *ngIf="clienteForm.get('nombre')?.hasError('required')">
              El nombre es requerido
            </mat-error>
            <mat-error *ngIf="clienteForm.get('nombre')?.hasError('minlength')">
              El nombre debe tener al menos 3 caracteres
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Teléfono *</mat-label>
            <input matInput formControlName="telefono" required placeholder="Ej: 912345678">
            <mat-error *ngIf="clienteForm.get('telefono')?.hasError('required')">
              El teléfono es requerido
            </mat-error>
            <mat-error *ngIf="clienteForm.get('telefono')?.hasError('minlength')">
              El teléfono debe tener al menos 7 dígitos
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Tipo de Cliente</mat-label>
            <mat-select formControlName="tipo_cliente">
              <mat-option value="Final">Persona</mat-option>
              <mat-option value="Bodega">Bodega</mat-option>
              <mat-option value="Restaurante">Restaurante</mat-option>
              <mat-option value="Gimnasio">Gimnasio</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Dirección</mat-label>
            <textarea matInput formControlName="direccion" rows="2"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()"
        [disabled]="clienteForm.invalid || isLoading">
        {{ isLoading ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cliente-form-rapido {
      min-width: 400px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-field-full {
      flex: 1;
    }
    .form-field {
      flex: 1;
    }
    @media (max-width: 480px) {
      .form-row {
        flex-direction: column;
      }
      .cliente-form-rapido {
        min-width: auto;
      }
    }
  `]
})
export class ClienteRapidoFormComponent implements OnInit {
  clienteForm: FormGroup;
  isLoading = false;

  // Opciones para selects
  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'CE', label: 'Carnet de Extranjería' },
    { value: 'NO_ESPECIFICADO', label: 'No Especificado' }
  ];

  tiposCliente = [
    { value: 'Bodega', label: 'Bodega' },
    { value: 'Restaurante', label: 'Restaurante' },
    { value: 'Gimnasio', label: 'Gimnasio' },
    { value: 'Persona', label: 'Persona' },
    { value: 'Empresa', label: 'Empresa' }
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ClienteRapidoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.clienteForm = this.createForm();
  }

  ngOnInit(): void {}

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      direccion: [''],
      tipo_cliente: ['Persona', Validators.required],
      razon_social: ['']
    });
  }

  // Validador dinámico para documentos según tipo - ahora opcional
  private documentoValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const tipoDocumento = this.clienteForm?.get('tipo_documento')?.value;

    // Si no hay valor, es válido (campo opcional)
    if (!value || value.trim() === '') {
      return null;
    }

    // Si hay valor, validar según el tipo
    if (tipoDocumento === 'DNI' || tipoDocumento === 'RUC') {
      if (!/^\d+$/.test(value)) {
        return { soloNumeros: true };
      }
    }

    // Luego validamos el formato específico
    if (tipoDocumento === 'DNI') {
      return CustomValidators.dniPeruano(control);
    } else if (tipoDocumento === 'RUC') {
      return CustomValidators.rucPeruano(control);
    } else if (tipoDocumento === 'CE') {
      return CustomValidators.carnetExtranjeria(control);
    }

    return null;
  }

  onTipoDocumentoChange(): void {
    const dniControl = this.clienteForm.get('dni');
    dniControl?.setValue('');
    dniControl?.updateValueAndValidity();
    
    this.actualizarPlaceholder();
  }

  private actualizarPlaceholder(): void {
    const tipoDocumento = this.clienteForm.get('tipo_documento')?.value;
    const dniControl = this.clienteForm.get('dni');
    
    if (tipoDocumento === 'NO_ESPECIFICADO') {
      dniControl?.setValue('');
    }
  }

  getDocumentoError(): string {
    const errors = this.clienteForm.get('dni')?.errors;
    const tipoDocumento = this.clienteForm.get('tipo_documento')?.value;

    if (errors?.['soloNumeros']) {
      return 'Solo se permiten números';
    } else if (errors?.['dniPeruano']) {
      return 'El DNI debe tener 8 dígitos';
    } else if (errors?.['rucPeruano']) {
      return 'El RUC debe tener 11 dígitos';
    } else if (errors?.['carnetExtranjeria']) {
      return 'El Carnet de Extranjería debe tener 9-12 caracteres alfanuméricos';
    }

    return '';
  }

  getNombreError(): string {
    const errors = this.clienteForm.get('nombre')?.errors;
    
    if (errors?.['required']) {
      return 'El nombre es requerido';
    } else if (errors?.['soloLetras']) {
      return 'Solo se permiten letras y espacios';
    }

    return '';
  }

  getTelefonoError(): string {
    const errors = this.clienteForm.get('telefono')?.errors;
    
    if (errors?.['required']) {
      return 'El teléfono es requerido';
    } else if (errors?.['soloNumeros']) {
      return 'Solo se permiten números';
    } else if (errors?.['telefonoPeruano']) {
      return 'El teléfono debe tener 9 dígitos y empezar con 9';
    }

    return '';
  }

  // Método para prevenir entrada de caracteres no permitidos
  prevenirCaracteresNoPermitidos(event: any, tipo: 'numero' | 'letra'): void {
    const inputChar = String.fromCharCode(event.charCode);
    
    if (tipo === 'numero') {
      if (!/^\d+$/.test(inputChar)) {
        event.preventDefault();
      }
    } else if (tipo === 'letra') {
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(inputChar)) {
        event.preventDefault();
      }
    }
  }

  // Método para formatear el teléfono mientras se escribe
  formatearTelefono(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    this.clienteForm.get('telefono')?.setValue(value, { emitEvent: false });
  }

  // Método para formatear el documento mientras se escribe
  formatearDocumento(event: any): void {
    const tipoDocumento = this.clienteForm.get('tipo_documento')?.value;
    let value = event.target.value;
    
    if (tipoDocumento === 'DNI' || tipoDocumento === 'RUC') {
      value = value.replace(/\D/g, '');
    }
    
    if (tipoDocumento === 'DNI' && value.length > 8) {
      value = value.substring(0, 8);
    } else if (tipoDocumento === 'RUC' && value.length > 11) {
      value = value.substring(0, 11);
    } else if (tipoDocumento === 'CE' && value.length > 12) {
      value = value.substring(0, 12);
    }
    
    this.clienteForm.get('dni')?.setValue(value, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      this.isLoading = true;
      
      // Generar un DNI único basado en timestamp + random
      const uniqueDNI = this.generateUniqueDNI();
      
      const formData = {
        ...this.clienteForm.value,
        tipo_documento: 'DNI',
        dni: uniqueDNI
      };

      this.clienteService.createCliente(formData).subscribe({
        next: (nuevoCliente) => {
          this.isLoading = false;
          this.snackBar.open('✅ Cliente creado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          this.dialogRef.close(nuevoCliente);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creando cliente:', error);
          
          let errorMessage = 'Error al crear el cliente';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'El número de documento ya existe';
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  private generateUniqueDNI(): string {
    // Generar DNI único basado en timestamp + número aleatorio
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return (timestamp + random).slice(-8);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}