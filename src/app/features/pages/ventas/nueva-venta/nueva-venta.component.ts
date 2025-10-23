// En nueva-venta.component.ts - versión completa corregida
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VentasService, Venta, VentaDetalle } from '../../../../core/services/ventas.service';
import { ClienteService, ClienteVenta } from '../../../../core/services/cliente.service'; // ✅ Importar ClienteVenta
import { ProductService} from '../../../../core/services/producto.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RepartidorService } from '../../../../core/services/repartidor.service'; // ✅ Importar servicio
import { Repartidor } from '../../../../core/models/repartidor.model'; // ✅ Importar modelo

@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-venta.component.html',
  styleUrls: ['./nueva-venta.component.css']
})

export class NuevaVentaComponent implements OnInit {
  private ventasService = inject(VentasService);
  private clientesService = inject(ClienteService);
  private productosService = inject(ProductService);
  private authService = inject(AuthService);
  public router = inject(Router);
  private repartidorService = inject(RepartidorService); // ✅ Inyectar servicio

  // Datos de la venta
  venta: Venta = {
    id_cliente: 0,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    total: 0,
    id_metodo_pago: 1, // Efectivo por defecto
    id_estado_venta: 1, // Pendiente
    detalles: []
  };

  // Datos auxiliares - usar ClienteVenta[]
  clientes: ClienteVenta[] = []; // ✅ Cambiar a ClienteVenta[]
  productos: any[] = [];
  metodosPago = this.ventasService.getMetodosPago();
  repartidores: Repartidor[] = []; // ✅ Usar el modelo Repartidor
  // Búsqueda
  searchCliente: string = '';
  searchProducto: string = '';
  
  // Producto temporal para agregar al carrito
  productoSeleccionado: any = null;
  cantidad: number = 1;

  // Estados
  loading = false;
  error = '';

  filteredClientes: ClienteVenta[] = []; // ✅ Cambiar a ClienteVenta[]
  filteredProductos: any[] = [];

  ngOnInit() {
    this.cargarDatosIniciales();
    this.cargarRepartidores(); // ✅ Cargar repartidores
  }

// En nueva-venta.component.ts - en cargarDatosIniciales
// En nueva-venta.component.ts - corrige la función cargarDatosIniciales
async cargarDatosIniciales() {
  try {
    // Cargar clientes para ventas
    this.clientesService.getClientesParaVentas().subscribe({
      next: (clientes: ClienteVenta[]) => {
        console.log('📋 Clientes cargados para ventas:', clientes);
        this.clientes = clientes;
        this.filteredClientes = clientes;
      },
      error: (error) => console.error('Error cargando clientes:', error)
    });

    // Cargar productos
    this.productosService.getProducts().subscribe({
      next: (productos) => {
        console.log('📦 Productos cargados (estructura completa):', productos);
        
        // Verificar estructura del primer producto
        if (productos.length > 0) {
          console.log('🔍 Estructura detallada del primer producto:');
          console.log('   - id:', productos[0].id);
          console.log('   - nombre:', productos[0].nombre);
          console.log('   - precio:', productos[0].precio);
          console.log('   - stock:', productos[0].stock);
          console.log('   - categoriaId:', productos[0].categoriaId);
          console.log('   - marcaId:', productos[0].marcaId);
        }
        
        this.productos = productos;
        this.filteredProductos = productos;
      },
      error: (error) => console.error('Error cargando productos:', error)
    });

  } catch (error) {
    console.error('Error inicializando venta:', error);
  }
}

cargarRepartidores() {
  this.repartidorService.getRepartidoresActivos().subscribe({
    next: (repartidores) => {
      console.log('🚚 Repartidores activos cargados:', repartidores);
      this.repartidores = repartidores;
    },
    error: (error) => console.error('Error cargando repartidores:', error)
  });
}

  // Búsqueda de clientes
  filtrarClientes() {
    if (!this.searchCliente) {
      this.filteredClientes = this.clientes;
      return;
    }
    
    const searchLower = this.searchCliente.toLowerCase();
    this.filteredClientes = this.clientes.filter(cliente =>
      cliente.razon_social?.toLowerCase().includes(searchLower) ||
      cliente.persona?.nombre_completo?.toLowerCase().includes(searchLower) ||
      cliente.persona?.telefono?.includes(this.searchCliente) ||
      cliente.persona?.numero_documento?.includes(this.searchCliente)
    );
  }

