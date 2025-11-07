// src/app/core/models/proveedor.model.ts
export interface Proveedor {
  id_proveedor: number;
  id_persona: number;
  razon_social: string;
  activo: boolean;
  fecha_registro: string;

  // Datos relacionados (JOIN con persona)
  persona?: {
    nombre_completo: string;
    numero_documento: string;
    telefono?: string;
    direccion?: string;
  };
}

export interface ProveedorCreate {
  id_persona: number;
  razon_social: string;
  activo?: boolean;
}

export interface ProveedorUpdate {
  razon_social?: string;
  activo?: boolean;
}
