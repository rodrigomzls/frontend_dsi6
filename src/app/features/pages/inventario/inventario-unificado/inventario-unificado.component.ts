// src/app/features/pages/inventario/inventario-unificado/inventario-unificado.component.ts
import { Component, OnInit,OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { LoteListComponent } from '../../lote-list/lote-list.component';
import { MovimientoStockListComponent } from '../../movimiento-stock-list/movimiento-stock-list.component';
import { InventarioDashboardComponent } from '../../inventario/inventario-dashboard/inventario-dashboard.component';
import { MovimientoStockUnificadoFormComponent } from '../../../../components/movimiento-stock-unificado-form/movimiento-stock-unificado-form.component';

@Component({
  selector: 'app-inventario-unificado',
  templateUrl: './inventario-unificado.component.html',
  styleUrls: ['./inventario-unificado.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LoteListComponent,
    MovimientoStockListComponent,
    InventarioDashboardComponent
  ]
})
export class InventarioUnificadoComponent implements OnInit, OnDestroy {
  
  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    // Escuchar eventos de actualización
    window.addEventListener('inventario-actualizado', this.actualizarComponentes.bind(this));
  }

  ngOnDestroy(): void {
    // Limpiar event listener
    window.removeEventListener('inventario-actualizado', this.actualizarComponentes.bind(this));
  }

  private actualizarComponentes(): void {
    // Disparar eventos específicos para cada componente
    window.dispatchEvent(new CustomEvent('actualizar-movimientos'));
    window.dispatchEvent(new CustomEvent('actualizar-lotes'));
    window.dispatchEvent(new CustomEvent('actualizar-dashboard'));
  }

  crearMovimientoUnificado(): void {
    const dialogRef = this.dialog.open(MovimientoStockUnificadoFormComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'movimiento-unificado-dialog'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actualizarComponentes();
      }
    });
  }
}