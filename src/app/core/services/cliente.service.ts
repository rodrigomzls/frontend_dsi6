// En cliente.service.ts - versión completa corregida
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { Cliente, Country, Department, Province, District } from '../models/cliente.model';

// Interface para clientes en ventas
export interface ClienteVenta {
  id_cliente: number;
  tipo_cliente: string;
  nombre_completo?: string;
  activo?: boolean;
  fecha_registro?: string;
  persona?: {
    nombre_completo: string;
    telefono: string;
    numero_documento: string;
    direccion?: string;
    coordenadas?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    
    if (error.status === 400) {
      return throwError(() => new Error(error.error?.message || 'Datos inválidos'));
    }
    if (error.status === 404) {
      return throwError(() => new Error('Cliente no encontrado'));
    }
    
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  // Obtener todos los clientes (mantener la interfaz original para otros componentes)
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`).pipe(
      catchError(this.handleError)
    );
  }

 // En cliente.service.ts - corrige el método getClientesParaVentas
getClientesParaVentas(): Observable<ClienteVenta[]> {
  return this.http.get<any[]>(`${this.apiUrl}/clientes`).pipe(
    map(clientes => clientes.map(cliente => {
      console.log('🔍 Cliente recibido del backend:', cliente); // Para debug
      
      return {
        id_cliente: cliente.id_cliente || cliente.id, // ✅ Usar id_cliente si existe, sino id
        tipo_cliente: cliente.tipo_cliente,
        razon_social: cliente.razon_social,
        activo: cliente.activo,
        fecha_registro: cliente.fecha_registro,
        persona: {
          nombre_completo: cliente.nombre_completo || cliente.nombre,
          telefono: cliente.telefono,
          numero_documento: cliente.numero_documento || cliente.dni,
          direccion: cliente.direccion,
          coordenadas: cliente.coordenadas
        }
      };
    })),
    catchError(this.handleError)
  );
}
  // Obtener cliente por ID (mantener original)
  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/clientes/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Crear cliente
  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/clientes`, cliente).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar cliente
  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}`, cliente).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar cliente
  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clientes/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}