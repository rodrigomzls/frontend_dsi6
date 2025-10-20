import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 Necesario para el pipe 'number'
import { ProductService } from '../../../core/services/producto.service';
import { Product } from '../../../core/models/producto.model';

@Component({
  selector: 'app-home',
  standalone: true, // 👈 importante
  imports: [CommonModule], // 👈 aquí habilitamos los pipes y directivas ngFor, ngIf, etc.
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  productos: Product[] = [];
  currentSlide: number = 0;
  slides = [
    { image: '../../../../assets/image1.jpg', title: 'Nueva Colección', subtitle: 'Explora lo más reciente' },
    { image: '../../../../assets/image2.jpg', title: 'Ofertas Especiales', subtitle: 'Descuentos hasta 50%' },
    { image: '../../../../assets/image3.jpg', title: 'Compra con confianza', subtitle: 'Calidad garantizada' }
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.iniciarCarrusel();
  }

  cargarProductos(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  agregarAlCarrito(producto: Product): void {
    console.log('🛒 Producto agregado al carrito:', producto);
  }

  iniciarCarrusel(): void {
    setInterval(() => {
      this.cambiarSlideAutomatico();
    }, 4000);
  }

  cambiarSlide(index: number): void {
    this.currentSlide = index;
  }

  cambiarSlideAutomatico(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  isActiveSlide(index: number): boolean {
    return this.currentSlide === index;
  }
}
