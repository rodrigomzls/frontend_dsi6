// src/app/core/services/ventas.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ SOLO UNA definición de interfaces
export interface Venta {
  id_venta?: number;
  id_cliente: number;
  fecha: string;
  hora: string;
  total: number;
  id_metodo_pago: number;
  id_estado_venta: number;
  id_repartidor?: number | null;
  id_vendedor?: number;
  notas?: string;
  detalles: VentaDetalle[];
  
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  estado?: string;  // Este campo viene del JOIN con estado_venta
  metodo_pago?: string;
  vendedor?: string;
  repartidor?: string;
}

export interface VentaDetalle {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
  producto_nombre?: string;
}

export interface EstadoVenta {
  id_estado_venta: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/ventas';

  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  createVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }

  updateEstadoVenta(id: number, id_estado_venta: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/estado`, { id_estado_venta });
  }

  getVentasPorEstado(idEstado: number): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}/estado/${idEstado}`);
  }

  asignarRepartidor(idVenta: number, idRepartidor: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${idVenta}/asignar-repartidor`, {
      id_repartidor: idRepartidor,
      id_estado_venta: 5 // En ruta
    });
  }

  cambiarEstadoVentaConRepartidor(idVenta: number, idEstado: number, idRepartidor?: number): Observable<any> {
    const body: any = { id_estado_venta: idEstado };
    if (idRepartidor) {
      body.id_repartidor = idRepartidor;
    }
    return this.http.patch(`${this.apiUrl}/${idVenta}/estado`, body);
  }

  // ✅ Estados que coinciden EXACTAMENTE con la base de datos
  getEstadosVenta(): EstadoVenta[] {
    return [
      { id_estado_venta: 1, estado: 'Pendiente' },
      { id_estado_venta: 2, estado: 'Confirmado' },
      { id_estado_venta: 3, estado: 'En preparación' },
      { id_estado_venta: 4, estado: 'Listo para repartos' }, // ✅ Con "s"
      { id_estado_venta: 5, estado: 'En ruta' },
      { id_estado_venta: 6, estado: 'Entregado' },
      { id_estado_venta: 7, estado: 'Pagado' },
      { id_estado_venta: 8, estado: 'Cancelado' }
    ];
  }

  getMetodosPago(): any[] {
    return [
      { id_metodo_pago: 1, metodo_pago: 'Efectivo' },
      { id_metodo_pago: 2, metodo_pago: 'Yape' },
      { id_metodo_pago: 3, metodo_pago: 'Transferencia' },
      { id_metodo_pago: 4, metodo_pago: 'Tarjeta' }
    ];
  }
}