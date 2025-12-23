// src/app/core/services/ventas.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ SOLO UNA definición de interfaces
// En ventas.service.ts - CORREGIDO
export interface Venta {
  id_venta?: number;
  id_cliente: number;
  fecha: string;
  hora: string;
  total: number;
  id_metodo_pago: number;
  id_estado_venta: number;
  id_repartidor?: number | null; // ✅ Ya permite null
  id_vendedor?: number | null;   // ✅ Agregar | null aquí
  notas?: string;
  detalles: VentaDetalle[];
    // ✅ NUEVAS PROPIEDADES PARA COMPROBANTES
  tipo_comprobante?: string;
   tipo_comprobante_solicitado?: string; // ← AGREGAR ESTE CAMPO
  serie_comprobante?: string;
  numero_correlativo?: number;
  
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  estado?: string;
  metodo_pago?: string;
  vendedor?: string;
  repartidor?: string;

  // ✅ AGREGAR estas propiedades que vienen de la base de datos
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  razon_social?: string;
  coordenadas?: string;
  placa_furgon?: string;
  comprobante_emitido?: number; // ✅ AGREGAR ESTE CAMPO
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

// ✅ INTERFAZ PARA LA RESPUESTA DEL NÚMERO DE COMPROBANTE
export interface SiguienteNumeroResponse {
  success: boolean;
  tipo: string;
  serie: string;
  numero_secuencial: number;
  correlativo: string;
  serie_numero: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/ventas';
  private sunatApiUrl = 'http://localhost:4000/api/sunat'; // ✅ URL para SUNAT

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

// ✅ NUEVO MÉTODO: Obtener siguiente número de comprobante
  getSiguienteNumeroComprobante(tipo: string, idCliente: number): Observable<SiguienteNumeroResponse> {
    return this.http.post<SiguienteNumeroResponse>(`${this.sunatApiUrl}/siguiente-numero`, {
      tipo: tipo,
      id_cliente: idCliente
    });
  }




  // ✅ Estados que coinciden EXACTAMENTE con la base de datos
  getEstadosVenta(): EstadoVenta[] {
    return [
      //**{ id_estado_venta: 1, estado: 'Pendiente' },  { id_estado_venta: 4, estado: 'Listo para repartos' }, 
    // ✅ Con "s" **//
      { id_estado_venta: 5, estado: 'En ruta' },
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