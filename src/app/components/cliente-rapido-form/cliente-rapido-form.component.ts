// src/app/features/components/cliente-rapido-form/cliente-rapido-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClienteService } from '../../core/services/cliente.service';

@Component({
  selector: 'app-cliente-rapido-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
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
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Teléfono *</mat-label>
            <input matInput formControlName="telefono" required>
            <mat-error *ngIf="clienteForm.get('telefono')?.hasError('required')">
              El teléfono es requerido
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
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: [''],
      tipo_cliente: ['Final']
    });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      this.isLoading = true;
      
      // Usar DNI por defecto para clientes rápidos
      const formData = {
        ...this.clienteForm.value,
        tipo_documento: 'DNI',
        dni: '00000000' // DNI temporal, se puede generar uno único
      };

      this.clienteService.createCliente(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Cliente creado correctamente', 'Cerrar', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creando cliente:', error);
          this.snackBar.open('Error al crear el cliente', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}