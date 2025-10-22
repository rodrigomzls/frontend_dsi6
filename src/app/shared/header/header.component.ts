import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service'; // Ajusta la ruta

@Component({
  selector: 'app-header',
  imports: [MatIcon, CommonModule, RouterModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}