import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router) {}

 onLogin() {
  // Lógica de autenticación aquí
  console.log('Login attempt:', this.username, this.password);
  
  // Redirigir después del login exitoso - AHORA A INICIO
  this.router.navigate(['/inicio']);
}

  goToRegister() {
    this.router.navigate(['/register']);
  }
}