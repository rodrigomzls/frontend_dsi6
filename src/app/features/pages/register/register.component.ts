import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  userData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  passwordsMatch: boolean = true;
  isSubmitting: boolean = false;

  constructor(private router: Router) {}

  validatePasswords() {
    this.passwordsMatch = this.userData.password === this.userData.confirmPassword;
  }

  onRegister() {
    // Validar que las contraseñas coincidan
    this.validatePasswords();
    
    if (!this.passwordsMatch) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar campos requeridos
    if (!this.userData.username || !this.userData.email || !this.userData.password) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Simular proceso de registro
    this.isSubmitting = true;
    
    console.log('Datos de registro:', this.userData);
    
    // Simular llamada a API
    setTimeout(() => {
      this.isSubmitting = false;
      alert('Registro exitoso! Por favor inicia sesión.');
      this.router.navigate(['/login']);
    }, 1500);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}