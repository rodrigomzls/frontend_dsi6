// src/app/core/services/repartidor-venta.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { RepartidorVenta } from '../models/repartidor-venta.model';

@Injectable({
  providedIn: 'root'
})
export class RepartidorVentaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/ventas';

  // Obtener ventas asignadas al repartidor actual
  getVentasAsignadas(): Observable<RepartidorVenta[]> {
    console.log('🔄 Solicitando ventas asignadas...');
    return this.http.get<RepartidorVenta[]>(`${this.apiUrl}/repartidor/asignadas`).pipe(
      tap(ventas => console.log(`✅ Ventas asignadas recibidas: ${ventas.length}`)),
      catchError(error => {
        console.error('❌ Error obteniendo ventas asignadas:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener entregas pendientes (estado "En ruta")
  getEntregasPendientes(): Observable<RepartidorVenta[]> {
    console.log('🔄 Solicitando entregas pendientes...');
    return this.http.get<RepartidorVenta[]>(`${this.apiUrl}/repartidor/pendientes`).pipe(
      tap(entregas => console.log(`✅ Entregas pendientes recibidas: ${entregas.length}`)),
      catchError(error => {
        console.error('❌ Error obteniendo entregas pendientes:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener historial de entregas completadas
  getHistorialEntregas(): Observable<RepartidorVenta[]> {
    console.log('🔄 Solicitando historial de entregas...');
    return this.http.get<RepartidorVenta[]>(`${this.apiUrl}/repartidor/historial`).pipe(
      tap(historial => console.log(`✅ Historial de entregas recibido: ${historial.length}`)),
      catchError(error => {
        console.error('❌ Error obteniendo historial:', error);
        return throwError(() => error);
      })
    );
  }

  // Marcar entrega como pagada
// Marcar entrega como pagada - USANDO RUTA DE REPARTIDOR
// Método mejorado y más restrictivo para marcar como pagado
marcarComoPagado(idVenta: number): Observable<any> {
  console.log(`🔄 Marcando venta ${idVenta} como pagada...`);
  return this.http.patch(`${this.apiUrl}/repartidor/${idVenta}/pagado`, {}).pipe(
    tap(() => console.log(`✅ Venta ${idVenta} marcada como pagada`)),
    catchError(error => {
      console.error(`❌ Error marcando venta ${idVenta} como pagada:`, error);
      return throwError(() => error);
    })
  );
}

// Método para verificar si puede marcar como pagado
verificarPuedeMarcarPagado(idVenta: number): Observable<{puede: boolean, mensaje?: string}> {
  return this.http.get<{puede: boolean, mensaje?: string}>(`${this.apiUrl}/repartidor/${idVenta}/verificar-pago`);
}

// Método para obtener ubicación actual
obtenerUbicacionActual(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocalización no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordenadas = `${position.coords.latitude},${position.coords.longitude}`;
        resolve(coordenadas);
      },
      (error) => {
        reject(`Error obteniendo ubicación: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}



// Marcar entrega como cancelada - USANDO RUTA DE REPARTIDOR
marcarComoCancelado(idVenta: number, motivo?: string): Observable<any> {
  console.log(`🔄 Marcando venta ${idVenta} como cancelada...`);
  return this.http.patch(`${this.apiUrl}/repartidor/${idVenta}/cancelado`, { 
    motivo: motivo 
  }).pipe(
    tap(() => console.log(`✅ Venta ${idVenta} marcada como cancelada`)),
    catchError(error => {
      console.error(`❌ Error marcando venta ${idVenta} como cancelada:`, error);
      return throwError(() => error);
    })
  );
}

 // En el servicio, mejorar el método getVentaDetalle:
getVentaDetalle(idVenta: number): Observable<RepartidorVenta> {
  console.log(`🔄 Solicitando detalle completo de venta ${idVenta}...`);
  // Cambiar la URL a la nueva ruta
  return this.http.get<RepartidorVenta>(`${this.apiUrl}/repartidor/detalle/${idVenta}`).pipe(
    tap((venta) => {
      console.log(`✅ Detalle completo recibido:`, venta);
      if (!venta.detalles) {
        console.warn('⚠️ La venta no incluye detalles de productos');
      }
    }),
    catchError(error => {
      console.error(`❌ Error obteniendo detalle de venta ${idVenta}:`, error);
      return throwError(() => error);
    })
  );
}

// En repartidor-venta.service.ts
// En repartidor-venta.service.ts - mejorar el método
// En repartidor-venta.service.ts - CORREGIR EL TIPO
iniciarRutaEntrega(idVenta: number, coordenadas?: string | null): Observable<any> {
  console.log(`🔄 Iniciando ruta física para venta ${idVenta}...`);
  
  // ✅ Asegurar que coordenadas nunca sea undefined en el body
  const body = { 
    coordenadas: coordenadas || null 
  };
  
  console.log(`📍 Enviando coordenadas:`, body.coordenadas);
  
  return this.http.patch(`${this.apiUrl}/repartidor/${idVenta}/iniciar-ruta`, body).pipe(
    tap((response) => console.log(`✅ Ruta física iniciada para venta ${idVenta}`, response)),
    catchError(error => {
      console.error(`❌ Error iniciando ruta ${idVenta}:`, error);
      return throwError(() => error);
    })
  );
}

// src/app/core/services/repartidor-venta.service.ts - AGREGAR ESTE MÉTODO

cambiarMetodoPago(idVenta: number, idMetodoPago: number): Observable<any> {
  console.log(`🔄 Cambiando método de pago de venta ${idVenta} a ${idMetodoPago}`);
  return this.http.patch(`${this.apiUrl}/repartidor/${idVenta}/cambiar-metodo-pago`, { 
    id_metodo_pago: idMetodoPago 
  }).pipe(
    tap(() => console.log(`✅ Método de pago cambiado para venta ${idVenta}`)),
    catchError(error => {
      console.error(`❌ Error cambiando método de pago para venta ${idVenta}:`, error);
      return throwError(() => error);
    })
  );
}
}