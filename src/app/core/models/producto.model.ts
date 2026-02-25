export interface Product {
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: number;
  marcaId: number;
  paisOrigenId: number;
  categoriaNombre?: string;
  marcaNombre?: string;
  paisOrigenNombre?: string;
  
   // 🔹 Agrega esta línea (opcional)
  imagen?: string;
}

export interface Country {
  id: number;
  nombre: string;
}

export interface Category {
  id_categoria: number;
  nombre: string;
}

export interface Brand {
  id_marca: number;
  nombre: string;
}

export interface Supplier {
  id_proveedor: number;
  nombre: string;
}
