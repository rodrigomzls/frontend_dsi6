import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, throwError, catchError } from 'rxjs';
import { Product, Country, Category, Brand, Supplier } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'http://localhost:4200/api';

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  // ========= MÉTODOS DE RELACIONES =========
  getCategorias(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`).pipe(
      catchError(this.handleError)
    );
  }

  getMarcas(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/marcas`).pipe(
      catchError(this.handleError)
    );
  }

  getProveedores(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/proveedor`).pipe(
      catchError(this.handleError)
    );
  }

  getPaises(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiUrl}/paises`).pipe(
      catchError(this.handleError)
    );
  }

  // ========= PRODUCTOS =========
  getProductsWithDetails(): Observable<any[]> {
  return forkJoin({
    productos: this.http.get<Product[]>(`${this.apiUrl}/productos`),
    paises: this.http.get<Country[]>(`${this.apiUrl}/paises`),
    categorias: this.http.get<Category[]>(`${this.apiUrl}/categorias`),
    marcas: this.http.get<Brand[]>(`${this.apiUrl}/marcas`),
    proveedores: this.http.get<Supplier[]>(`${this.apiUrl}/proveedor`)
  }).pipe(
    map(({ productos, paises, categorias, marcas, proveedores }) => {
      console.log('=== DEBUG PRODUCTOS ===');
      productos.forEach((product, index) => {
        console.log(`Producto ${index}:`, {
          id: product.id,
          categoriaId: product.categoriaId,
          marcaId: product.marcaId,
          proveedorId: product.proveedorId,
          paisOrigenId: product.paisOrigenId
        });
      });
      console.log('=== FIN DEBUG ===');
      
      return productos.map(product => {
        const pais = paises.find(p => p.id === product.paisOrigenId);
        const categoria = categorias.find(c => c.id_categoria === product.categoriaId);
        const marca = marcas.find(m => m.id_marca=== product.marcaId);
        const proveedor = proveedores.find(prov => prov.id_proveedor === product.proveedorId);

        return {
          ...product,
          paisOrigenNombre: pais ? pais.nombre : 'No encontrado',
          categoriaNombre: categoria ? categoria.nombre : 'No encontrado',
          marcaNombre: marca ? marca.nombre : 'No encontrado',
          proveedorNombre: proveedor ? proveedor.nombre : 'No encontrado'
        };
      });
    }),
    catchError(this.handleError)
  );
}

  private getNameById(items: any[], id: number): string {
    const item = items.find(i => i.id === id);
    return item ? item.nombre : 'N/A';
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/productos`).pipe(
      catchError(this.handleError)
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/productos/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/productos`, product).pipe(
      catchError(this.handleError)
    );
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/productos/${id}`, product).pipe(
      catchError(this.handleError)
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/productos/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}
