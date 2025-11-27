// En nueva-venta.component.ts - versión completa corregida
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Agrega estas importaciones para el diálogo
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Importa el componente del formulario de cliente
import { ClienteRapidoFormComponent } from '../../../../components/cliente-rapido-form/cliente-rapido-form.component';
import { VentasService, Venta, VentaDetalle } from '../../../../core/services/ventas.service';
import { ClienteService, ClienteVenta } from '../../../../core/services/cliente.service'; // ✅ Importar ClienteVenta
import { ProductService} from '../../../../core/services/producto.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RepartidorService } from '../../../../core/services/repartidor.service'; // ✅ Importar servicio
import { Repartidor } from '../../../../core/models/repartidor.model'; // ✅ Importar modelo
import Swal from 'sweetalert2';
@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
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
   // ✅ Agrega el servicio de diálogo
  private dialog = inject(MatDialog);


  // Datos de la venta
// En la definición de la venta
// En la definición de la venta - VERSIÓN COMPLETA
venta: Venta = {
  id_cliente: 0,
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().split(' ')[0],
  total: 0,
  id_metodo_pago: 1,
  id_estado_venta: 1,
  id_repartidor: null,
  id_vendedor: null, // ✅ Cambiar undefined por null
  notas: '',
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


  // Nuevas propiedades para controlar la visualización de listas
  mostrarListaClientes: boolean = false;
  mostrarListaProductos: boolean = false;
  clienteSeleccionadoNombre: string = '';

  ngOnInit() {
    this.cargarDatosIniciales();
    this.cargarRepartidores(); // ✅ Cargar repartidores
  }

// En nueva-venta.component.ts - en cargarDatosIniciales
// En nueva-venta.component.ts - corrige la función cargarDatosIniciales

// En nueva-venta.component.ts - alternativa con componente rápido
// En nueva-venta.component.ts - actualiza el método abrirModalClienteRapido
abrirModalClienteRapido() {
  const dialogRef = this.dialog.open(ClienteRapidoFormComponent, {
    width: '750px',
    maxWidth: '95vw',
    maxHeight: '90vh',
     panelClass: 'cliente-rapido-dialog', // Clase para estilos globales
    autoFocus: false
  });

  dialogRef.afterClosed().subscribe((nuevoCliente) => {
    if (nuevoCliente) {
      console.log('✅ Cliente rápido creado exitosamente:', nuevoCliente);
      
      // Recargar la lista de clientes
      this.cargarClientes();
      
      // AUTOCOMPLETAR: Buscar y seleccionar automáticamente el nuevo cliente
      setTimeout(() => {
        this.buscarYSeleccionarNuevoCliente(nuevoCliente);
      }, 500);
    }
  });
}

// Nuevo método para buscar y seleccionar automáticamente el cliente recién creado
private buscarYSeleccionarNuevoCliente(nuevoCliente: any) {
  // Buscar el cliente en la lista actualizada
  const clienteEncontrado = this.clientes.find(cliente => 
    cliente.id_cliente === nuevoCliente.id_cliente || 
    cliente.id_cliente === nuevoCliente.id
  );
  
  if (clienteEncontrado) {
    // Seleccionar automáticamente el cliente
    this.seleccionarCliente(clienteEncontrado);
    
    // Mostrar mensaje de confirmación
    this.mostrarMensajeExito(`Cliente "${nuevoCliente.nombre}" seleccionado automáticamente`);
  } else {
    // Si no se encuentra inmediatamente, intentar recargar la lista
    this.cargarClientes();
    
    // Intentar nuevamente después de un segundo
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

// Método para mostrar mensajes (si no lo tienes)
private mostrarMensajeExito(mensaje: string) {
  // Puedes usar un snackbar en lugar de alert para mejor UX
  console.log('✅', mensaje);
  // Opcional: Implementar snackbar aquí
}
  // Método auxiliar para cargar clientes
  private cargarClientes() {
    this.clientesService.getClientesParaVentas().subscribe({
      next: (clientes: ClienteVenta[]) => {
        console.log('📋 Clientes recargados:', clientes);
        this.clientes = clientes;
        this.filteredClientes = clientes;
        
        // Si hay búsqueda activa, re-filtrar
        if (this.searchCliente) {
          this.filtrarClientes();
        }
      },
      error: (error) => console.error('Error recargando clientes:', error)
    });
  }

// En nueva-venta.component.ts - mejorar el debug de productos
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

 // Mejorar la función de filtrar clientes
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
  
  // ✅ Mostrar lista automáticamente cuando se filtra
  if (this.searchCliente && this.filteredClientes.length > 0) {
    this.mostrarListaClientes = true;
  }
}

 // Mejorar la función de filtrar productos
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
  
  // ✅ Mostrar lista automáticamente cuando se filtra
  if (this.searchProducto && this.filteredProductos.length > 0) {
    this.mostrarListaProductos = true;
  }
}
// Modificar la función de selección de cliente
seleccionarCliente(cliente: ClienteVenta) {
  this.venta.id_cliente = cliente.id_cliente;
  this.clienteSeleccionadoNombre = cliente.nombre_completo || cliente.persona?.nombre_completo || '';
  this.searchCliente = this.clienteSeleccionadoNombre;
  
  // ✅ OCULTAR LISTA INMEDIATAMENTE después de seleccionar
  this.mostrarListaClientes = false;
  this.filteredClientes = []; // Limpiar la lista filtrada
  
  console.log('✅ Cliente seleccionado:', {
    id_cliente: this.venta.id_cliente,
    nombre: this.clienteSeleccionadoNombre
  });
}

// Modificar la función de selección de producto
seleccionarProducto(producto: any) {
  console.log('🎯 Producto seleccionado:', producto);
  
  this.productoSeleccionado = producto;
  this.cantidad = 1;
  this.searchProducto = producto.nombre;
  
  // ✅ OCULTAR LISTA INMEDIATAMENTE después de seleccionar
  this.mostrarListaProductos = false;
  this.filteredProductos = []; // Limpiar la lista filtrada
}
  // Agregar producto al carrito
// En nueva-venta.component.ts - corrige la función agregarProducto()
// En nueva-venta.component.ts - corrige completamente agregarProducto()
// En nueva-venta.component.ts - CORREGIDO
// Mejorar la función agregarProducto para limpiar completamente
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
  console.log('   - id_producto:', this.productoSeleccionado.id_producto);
  console.log('   - id:', this.productoSeleccionado.id);
  console.log('   - nombre:', this.productoSeleccionado.nombre);
  console.log('   - precio:', this.productoSeleccionado.precio);
  console.log('   - stock:', this.productoSeleccionado.stock);

  // ✅ CORREGIDO: Usar id_producto en lugar de id
  const idProducto = this.productoSeleccionado.id_producto || this.productoSeleccionado.id;
  
  if (!idProducto) {
    this.error = 'Error: No se pudo obtener el ID del producto';
    console.error('❌ Producto sin ID válido:', this.productoSeleccionado);
    return;
  }

  const detalle: VentaDetalle = {
    id_producto: idProducto, // ✅ Usar id_producto o id
    cantidad: this.cantidad,
    precio_unitario: this.productoSeleccionado.precio,
    producto_nombre: this.productoSeleccionado.nombre
  };

  console.log('➕ Producto agregado al carrito:', detalle);

  this.venta.detalles.push(detalle);
  this.calcularTotal();
  
  // ✅ LIMPIAR COMPLETAMENTE después de agregar
  this.limpiarSeleccionProducto();
}

