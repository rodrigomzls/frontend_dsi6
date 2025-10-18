export interface Cliente {
  id?: number;
  nombre: string;
  telefono: string;
  direccion: string;
  distritoId: number;
  tipoCliente: 'Bodega' | 'Restaurante' | 'Gimnasio' | 'Final';
  activo?: boolean;
  fechaRegistro?: string;
  paisNombre?: string;
  departamentoNombre?: string;
  provinciaNombre?: string;
  distritoNombre?: string;
}

export interface Country {
  id_pais: number;
  pais: string;
}

export interface Department {
  id_departamento: number;
  departamento: string;
  id_pais: number;
}

export interface Province {
  id_provincia: number;
  provincia: string;
  id_departamento: number;
}

export interface District {
  id_distrito: number;
  distrito: string;
  id_provincia: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}