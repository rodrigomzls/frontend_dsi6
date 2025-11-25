// inventario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://localhost:4000/api/inventario';

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  getReporteStock(filtros: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reportes/stock`, filtros);
  }

  getProductosStockBajo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/alertas/stock-bajo`);
  }

  getLotesPorCaducar(): Observable<any> {
    return this.http.get(`${this.apiUrl}/alertas/caducidad`);
  }
}