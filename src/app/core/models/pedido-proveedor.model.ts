// src/app/core/models/pedido-proveedor.model.ts
export interface PedidoProveedor {
  id_pedido: number;
  id_proveedor: number;
  id_producto: number;
  fecha: string;
  cantidad: number;
  id_estado_pedido: number;
  costo_unitario?: number;
  total?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;

  // Datos del proveedor y producto (JOIN)
  proveedor?: {
    razon_social: string;
  };
  producto?: {
    nombre: string;
    descripcion?: string;
  };
  estado?: {
    id_estado_pedido: number;
    estado: string;
  };
}

export interface PedidoProveedorCreate {
  id_proveedor: number;
  id_producto: number;
  fecha: string;
  cantidad: number;
  id_estado_pedido: number;
  costo_unitario?: number;
  total?: number;
}

export interface PedidoProveedorUpdate {
  cantidad?: number;
  id_estado_pedido?: number;
  costo_unitario?: number;
  total?: number;
}
