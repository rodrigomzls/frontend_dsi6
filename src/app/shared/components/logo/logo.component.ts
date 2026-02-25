// src/app/shared/components/logo/logo.component.ts
import { Component, Input, OnInit, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonalizacionService } from '../../../core/services/personalizacion.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent implements OnInit, OnDestroy {
  @Input() tipo: 'login' | 'navbar' = 'login';
  @Input() clickable: boolean = true;

  private personalizacionService = inject(PersonalizacionService);
  private router = inject(Router);
  
  // Effect para reaccionar a cambios en la configuración
  private effectRef = effect(() => {
    const config = this.personalizacionService.config();
    if (config) {
      this.actualizarDesdeConfig(config);
    }
  });

  logoUrl: string = '';
  nombreSistema: string = '';
  textoMostrar: string = '💧';
  imageError: boolean = false;

  ngOnInit() {
    this.cargarConfiguracionInicial();
  }

  ngOnDestroy() {
    if (this.effectRef) {
      this.effectRef.destroy();
    }
  }

  private cargarConfiguracionInicial() {
    const config = this.personalizacionService.config();
    if (config) {
      this.actualizarDesdeConfig(config);
    } else {
      this.nombreSistema = 'VIÑA';
      this.textoMostrar = '💧';
    }
  }

  private actualizarDesdeConfig(config: any) {
    this.nombreSistema = config.nombre_sistema || 'VIÑA';
    
    // ✅ Usar las señales computadas del servicio
    if (this.tipo === 'login') {
      this.logoUrl = this.personalizacionService.logoLoginUrl();
      this.textoMostrar = config.logo_texto || '💧';
    } else {
      this.logoUrl = this.personalizacionService.logoNavbarUrl();
      this.textoMostrar = config.nombre_sistema?.charAt(0) || 'V';
    }
    
    this.imageError = false;
  }

  onImageError() {
    this.imageError = true;
    console.warn(`Error al cargar logo para ${this.tipo}`);
  }

  onClick() {
    if (this.clickable && this.tipo === 'navbar') {
      this.router.navigate(['/inicio']);
    }
  }
}