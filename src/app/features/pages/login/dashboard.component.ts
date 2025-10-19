import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Bienvenido al Sistema</h1>
      <p>Selecciona una opción del menú para comenzar.</p>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
      text-align: center;
    }
  `]
})
export class DashboardComponent { }