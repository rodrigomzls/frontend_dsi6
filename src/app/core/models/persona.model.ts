export interface Person {
  id?: number;
  nombre: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string;
  direccion: string;
  paisId: number;
  departamentoId: number;
  provinciaId: number;
  distritoId: number;
  coordenadas: string;
  paisNombre?: string;
  departamentoNombre?: string;
  provinciaNombre?: string;
  distritoNombre?: string;
}

export interface Country {
  id: number;
  nombre: string;
}

export interface Department {
  id: number;
  nombre: string;
  paisId: number;
}

export interface Province {
  id: number;
  nombre: string;
  departamentoId: number;
}

export interface District {
  id: number;
  nombre: string;
  provinciaId: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
