// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  nombre: string;
  role: number;
  roleName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/auth';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Para comunicación entre pestañas
  private readonly STORAGE_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly LOGIN_EVENT_KEY = 'app_login';
  private readonly LOGOUT_EVENT_KEY = 'app_logout';

  constructor() {
    this.setupCrossTabCommunication();
    this.initializeAuth();
  }

  // 🔥 NUEVO MÉTODO AGREGADO
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const userData = localStorage.getItem(this.USER_KEY);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('🔐 Sesión recuperada de localStorage');
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.checkToken(); // Verificar con el backend
      }
    } else if (token) {
      // Solo hay token, verificar con backend
      this.checkToken();
    } else {
      console.log('🔐 No hay sesión activa');
      this.currentUserSubject.next(null);
    }
  }

  login(nombre_usuario: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { 
      nombre_usuario, 
      password 
    }).pipe(
      tap(response => {
        this.setSession(response);
        this.broadcastLogin();
      })
    );
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.STORAGE_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    console.log('🔐 Sesión iniciada y guardada');
  }

  public logout(): void {
    this.clearSession();
    this.broadcastLogout();
  }

  private clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    console.log('🔐 Sesión cerrada');
  }

  public getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // ... el resto de tus métodos existentes se mantienen igual
  private setupCrossTabCommunication(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      console.log('🔄 Evento storage detectado:', event.key, event.newValue);
      
      if (event.key === this.LOGIN_EVENT_KEY && event.newValue) {
        // Login en otra pestaña
        console.log('🔐 Login detectado en otra pestaña');
        this.handleCrossTabLogin();
      } else if (event.key === this.LOGOUT_EVENT_KEY && event.newValue === 'true') {
        // Logout en otra pestaña
        console.log('🔐 Logout detectado en otra pestaña');
        this.clearSession();
        localStorage.removeItem(this.LOGOUT_EVENT_KEY);
      } else if (event.key === this.STORAGE_KEY) {
        // Token cambiado manualmente
        if (event.newValue) {
          console.log('🔐 Token actualizado en otra pestaña');
          setTimeout(() => this.checkToken(), 100);
        } else {
          console.log('🔐 Token removido en otra pestaña');
          this.clearSession();
        }
      }
    });

    // También escuchar eventos de visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Pestaña se hizo visible, verificar estado
        console.log('👀 Pestaña visible - Verificando autenticación');
        this.checkToken();
      }
    });
  }

  private handleCrossTabLogin(): void {
    const token = this.getToken();
    const userData = localStorage.getItem(this.USER_KEY);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('🔐 Sesión sincronizada desde otra pestaña');
      } catch (error) {
        console.error('Error sincronizando sesión:', error);
        this.checkToken();
      }
    } else {
      console.log('🔐 No hay sesión para sincronizar');
    }
    
    localStorage.removeItem(this.LOGIN_EVENT_KEY);
  }

  private broadcastLogin(): void {
    // Notificar a otras pestañas del login
    localStorage.setItem(this.LOGIN_EVENT_KEY, Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem(this.LOGIN_EVENT_KEY);
    }, 1000);
  }

  private broadcastLogout(): void {
    // Notificar a otras pestañas del logout
    localStorage.setItem(this.LOGOUT_EVENT_KEY, 'true');
    setTimeout(() => {
      localStorage.removeItem(this.LOGOUT_EVENT_KEY);
    }, 1000);
  }

  checkToken(): void {
    const token = this.getToken();
    if (token) {
      console.log('🔐 Verificando token con backend...');
      this.http.get<{valid: boolean, user: User}>(`${this.apiUrl}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (response) => {
          if (response.valid) {
            console.log('✅ Token válido');
            // Actualizar datos del usuario
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          } else {
            console.log('❌ Token inválido');
            this.clearSession();
          }
        },
        error: (error) => {
          console.log('❌ Error verificando token:', error);
          this.clearSession();
        }
      });
    } else {
      console.log('🔐 No hay token - Usuario no autenticado');
      this.currentUserSubject.next(null);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  hasRole(role: number): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  isAdmin(): boolean {
    return this.hasRole(1);
  }

  isVendedor(): boolean {
    return this.hasRole(2);
  }
}