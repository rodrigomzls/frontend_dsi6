// src/app/core/models/marca.model.ts
export interface Marca {
  id_marca: number;
  nombre: string;
}

export interface MarcaCreate {
  nombre: string;
}

export interface MarcaUpdate {
  nombre?: string;
}
