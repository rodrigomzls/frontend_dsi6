import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Proveedor, ProveedorCreate } from '../../core/models/proveedor.model';
import { ProveedorService } from '../../core/services/proveedor.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-proveedor-form',
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class ProveedorFormComponent implements OnInit {

  form!: FormGroup;
  proveedores: Proveedor[] = [];

  constructor(
    private fb: FormBuilder,
    private proveedorService: ProveedorService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProveedores();
  }

  initForm(): void {
    this.form = this.fb.group({
      id_persona: [null, Validators.required],
      razon_social: ['', Validators.required],
      activo: [true]
    });
  }

  loadProveedores(): void {
    this.proveedorService.getProveedores().subscribe(data => {
      this.proveedores = data;
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const proveedor: ProveedorCreate = {
      id_persona: this.form.value.id_persona,
      razon_social: this.form.value.razon_social,
      activo: this.form.value.activo
    };

    this.proveedorService.createProveedor(proveedor).subscribe(() => {
      alert('Proveedor registrado con éxito!');
      this.form.reset({ activo: true });
      this.loadProveedores();
    });
  }

}
