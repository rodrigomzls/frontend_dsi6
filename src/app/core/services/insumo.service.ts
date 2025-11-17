// src/app/core/services/insumo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Insumo {
  id_insumo: number;
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  costo_promedio: number;
  stock_actual: number;
  stock_minimo: number;
  id_proveedor_principal?: number;
  activo: boolean;
  fecha_creacion: string;
}

export interface InsumoCreate {
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  costo_promedio: number;
  stock_minimo: number;
  id_proveedor_principal?: number;
}

export interface InsumoUpdate {
  nombre?: string;
  descripcion?: string;
  unidad_medida?: string;
  costo_promedio?: number;
  stock_minimo?: number;
  id_proveedor_principal?: number;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InsumoService {
  private apiUrl = 'http://localhost:4000/api/insumos';

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    console.error('InsumoService error:', error);
    let message = 'Error en el servidor';
    if (error.status === 0) message = 'No se puede conectar al servidor';
    else if (error.error?.message) message = error.error.message;
    return throwError(() => new Error(message));
  }

  getInsumos(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  getInsumoById(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  createInsumo(payload: InsumoCreate): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload).pipe(catchError(this.handleError));
  }

  updateInsumo(id: number, payload: InsumoUpdate): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(catchError(this.handleError));
  }

  deleteInsumo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }
}