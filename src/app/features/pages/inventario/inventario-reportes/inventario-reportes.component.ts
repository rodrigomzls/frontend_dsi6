import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-inventario-reportes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatInputModule
  ],
  templateUrl: './inventario-reportes.component.html',
  styleUrls: ['./inventario-reportes.component.css']
})
export class InventarioReportesComponent implements OnInit {
  filtrosForm: FormGroup;
  datosCargados = false;
  
  metricas = {
    totalProductos: 0,
    valorTotal: 0,
    totalMovimientos: 0
  };

  datosReporte = [
    {
      producto: 'Bidón Agua Bella 20L',
      stockActual: 94,
      stockMinimo: 20,
      ultimoMovimiento: new Date(),
      estado: 'normal'
    },
    {
      producto: 'Botella Agua Bella 650ml',
      stockActual: 5,
      stockMinimo: 50,
      ultimoMovimiento: new Date(),
      estado: 'bajo'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      tipoReporte: ['stock-general'],
      fechaInicio: [null],
      fechaFin: [null]
    });
  }

  ngOnInit() {}

  generarReporte() {
    this.datosCargados = true;
    this.metricas = {
      totalProductos: 25,
      valorTotal: 12500.50,
      totalMovimientos: 156
    };
  }

  exportarPDF() {
    console.log('Exportando PDF...');
  }

  exportarExcel() {
    console.log('Exportando Excel...');
  }
}