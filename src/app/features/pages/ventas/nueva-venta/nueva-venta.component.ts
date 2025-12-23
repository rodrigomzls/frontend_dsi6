// En nueva-venta.component.ts - versión completa CORREGIDA
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Agrega estas importaciones para el diálogo
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Importa el pipe TruncatePipe
import { TruncatePipe } from '../../../../pipes/truncate.pipe'; // Ajusta la ruta según tu estructura
// Importa el componente del formulario de cliente
import { ClienteRapidoFormComponent } from '../../../../components/cliente-rapido-form/cliente-rapido-form.component';
import { VentasService, Venta, VentaDetalle } from '../../../../core/services/ventas.service';
import { ClienteService, ClienteVenta } from '../../../../core/services/cliente.service';
import { ProductService} from '../../../../core/services/producto.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RepartidorService } from '../../../../core/services/repartidor.service';
import { Repartidor } from '../../../../core/models/repartidor.model';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,TruncatePipe ],
  templateUrl: './nueva-venta.component.html',
  styleUrls: ['./nueva-venta.component.css']
})

export class NuevaVentaComponent implements OnInit {
  // Hacer públicos los servicios necesarios en el template
  public ventasService = inject(VentasService);
  public clientesService = inject(ClienteService);
  public productosService = inject(ProductService);
  public authService = inject(AuthService);
  public router = inject(Router);
  public repartidorService = inject(RepartidorService);
  public dialog = inject(MatDialog);

  // Datos de la venta
  venta: Venta = {
    id_cliente: 0,
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    total: 0,
    id_metodo_pago: 1,
    id_estado_venta: 1,
    id_repartidor: null,
    id_vendedor: null,
    notas: '',
    detalles: [],
    tipo_comprobante: '',
    tipo_comprobante_solicitado: ''
  };

  serieNumeroPreview: string = '';
  loadingSerie: boolean = false;
  
  // Datos auxiliares
  clientes: ClienteVenta[] = [];
  productos: any[] = [];
  metodosPago = this.ventasService.getMetodosPago();
  repartidores: Repartidor[] = [];
  
  // Búsqueda
  searchCliente: string = '';
  searchProducto: string = '';
  
  // Producto temporal para agregar al carrito
  productoSeleccionado: any = null;
  cantidad: number = 1;

  // Estados
  loading = false;
  error = '';

  filteredClientes: ClienteVenta[] = [];
  filteredProductos: any[] = [];

  // Nuevas propiedades para controlar la visualización de listas
  mostrarListaClientes: boolean = false;
  mostrarListaProductos: boolean = false;
  clienteSeleccionadoNombre: string = '';

  // Nuevas propiedades para el template
  currentYear: number = new Date().getFullYear();
  lastUpdate: Date = new Date();

  // Métodos para Math en el template
  get Math() {
    return Math;
  }

  ngOnInit() {
    this.cargarDatosIniciales();
    this.cargarRepartidores();
  }

  // Método para incrementar cantidad
  incrementarCantidad() {
    if (this.productoSeleccionado) {
      this.cantidad = Math.min(this.productoSeleccionado.stock, this.cantidad + 1);
    }
  }

  // Método para decrementar cantidad
  decrementarCantidad() {
    this.cantidad = Math.max(1, this.cantidad - 1);
  }

