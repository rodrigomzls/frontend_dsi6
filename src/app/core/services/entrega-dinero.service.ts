// src/app/core/services/entrega-dinero.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
export interface HistorialEntregasResponse {
  success: boolean;
  data: {
    entregas: any[];
    estadisticas?: {
      total_entregas: number;
      monto_total: number;
      primera_entrega?: string;
      ultima_entrega?: string;
    };
    total_registros: number;
  };
}

export interface TotalEntregadoResponse {
  success: boolean;
  data: {
    hoy: {
      total: number;
      entregas: number;
      metodos: string[];
    };
    semana: {
      total: number;
      entregas: number;
    };
    mes: {
      total: number;
      entregas: number;
    };
  };
}

export interface RegistrarEntregaResponse {
  success: boolean;
  message: string;
  data: {
    id_entrega: number;
    total: number;
    metodo_entrega: string;
    fecha_entrega: string;
    estado: string;
    repartidor: {
      id: number;
      nombre: string;
    };
  };
}
@Injectable({
  providedIn: 'root'
})
export class EntregaDineroService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/entregas-dinero';

  constructor() {
    console.log('💰 EntregaDineroService inicializado');
  }

  /**
   * Registrar entrega de dinero al administrador
   * @param total Monto total a entregar
   * @param metodoEntrega Método de entrega (efectivo, transferencia, yape)
   */
  registrarEntrega(total: number, metodoEntrega: string = 'efectivo'): Observable<RegistrarEntregaResponse> {
    console.log(`💰 Registrando entrega de dinero: S/ ${total} - Método: ${metodoEntrega}`);
    
    const payload = {
      total: total,
      metodo_entrega: metodoEntrega,
      fecha_entrega: new Date().toISOString()
    };

    return this.http.post<RegistrarEntregaResponse>(`${this.apiUrl}/registrar`, payload).pipe(
      tap(response => {
        console.log('✅ Entrega de dinero registrada:', response);
      }),
      catchError(error => {
        console.error('❌ Error registrando entrega de dinero:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Obtener historial de entregas de dinero
   */
    getHistorialEntregas(): Observable<HistorialEntregasResponse> {
    console.log('📋 Solicitando historial de entregas de dinero...');
    
    return this.http.get<HistorialEntregasResponse>(`${this.apiUrl}/historial`).pipe(
      tap(response => {
        console.log(`✅ Historial recibido: ${response.data?.entregas?.length || 0} registros`);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo historial de entregas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener total entregado al administrador (hoy)
   */
  getTotalEntregadoAlAdmin(): Observable<TotalEntregadoResponse> {
    console.log('💰 Solicitando total entregado al admin...');
    
    return this.http.get<TotalEntregadoResponse>(`${this.apiUrl}/total-entregado`).pipe(
      tap(response => {
        console.log(`✅ Total entregado recibido: S/ ${response.data?.hoy?.total || 0}`);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo total entregado:', error);
        // Si hay error, retornamos un observable con valores por defecto
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener dinero pendiente de entrega (para el día actual)
   */
 getDineroPendiente(): Observable<{ success: boolean; data: { pendiente: number; ventas_pendientes: number } }> {
    console.log('💰 Solicitando dinero pendiente...');
    
    return this.http.get<{ success: boolean; data: { pendiente: number; ventas_pendientes: number } }>(`${this.apiUrl}/pendiente`).pipe(
      tap(response => {
        console.log(`✅ Dinero pendiente: S/ ${response.data?.pendiente || 0}`);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo dinero pendiente:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener resumen de entregas de dinero por fecha
   * @param fechaInicio Fecha de inicio (YYYY-MM-DD)
   * @param fechaFin Fecha de fin (YYYY-MM-DD)
   */
  getResumenPorFechas(fechaInicio: string, fechaFin: string): Observable<any[]> {
    console.log(`📊 Solicitando resumen de entregas: ${fechaInicio} a ${fechaFin}`);
    
    return this.http.get<any[]>(`${this.apiUrl}/resumen`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    }).pipe(
      tap(resumen => {
        console.log(`✅ Resumen recibido: ${resumen?.length || 0} días`);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo resumen:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verificar si hay entregas pendientes de verificación
   */
  getEntregasPendientesVerificacion(): Observable<any[]> {
    console.log('🔍 Verificando entregas pendientes...');
    
    return this.http.get<any[]>(`${this.apiUrl}/pendientes-verificacion`).pipe(
      tap(entregas => {
        console.log(`✅ Entregas pendientes: ${entregas?.length || 0}`);
      }),
      catchError(error => {
        console.error('❌ Error verificando entregas pendientes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Exportar historial a PDF
   */
  exportarPDF(fechaInicio: string, fechaFin: string): Observable<Blob> {
    console.log('📄 Exportando historial a PDF...');
    
    return this.http.get(`${this.apiUrl}/exportar-pdf`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('✅ PDF generado correctamente');
      }),
      catchError(error => {
        console.error('❌ Error generando PDF:', error);
        return throwError(() => error);
      })
    );
  }
  /**
 * Obtener dinero realmente pendiente (ventas pagadas - entregas ya registradas)
 */
getDineroRealmentePendiente(): Observable<{ pendiente: number, ventas_pendientes: number }> {
  console.log('💰 Solicitando dinero realmente pendiente...');
  
  return this.http.get<{ pendiente: number, ventas_pendientes: number }>(
    `${this.apiUrl}/dinero-realmente-pendiente`
  ).pipe(
    tap(response => {
      console.log(`✅ Dinero realmente pendiente: S/ ${response.pendiente}`);
    }),
    catchError(error => {
      console.error('❌ Error obteniendo dinero pendiente:', error);
      return throwError(() => error);
    })
  );
}
// Modificar getEntregasHoy() para manejar mejor el error:
getEntregasHoy(): Observable<{success: boolean, data: {total_entregado: number, entregas: any[]}}> {
  const hoy = new Date().toISOString().split('T')[0];
  
  return this.http.get<{success: boolean, data: {total_entregado: number, entregas: any[]}}>(
    `${this.apiUrl}/entregas-hoy`
  ).pipe(
    tap(response => {
      if (response.success) {
        console.log(`💰 Entregas hoy: S/ ${response.data?.total_entregado || 0}`);
      }
    }),
    catchError(error => {
      // Si es 401, solo registra el error pero no lances otra solicitud
      if (error.status === 401) {
        console.warn('⚠️ No autorizado para obtener entregas hoy (puede ser normal si no hay entregas)');
      } else {
        console.error('❌ Error obteniendo entregas de hoy:', error);
      }
      // Retorna observable con valores por defecto en lugar de propagar el error
      return of({
        success: false,
        data: {
          total_entregado: 0,
          entregas: []
        }
      });
    })
  );
}
getEntregasPorFecha(fecha: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/por-fecha`, {
    params: { fecha: fecha }
  }).pipe(
    tap(entregas => {
      console.log(`📅 Entregas para ${fecha}: ${entregas?.length || 0}`);
    }),
    catchError(error => {
      console.error('❌ Error obteniendo entregas por fecha:', error);
      return throwError(() => error);
    })
  );
}
// Agrega este método para obtener dinero pendiente de HOY
getDineroPendienteHoy(): Observable<{ pendiente: number, ventas_pendientes: number }> {
  console.log('💰 Solicitando dinero pendiente de HOY...');
  
  return this.http.get<{ pendiente: number, ventas_pendientes: number }>(
    `${this.apiUrl}/pendiente-hoy`
  ).pipe(
    tap(response => {
      console.log(`✅ Dinero pendiente HOY: S/ ${response.pendiente}`);
    }),
    catchError(error => {
      console.error('❌ Error obteniendo dinero pendiente hoy:', error);
      // Si hay error 401, deja que el interceptor maneje
      return throwError(() => error);
    })
  );
}
}