// ✅ NUEVO MÉTODO: Limpiar selección de producto completamente
limpiarSeleccionProducto() {
  this.productoSeleccionado = null;
  this.cantidad = 1;
  this.searchProducto = '';
  this.filteredProductos = [];
  this.mostrarListaProductos = false;
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


// En nueva-venta.component.ts - modificar el método finalizarVenta
finalizarVenta() {
  if (this.venta.id_cliente === 0) {
    this.error = 'Selecciona un cliente';
    return;
  }

  if (this.venta.detalles.length === 0) {
    this.error = 'Agrega al menos un producto';
    return;
  }

  // ✅ OBTENER EL USUARIO ACTUAL DEL AUTH SERVICE
  const currentUser = this.authService.getCurrentUser();
  if (!currentUser || !currentUser.id_usuario) {
    this.error = 'No se pudo identificar al vendedor. Por favor, inicie sesión nuevamente.';
    return;
  }

  // ✅ VERIFICAR DETALLES ANTES DE ENVIAR
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

  // ✅ FUNCIÓN MEJORADA PARA SANITIZAR VALORES
  const safeValue = (value: any, fieldName: string = 'campo'): any => {
    if (value === undefined || value === '') {
      console.warn(`⚠️  Campo '${fieldName}' es undefined o vacío, convirtiendo a null`);
      return null;
    }
    return value;
  };

  // ✅ CREAR OBJETO CON EL VENDEDOR CORRECTO
  const ventaParaEnviar = {
    id_cliente: this.venta.id_cliente,
    fecha: this.venta.fecha,
    hora: this.venta.hora,
    total: this.venta.total,
    id_metodo_pago: this.venta.id_metodo_pago,
    id_estado_venta: 4, // ✅ CAMBIAR: Estado "Listo para reparto" en lugar de "Pendiente"
    id_repartidor: safeValue(this.venta.id_repartidor, 'id_repartidor'),
    id_vendedor: currentUser.id_usuario,
    notas: safeValue(this.venta.notas || '', 'notas'),
    detalles: this.venta.detalles.map(detalle => ({
      id_producto: detalle.id_producto,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      producto_nombre: safeValue(detalle.producto_nombre, 'producto_nombre')
    }))
  };

  // ✅ VERIFICACIÓN FINAL MEJORADA
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
      
      // ✅ NUEVO: Redirigir directamente a asignación de rutas
      console.log('✅ Venta registrada correctamente, ID:', ventaCreada.id_venta);
      
    // ✅ REEMPLAZAR alert con SweetAlert2 automático
      Swal.fire({
        title: '✅ Venta registrada',
        text: 'Redirigiendo a asignación de rutas...',
        icon: 'success',
        timer: 1500, // 1.5 segundos
        showConfirmButton: false,
        timerProgressBar: true,
        willClose: () => {
          // Redirigir automáticamente después del timer
          this.router.navigate(['/ventas/asignacion-rutas']);
        }
      });
    },
    error: (error) => {
      this.loading = false;
      this.error = error.error?.error || 'Error al registrar la venta';
      console.error('❌ Error detallado creando venta:', error);
      
    // ✅ SweetAlert2 para errores también
      Swal.fire({
        title: '❌ Error',
        text: this.error,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  });
}
  // Limpiar búsquedas
// Mejorar la función de limpiar búsqueda de cliente
limpiarBusquedaCliente() {
  this.searchCliente = '';
  this.venta.id_cliente = 0;
  this.clienteSeleccionadoNombre = '';
  this.filteredClientes = this.clientes; // Mantener lista disponible para nueva búsqueda
  this.mostrarListaClientes = false;
  
  console.log('🧹 Búsqueda de cliente limpiada, selección resetada');
}
// Mejorar la función de limpiar búsqueda de producto
limpiarBusquedaProducto() {
  this.searchProducto = '';
  this.filteredProductos = this.productos; // Mantener lista disponible para nueva búsqueda
  this.productoSeleccionado = null;
  this.mostrarListaProductos = false;
  this.cantidad = 1;
}
  // Mejorar los métodos de mostrar listas
mostrarTodosClientes() {
  // ✅ Solo mostrar lista si no hay cliente seleccionado
  if (this.venta.id_cliente === 0) {
    this.mostrarListaClientes = true;
    if (!this.searchCliente) {
      this.filteredClientes = this.clientes;
    }
  }
}

mostrarTodosProductos() {
  // ✅ Solo mostrar lista si no hay producto seleccionado para agregar
  if (!this.productoSeleccionado) {
    this.mostrarListaProductos = true;
    if (!this.searchProducto) {
      this.filteredProductos = this.productos;
    }
  }
}
 // Mejorar los métodos de blur con lógica condicional
onBlurCliente() {
  setTimeout(() => {
    // ✅ Solo ocultar si no se ha seleccionado un cliente
    if (this.venta.id_cliente === 0) {
      this.mostrarListaClientes = false;
    }
  }, 200);
}

onBlurProducto() {
  setTimeout(() => {
    // ✅ Solo ocultar si no hay producto seleccionado para agregar
    if (!this.productoSeleccionado) {
      this.mostrarListaProductos = false;
    }
  }, 200);
}
}