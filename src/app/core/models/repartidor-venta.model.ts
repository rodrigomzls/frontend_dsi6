// src/app/core/models/repartidor-venta.model.ts
export interface RepartidorVenta {
  id_venta: number;
  id_cliente: number;
  fecha: string;
  hora: string;
  total: number;
  id_estado_venta: number;
  estado: string;
  nombre_completo: string;
  telefono: string;
  direccion: string;
  coordenadas?: string;
  razon_social?: string;
  metodo_pago: string;
  notas?: string;
  fecha_creacion: string;
  
  // Detalles de la venta
  detalles?: VentaDetalle[];
}

export interface VentaDetalle {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  producto_nombre: string;
  subtotal: number;
}