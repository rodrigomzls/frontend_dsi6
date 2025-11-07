// src/app/core/models/movimiento-stock.model.ts
export interface MovimientoStock {
  id_movimiento: number;
  id_producto: number;
  tipo_movimiento: 'ingreso' | 'egreso' | 'ajuste' | 'venta' | 'devolucion';
  cantidad: number;
  fecha: string;
  descripcion?: string;
  id_usuario?: number;

  // Datos relacionados (JOIN)
  producto?: {
    nombre: string;
  };
  usuario?: {
    id_usuario: number;
    username: string;
    nombre: string;
  };
}

export interface MovimientoStockCreate {
  id_producto: number;
  tipo_movimiento: 'ingreso' | 'egreso' | 'ajuste' | 'venta' | 'devolucion';
  cantidad: number;
  descripcion?: string;
  id_usuario?: number;
}

export interface MovimientoStockUpdate {
  tipo_movimiento?: 'ingreso' | 'egreso' | 'ajuste' | 'venta' | 'devolucion';
  cantidad?: number;
  descripcion?: string;
}
