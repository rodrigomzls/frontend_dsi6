import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PedidoProveedorCreate } from '../../core/models/pedido-proveedor.model';
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
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class PedidoProveedorFormComponent implements OnInit {

  form!: FormGroup;
  proveedores: Proveedor[] = [];
  productos: Product[] = [];

  estados: EstadoPedido[] = [
    { id_estado_pedido: 1, estado: 'Pendiente' },
    { id_estado_pedido: 2, estado: 'Aprobado' },
    { id_estado_pedido: 3, estado: 'Rechazado' },
    { id_estado_pedido: 4, estado: 'Entregado' }
  ];

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoProveedorService,
    private proveedorService: ProveedorService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProveedores();
    this.loadProductos();
  }

  initForm(): void {
    this.form = this.fb.group({
      id_proveedor: [null, Validators.required],
      id_producto: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      id_estado_pedido: [1, Validators.required],
      costo_unitario: [0, Validators.min(0)],
      total: [{ value: 0, disabled: true }]
    });

    // Actualiza total automáticamente
    this.form.get('cantidad')?.valueChanges.subscribe(() => this.updateTotal());
    this.form.get('costo_unitario')?.valueChanges.subscribe(() => this.updateTotal());
  }

  loadProveedores(): void {
    this.proveedorService.getProveedores().subscribe(data => {
      this.proveedores = data;
    });
  }

  loadProductos(): void {
    this.productService.getProducts().subscribe(data => {
      this.productos = data;
    });
  }

  updateTotal(): void {
    const cantidad = this.form.get('cantidad')?.value || 0;
    const costo = this.form.get('costo_unitario')?.value || 0;
    this.form.get('total')?.setValue(cantidad * costo);
  }

  submit(): void {
    if (this.form.invalid) return;

    const pedido: PedidoProveedorCreate = {
      id_proveedor: this.form.value.id_proveedor,
      id_producto: this.form.value.id_producto,
      fecha: this.form.value.fecha,
      cantidad: this.form.value.cantidad,
      id_estado_pedido: this.form.value.id_estado_pedido,
      costo_unitario: this.form.value.costo_unitario,
      total: this.form.value.total
    };

    this.pedidoService.createPedido(pedido).subscribe(() => {
      alert('Pedido registrado con éxito!');
      this.form.reset({
        fecha: new Date().toISOString().split('T')[0],
        id_estado_pedido: 1,
        cantidad: 0,
        costo_unitario: 0,
        total: 0
      });
    });
  }

}
