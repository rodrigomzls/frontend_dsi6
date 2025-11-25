import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="container mt-4">
      <h2>Gestión de Inventario</h2>
      <div class="mat-elevation-z8">
        <!-- Aquí irá tu tabla de inventario -->
        <p>Componente de Inventario - En desarrollo</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
  `]
})
export class InventarioComponent {
  // Implementación pendiente
}