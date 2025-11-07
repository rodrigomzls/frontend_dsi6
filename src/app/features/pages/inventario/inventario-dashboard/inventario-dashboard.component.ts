import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-inventario-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './inventario-dashboard.component.html',
  styleUrls: ['./inventario-dashboard.component.css']
})
export class InventarioDashboardComponent implements OnInit {
  totalStock = 0;
  productosStockBajo = 0;
  lotesActivos = 0;
  lotesPorCaducar = 0;

  alertas = [
    {
      tipo: 'warning',
      icono: 'warning',
      titulo: 'Stock Bajo Detectado',
      mensaje: '3 productos están por debajo del stock mínimo',
      accion: 'Revisar'
    },
    {
      tipo: 'danger',
      icono: 'schedule',
      titulo: 'Lotes por Caducar',
      mensaje: '2 lotes caducan en los próximos 30 días',
      accion: 'Ver Detalles'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.totalStock = 527;
    this.productosStockBajo = 3;
    this.lotesActivos = 15;
    this.lotesPorCaducar = 2;
  }

  goToMovimientos() {
    this.router.navigate(['/inventario/movimiento']);
  }

  goToReportes() {
    this.router.navigate(['/inventario/reportes']);
  }

  goToLotes() {
    this.router.navigate(['/lotes']);
  }

  goToProductos() {
    this.router.navigate(['/productos']);
  }

  goToPedidosProveedor() {
    this.router.navigate(['/pedidos-proveedor']);
  }

  goToProveedores() {
    this.router.navigate(['/proveedores']);
  }

  resolverAlerta(alerta: any) {
    switch(alerta.tipo) {
      case 'warning':
        this.goToProductos();
        break;
      case 'danger':
        this.goToLotes();
        break;
    }
  }
}