  // Búsqueda de productos
  filtrarProductos() {
    if (!this.searchProducto) {
      this.filteredProductos = this.productos;
      return;
    }
    
    const searchLower = this.searchProducto.toLowerCase();
    this.filteredProductos = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchLower) ||
      producto.marca?.nombre.toLowerCase().includes(searchLower)
    );
  }

  // Seleccionar cliente
  seleccionarCliente(cliente: ClienteVenta) { // ✅ Usar ClienteVenta
    this.venta.id_cliente = cliente.id_cliente;
    this.searchCliente = cliente.razon_social || cliente.persona?.nombre_completo || '';
    this.filteredClientes = [];
    
    console.log('✅ Cliente seleccionado:', {
      id_cliente: this.venta.id_cliente,
      nombre: this.searchCliente
    });
  }

// En nueva-venta.component.ts - corrige seleccionarProducto
seleccionarProducto(producto: any) {
  console.log('🎯 Producto seleccionado (estructura completa):', producto);
  console.log('   - ID del producto:', producto.id); // Solo para confirmar
  
  this.productoSeleccionado = producto;
  this.cantidad = 1;
  this.searchProducto = producto.nombre;
  this.filteredProductos = [];
}
  // Agregar producto al carrito
// En nueva-venta.component.ts - corrige la función agregarProducto()
// En nueva-venta.component.ts - corrige completamente agregarProducto()
agregarProducto() {
  if (!this.productoSeleccionado || this.cantidad <= 0) {
    this.error = 'Selecciona un producto y cantidad válida';
    return;
  }

  if (this.cantidad > this.productoSeleccionado.stock) {
    this.error = `Stock insuficiente. Disponible: ${this.productoSeleccionado.stock}`;
    return;
  }

  // DEBUG: Verificar estructura del producto seleccionado
  console.log('🔍 Producto seleccionado (estructura completa):', this.productoSeleccionado);
  console.log('   - id:', this.productoSeleccionado.id);
  console.log('   - nombre:', this.productoSeleccionado.nombre);
  console.log('   - precio:', this.productoSeleccionado.precio);
  console.log('   - stock:', this.productoSeleccionado.stock);

  // Los productos solo tienen 'id', no 'id_producto'
  const detalle: VentaDetalle = {
    id_producto: this.productoSeleccionado.id, // ✅ Usar 'id' directamente
    cantidad: this.cantidad,
    precio_unitario: this.productoSeleccionado.precio,
    producto_nombre: this.productoSeleccionado.nombre
  };

  console.log('➕ Producto agregado al carrito:', detalle);

  this.venta.detalles.push(detalle);
  this.calcularTotal();
  
  // Limpiar selección
  this.productoSeleccionado = null;
  this.cantidad = 1;
  this.searchProducto = '';
  this.error = '';
}

  // Remover producto del carrito
  removerProducto(index: number) {
    this.venta.detalles.splice(index, 1);
    this.calcularTotal();
  }

  // Calcular total de la venta
  calcularTotal() {
    this.venta.total = this.venta.detalles.reduce((total, detalle) => {
      return total + (detalle.cantidad * detalle.precio_unitario);
    }, 0);
  }

  // Finalizar venta
  finalizarVenta() {
    if (this.venta.id_cliente === 0) {
      this.error = 'Selecciona un cliente';
      return;
    }

    if (this.venta.detalles.length === 0) {
      this.error = 'Agrega al menos un producto';
      return;
    }

    // Crear objeto con TODOS los campos requeridos
    const ventaParaEnviar = {
      id_cliente: this.venta.id_cliente,
      fecha: this.venta.fecha,
      hora: this.venta.hora,
      total: this.venta.total,
      id_metodo_pago: this.venta.id_metodo_pago,
      id_estado_venta: this.venta.id_estado_venta,
      id_repartidor: this.venta.id_repartidor || undefined, // ✅ Usar undefined en lugar de null
      detalles: this.venta.detalles.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario
      })),
      notas: this.venta.notas || ''
    };

  // DEBUG: Verificar datos antes de enviar
    console.log('📤 Datos que se enviarán al backend:', ventaParaEnviar);
    this.loading = true;
    this.error = '';

    this.ventasService.createVenta(ventaParaEnviar).subscribe({
      next: (ventaCreada) => {
        this.loading = false;
        alert('✅ Venta registrada correctamente');
        this.router.navigate(['/ventas']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Error al registrar la venta';
        console.error('❌ Error detallado creando venta:', error);
        
        if (error.error) {
          console.error('📋 Error del servidor:', error.error);
        }
      }
    });
  }

  // Limpiar búsquedas
  limpiarBusquedaCliente() {
    this.searchCliente = '';
    this.filteredClientes = this.clientes;
  }

  limpiarBusquedaProducto() {
    this.searchProducto = '';
    this.filteredProductos = this.productos;
    this.productoSeleccionado = null;
  }
}