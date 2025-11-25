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
import { MatRadioModule } from '@angular/material/radio';

import { Cliente } from '../../core/models/cliente.model';
import { ClienteService } from '../../core/services/cliente.service';
import { CustomValidators } from '../../utils/validators';
import { GeocodingService } from '../../core/services/geocoding.service';

@Component({
  selector: 'app-cliente-form',
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
    MatRadioModule
  ],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css'],
})
export class ClienteFormComponent implements OnInit {
  clienteForm: FormGroup;
  isEditMode = false;

  // Opciones para selects
  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'CE', label: 'Carnet de Extranjería' }
  ];

  tiposCliente = [
    { value: 'Bodega', label: 'Bodega' },
    { value: 'Restaurante', label: 'Restaurante' },
    { value: 'Gimnasio', label: 'Gimnasio' },
    { value: 'Persona', label: 'Persona' },
    { value: 'Empresa', label: 'Empresa' }
  ];

  isLoading = false;
  isGeocoding = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private geocodingService: GeocodingService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cliente: Cliente }
  ) {
    this.clienteForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data?.cliente) {
      this.isEditMode = true;
      this.loadFormData(this.data.cliente);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      tipo_documento: ['DNI', Validators.required],
      dni: ['', [Validators.required, this.dniRucValidator.bind(this)]],
      nombre: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+-\s()]{9,15}$/)]],
      direccion: ['', Validators.required],
      tipo_cliente: ['Bodega', Validators.required],
      razon_social: [''],
      coordenadas: ['']
    });
  }

  // Validador personalizado para DNI/RUC
  private dniRucValidator(control: any) {
    const value = control.value;
    const tipoDocumento = this.clienteForm?.get('tipo_documento')?.value;

    if (!value) {
      return null;
    }

    if (tipoDocumento === 'DNI') {
      // DNI: 8 dígitos
      const dniRegex = /^\d{8}$/;
      return dniRegex.test(value) ? null : { invalidDni: true };
    } else if (tipoDocumento === 'RUC') {
      // RUC: 11 dígitos
      const rucRegex = /^\d{11}$/;
      return rucRegex.test(value) ? null : { invalidRuc: true };
    } else if (tipoDocumento === 'CE') {
      // Carnet extranjería: 9-12 caracteres alfanuméricos
      const ceRegex = /^[a-zA-Z0-9]{9,12}$/;
      return ceRegex.test(value) ? null : { invalidCe: true };
    }

    return null;
  }

  onTipoDocumentoChange(): void {
    // Limpiar y resetear validaciones cuando cambia el tipo de documento
    const dniControl = this.clienteForm.get('dni');
    dniControl?.setValue('');
    dniControl?.updateValueAndValidity();
  }

  public canGeocode(): boolean {
    return this.clienteForm.get('direccion')?.valid as boolean;
  }

  private geocodeAddress(): void {
    if (this.isGeocoding) return;

    const direccion = this.clienteForm.get('direccion')?.value;

    if (direccion) {
      this.isGeocoding = true;

      this.geocodingService
        .geocodeFromAddress(direccion)
        .subscribe({
          next: (coordinates) => {
            this.isGeocoding = false;
            if (coordinates) {
              this.clienteForm.get('coordenadas')?.setValue(
                `${coordinates.lat},${coordinates.lng}`
              );
              this.showMessage('Coordenadas calculadas correctamente', 'success');
            } else {
              this.showMessage('No se pudieron calcular las coordenadas', 'warn');
            }
          },
          error: (error) => {
            this.isGeocoding = false;
            console.error('Error en geocodificación:', error);
            this.showMessage('Error al calcular coordenadas', 'error');
          },
        });
    }
  }

  manualGeocode(): void {
    if (this.canGeocode()) {
      this.geocodeAddress();
    } else {
      this.showMessage('Complete la dirección primero', 'warn');
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

loadFormData(cliente: Cliente): void {
  this.clienteForm.patchValue({
    tipo_documento: cliente.tipo_documento,
    dni: cliente.dni,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    direccion: cliente.direccion,
    tipo_cliente: cliente.tipo_cliente,
    razon_social: cliente.razon_social || '', // Asegurar que no sea null
    coordenadas: cliente.coordenadas || ''
  });
}
  getDocumentoError(): string {
    const errors = this.clienteForm.get('dni')?.errors;
    const tipoDocumento = this.clienteForm.get('tipo_documento')?.value;

    if (errors?.['required']) {
      return 'El número de documento es requerido';
    } else if (errors?.['invalidDni']) {
      return 'El DNI debe tener 8 dígitos';
    } else if (errors?.['invalidRuc']) {
      return 'El RUC debe tener 11 dígitos';
    } else if (errors?.['invalidCe']) {
      return 'El Carnet de Extranjería debe tener 9-12 caracteres alfanuméricos';
    }

    return '';
  }

  getTelefonoError(): string {
    const errors = this.clienteForm.get('telefono')?.errors;
    
    if (errors?.['required']) {
      return 'El teléfono es requerido';
    } else if (errors?.['pattern']) {
      return 'Formato de teléfono inválido';
    }

    return '';
  }

shouldShowRazonSocial(): boolean {
  const tipoCliente = this.clienteForm.get('tipo_cliente')?.value;
  // Mostrar razón social solo para Empresa y Restaurante
  return true;
}

onSubmit(): void {
  if (this.clienteForm.valid) {
    this.isLoading = true;
    const formData = this.clienteForm.value;

    // Lógica mejorada para razón social - NO forzar a null
    if (formData.razon_social && formData.razon_social.trim() === '') {
      formData.razon_social = null;
    }

    // Si las coordenadas están vacías, enviar null
    if (!formData.coordenadas || formData.coordenadas.trim() === '') {
      formData.coordenadas = null;
    }

    const request$ = this.isEditMode
      ? this.clienteService.updateCliente(this.data.cliente.id!, formData)
      : this.clienteService.createCliente(formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true);
        this.showMessage(
          this.isEditMode ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', 
          'success'
        );
      },
      error: (error) => {
        console.error('Error saving client:', error);
        this.isLoading = false;
        
        let errorMessage = 'Error al guardar el cliente';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'El número de documento ya existe';
        } else if (error.status === 404) {
          errorMessage = 'Cliente no encontrado';
        }
        
        this.showMessage(errorMessage, 'error');
      }
    });
  } else {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.clienteForm.controls).forEach(key => {
      this.clienteForm.get(key)?.markAsTouched();
    });
    this.showMessage('Por favor complete todos los campos requeridos', 'warn');
  }
}
  clearForm(): void {
    this.clienteForm.reset({
      tipo_documento: 'DNI',
      dni: '',
      nombre: '',
      telefono: '',
      direccion: '',
      tipo_cliente: 'Bodega',
      razon_social: '',
      coordenadas: ''
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}