  // Método para limpiar toda la venta
  limpiarVenta() {
    Swal.fire({
      title: '¿Limpiar venta?',
      text: 'Se perderán todos los datos de la venta actual',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.venta = {
          id_cliente: 0,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0],
          total: 0,
          id_metodo_pago: 1,
          id_estado_venta: 1,
          id_repartidor: null,
          id_vendedor: null,
          notas: '',
          detalles: [],
          tipo_comprobante: '',
          tipo_comprobante_solicitado: ''
        };
        
        this.searchCliente = '';
        this.searchProducto = '';
        this.productoSeleccionado = null;
        this.cantidad = 1;
        this.clienteSeleccionadoNombre = '';
        this.filteredClientes = [];
        this.filteredProductos = [];
        this.mostrarListaClientes = false;
        this.mostrarListaProductos = false;
        this.error = '';
        
        Swal.fire('Limpiado', 'La venta ha sido limpiada', 'success');
      }
    });
  }

  abrirModalClienteRapido() {
    const dialogRef = this.dialog.open(ClienteRapidoFormComponent, {
      width: '750px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'cliente-rapido-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((nuevoCliente) => {
      if (nuevoCliente) {
        console.log('✅ Cliente rápido creado exitosamente:', nuevoCliente);
        this.cargarClientes();
        setTimeout(() => {
          this.buscarYSeleccionarNuevoCliente(nuevoCliente);
        }, 500);
      }
    });
  }

  private buscarYSeleccionarNuevoCliente(nuevoCliente: any) {
    const clienteEncontrado = this.clientes.find(cliente => 
      cliente.id_cliente === nuevoCliente.id_cliente || 
      cliente.id_cliente === nuevoCliente.id
    );
    
    if (clienteEncontrado) {
      this.seleccionarCliente(clienteEncontrado);
      this.mostrarMensajeExito(`Cliente "${nuevoCliente.nombre}" seleccionado automáticamente`);
    } else {
      this.cargarClientes();
      setTimeout(() => {
        const clienteReintento = this.clientes.find(cliente => 
          cliente.id_cliente === nuevoCliente.id_cliente
        );
        if (clienteReintento) {
          this.seleccionarCliente(clienteReintento);
        }
      }, 1000);
    }
  }

  private mostrarMensajeExito(mensaje: string) {
    console.log('✅', mensaje);
  }

  private cargarClientes() {
    this.clientesService.getClientesParaVentas().subscribe({
      next: (clientes: ClienteVenta[]) => {
        console.log('📋 Clientes recargados:', clientes);
        this.clientes = clientes;
        this.filteredClientes = clientes;
        
        if (this.searchCliente) {
          this.filtrarClientes();
        }
      },
      error: (error) => console.error('Error recargando clientes:', error)
    });
  }

  async cargarDatosIniciales() {
    try {
      this.clientesService.getClientesParaVentas().subscribe({
        next: (clientes: ClienteVenta[]) => {
          console.log('📋 Clientes cargados para ventas:', clientes);
          this.clientes = clientes;
          this.filteredClientes = clientes;
        },
        error: (error) => console.error('Error cargando clientes:', error)
      });

      this.productosService.getProducts().subscribe({
        next: (productos) => {
          console.log('📦 Productos cargados (estructura completa):', productos);
          
          if (productos.length > 0) {
            const primerProducto = productos[0];
            console.log('🔍 Estructura detallada del primer producto:');
            console.log('   - id_producto:', primerProducto.id_producto);
            console.log('   - id:', primerProducto.id_producto);
            console.log('   - nombre:', primerProducto.nombre);
            console.log('   - precio:', primerProducto.precio);
            console.log('   - stock:', primerProducto.stock);
            console.log('   - categoriaId:', primerProducto.categoriaId);
            console.log('   - marcaId:', primerProducto.marcaId);
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

  filtrarClientes() {
    if (!this.searchCliente) {
      this.filteredClientes = this.clientes;
      return;
    }
    
    const searchLower = this.searchCliente.toLowerCase();
    this.filteredClientes = this.clientes.filter(cliente =>
      (cliente.nombre_completo?.toLowerCase().includes(searchLower) ||
      cliente.persona?.nombre_completo?.toLowerCase().includes(searchLower) ||
      cliente.persona?.telefono?.includes(this.searchCliente) ||
      cliente.persona?.numero_documento?.includes(this.searchCliente))
    );
    
    if (this.searchCliente && this.filteredClientes.length > 0) {
      this.mostrarListaClientes = true;
    }
  }

  filtrarProductos() {
    if (!this.searchProducto) {
      this.filteredProductos = this.productos;
      return;
    }
    
    const searchLower = this.searchProducto.toLowerCase();
    this.filteredProductos = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchLower) ||
      (producto.marca?.nombre.toLowerCase().includes(searchLower)) ||
      (producto.id_producto?.toString().includes(this.searchProducto)) ||
      (producto.id?.toString().includes(this.searchProducto))
    );
    
    if (this.searchProducto && this.filteredProductos.length > 0) {
      this.mostrarListaProductos = true;
    }
  }

  seleccionarCliente(cliente: ClienteVenta) {
    this.venta.id_cliente = cliente.id_cliente;
    this.clienteSeleccionadoNombre = cliente.nombre_completo || cliente.persona?.nombre_completo || '';
    this.searchCliente = this.clienteSeleccionadoNombre;
    
    this.mostrarListaClientes = false;
    this.filteredClientes = [];
    
    console.log('✅ Cliente seleccionado:', {
      id_cliente: this.venta.id_cliente,
      nombre: this.clienteSeleccionadoNombre
    });
  }

  seleccionarProducto(producto: any) {
    console.log('🎯 Producto seleccionado:', producto);
    
    this.productoSeleccionado = producto;
    this.cantidad = 1;
    this.searchProducto = producto.nombre;
    
    this.mostrarListaProductos = false;
    this.filteredProductos = [];
  }

  agregarProducto() {
    if (!this.productoSeleccionado || this.cantidad <= 0) {
      this.error = 'Selecciona un producto y cantidad válida';
      return;
    }

    if (this.cantidad > this.productoSeleccionado.stock) {
      this.error = `Stock insuficiente. Disponible: ${this.productoSeleccionado.stock}`;
      return;
    }

    console.log('🔍 Producto seleccionado (estructura completa):', this.productoSeleccionado);
    console.log('   - id_producto:', this.productoSeleccionado.id_producto);
    console.log('   - id:', this.productoSeleccionado.id);
    console.log('   - nombre:', this.productoSeleccionado.nombre);
    console.log('   - precio:', this.productoSeleccionado.precio);
    console.log('   - stock:', this.productoSeleccionado.stock);

    const idProducto = this.productoSeleccionado.id_producto || this.productoSeleccionado.id;
    
    if (!idProducto) {
      this.error = 'Error: No se pudo obtener el ID del producto';
      console.error('❌ Producto sin ID válido:', this.productoSeleccionado);
      return;
    }

    const detalle: VentaDetalle = {
      id_producto: idProducto,
      cantidad: this.cantidad,
      precio_unitario: this.productoSeleccionado.precio,
      producto_nombre: this.productoSeleccionado.nombre
    };

    console.log('➕ Producto agregado al carrito:', detalle);

    this.venta.detalles.push(detalle);
    this.calcularTotal();
    this.limpiarSeleccionProducto();
  }

  limpiarSeleccionProducto() {
    this.productoSeleccionado = null;
    this.cantidad = 1;
    this.searchProducto = '';
    this.filteredProductos = [];
    this.mostrarListaProductos = false;
    this.error = '';
  }

  removerProducto(index: number) {
    this.venta.detalles.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.venta.total = this.venta.detalles.reduce((total, detalle) => {
      return total + (detalle.cantidad * detalle.precio_unitario);
    }, 0);
  }

  limpiarBusquedaCliente() {
    this.searchCliente = '';
    this.venta.id_cliente = 0;
    this.clienteSeleccionadoNombre = '';
    this.filteredClientes = this.clientes;
    this.mostrarListaClientes = false;
    
    console.log('🧹 Búsqueda de cliente limpiada, selección resetada');
  }

  limpiarBusquedaProducto() {
    this.searchProducto = '';
    this.filteredProductos = this.productos;
    this.productoSeleccionado = null;
    this.mostrarListaProductos = false;
    this.cantidad = 1;
  }

  mostrarTodosClientes() {
    if (this.venta.id_cliente === 0) {
      this.mostrarListaClientes = true;
      if (!this.searchCliente) {
        this.filteredClientes = this.clientes;
      }
    }
  }

  mostrarTodosProductos() {
    if (!this.productoSeleccionado) {
      this.mostrarListaProductos = true;
      if (!this.searchProducto) {
        this.filteredProductos = this.productos;
      }
    }
  }

  onBlurCliente() {
    setTimeout(() => {
      if (this.venta.id_cliente === 0) {
        this.mostrarListaClientes = false;
      }
    }, 200);
  }

  onBlurProducto() {
    setTimeout(() => {
      if (!this.productoSeleccionado) {
        this.mostrarListaProductos = false;
      }
    }, 200);
  }

  onTipoComprobanteChange() {
    if (this.venta.tipo_comprobante && this.venta.id_cliente !== 0) {
      this.loadingSerie = true;
      this.serieNumeroPreview = 'Calculando...';
      
      this.ventasService.getSiguienteNumeroComprobante(
        this.venta.tipo_comprobante,
        this.venta.id_cliente
      ).subscribe({
        next: (respuesta: any) => {
          this.serieNumeroPreview = `${respuesta.serie}-${respuesta.correlativo}`;
          this.venta.serie_comprobante = respuesta.serie;
          this.venta.numero_correlativo = respuesta.numero_secuencial;
          this.loadingSerie = false;
          console.log('✅ Número de comprobante obtenido:', respuesta);
        },
        error: (error: any) => {
          console.error('❌ Error obteniendo número de comprobante:', error);
          this.serieNumeroPreview = 'Error: ' + (error.error?.error || error.message);
          this.loadingSerie = false;
        }
      });
    } else {
      this.serieNumeroPreview = '';
    }
  }

  finalizarVenta() {
    if (this.venta.id_cliente === 0) {
      this.error = 'Selecciona un cliente';
      return;
    }

    if (this.venta.detalles.length === 0) {
      this.error = 'Agrega al menos un producto';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id_usuario) {
      this.error = 'No se pudo identificar al vendedor. Por favor, inicie sesión nuevamente.';
      return;
    }

    console.log('🔍 VERIFICANDO DETALLES DE LA VENTA:');
    this.venta.detalles.forEach((detalle, index) => {
      console.log(`   Detalle ${index + 1}:`, {
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        producto_nombre: detalle.producto_nombre
      });
      
      if (!detalle.id_producto) {
        console.error(`❌ ERROR: Detalle ${index + 1} tiene id_producto undefined`);
        this.error = `Error: El producto "${detalle.producto_nombre}" no tiene ID válido`;
        return;
      }
    });

    if (this.error) return;

    const safeValue = (value: any, fieldName: string = 'campo'): any => {
      if (value === undefined || value === '') {
        console.warn(`⚠️  Campo '${fieldName}' es undefined o vacío, convirtiendo a null`);
        return null;
      }
      return value;
    };

    const ventaParaEnviar = {
      id_cliente: this.venta.id_cliente,
      fecha: this.venta.fecha,
      hora: this.venta.hora,
      total: this.venta.total,
      id_metodo_pago: this.venta.id_metodo_pago,
      id_estado_venta: 4,
      id_repartidor: safeValue(this.venta.id_repartidor, 'id_repartidor'),
      id_vendedor: currentUser.id_usuario,
      notas: safeValue(this.venta.notas || '', 'notas'),
      tipo_comprobante_solicitado: this.venta.tipo_comprobante || 'SIN_COMPROBANTE',
      detalles: this.venta.detalles.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        producto_nombre: safeValue(detalle.producto_nombre, 'producto_nombre')
      }))
    };

    console.log('🔍 OBJETO FINAL PARA ENVIAR:', ventaParaEnviar);
    
    const detallesConProblemas = ventaParaEnviar.detalles.filter(detalle => 
      !detalle.id_producto || detalle.id_producto === undefined
    );

    if (detallesConProblemas.length > 0) {
      console.error('❌ ERROR: Detalles con id_producto undefined:', detallesConProblemas);
      this.error = 'Error interno: productos inválidos en el carrito';
      return;
    }

    const hasUndefined = Object.values(ventaParaEnviar).some(val => 
      val === undefined || (Array.isArray(val) && val.some(item => 
        Object.values(item).some(v => v === undefined)
      ))
    );

    if (hasUndefined) {
      console.error('❌ ERROR: Se encontró undefined en el objeto final:', ventaParaEnviar);
      this.error = 'Error interno: datos inválidos';
      return;
    }

    console.log('📤 ENVIANDO DATOS AL BACKEND...');
    this.loading = true;
    this.error = '';

    this.ventasService.createVenta(ventaParaEnviar).subscribe({
      next: (ventaCreada) => {
        this.loading = false;
        console.log('✅ Venta registrada correctamente, ID:', ventaCreada.id_venta);
        
        Swal.fire({
          title: '✅ Venta registrada',
          text: 'Redirigiendo a asignación de rutas...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
          willClose: () => {
            this.router.navigate(['/ventas/asignacion-rutas']);
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Error al registrar la venta';
        console.error('❌ Error detallado creando venta:', error);
        
        Swal.fire({
          title: '❌ Error',
          text: this.error,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
  // Método para obtener el nombre del vendedor
getVendedorNombre(): string {
  const currentUser = this.authService.getCurrentUser();
  return currentUser?.nombre || currentUser?.username || 'Vendedor';
}
}