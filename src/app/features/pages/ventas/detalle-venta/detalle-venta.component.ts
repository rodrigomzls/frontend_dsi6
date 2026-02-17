// src/app/features/pages/ventas/detalle-venta/detalle-venta.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VentasService, Venta } from '../../../../core/services/ventas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FechaService } from '../../../../core/services/fecha.service'; // ← AÑADIR

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-venta.component.html',
  styleUrls: ['./detalle-venta.component.css']
})
export class DetalleVentaComponent implements OnInit {
  private ventasService = inject(VentasService);
  private authService = inject(AuthService);
  public fechaService = inject(FechaService); // ← AÑADIR
  private route = inject(ActivatedRoute);
  public router = inject(Router);

  venta: Venta | null = null;
  loading = false;
  error = '';
  notFound = false;
  

 // AÑADIR método para debug
// También corrige el método ngOnInit:
ngOnInit() {
    this.cargarVenta();
    // Añadir para debug
    setTimeout(() => {
        if (this.venta) {
            console.log('🔍 VERIFICANDO FECHA EN DETALLE:', {
                id: this.venta.id_venta,
                fechaBD: this.venta.fecha,
                fechaFormateada: this.fechaService.formatFechaCompleta(this.venta.fecha), // CAMBIAR
                fechaObj: new Date(this.venta.fecha)
            });
        }
    }, 1000);
}
  cargarVenta() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de venta no válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.notFound = false;

    this.ventasService.getVentaById(+id).subscribe({
      next: (venta) => {
        console.log('📦 Venta cargada:', venta);
        this.venta = venta;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 404) {
          this.notFound = true;
          this.error = 'Venta no encontrada';
        } else {
          this.error = 'Error al cargar la venta';
        }
        console.error('Error cargando venta:', error);
      }
    });
  }

  // Obtener clase CSS para el estado
  getEstadoClass(estado: string): string {
    const classes: { [key: string]: string } = {
      'Pendiente': 'estado-pendiente',
      'Listo para repartos': 'estado-listo',
      'En ruta': 'estado-ruta',
      'Pagado': 'estado-pagado',
      'Cancelado': 'estado-cancelado'
    };
    return classes[estado] || 'estado-desconocido';
  }

  // En detalle-venta.component.ts - método formatearFecha
// REEMPLAZAR el método formatearFecha en detalle-venta.component.ts


// Añadir también este método para fechas cortas

  // ✅ NUEVO: Formatear hora en formato 12 horas (09:34 AM/PM)
  formatearHora(hora: string): string {
    if (!hora) return 'Hora no disponible';
    
    try {
      // Si la hora viene como '15:38:08'
      const [horas, minutos, segundos] = hora.split(':');
      const fecha = new Date();
      fecha.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos || '0'));
      
      return fecha.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formateando hora:', error, 'Hora original:', hora);
      return hora; // Devolver la hora original si hay error
    }
  }

  // Navegación
// En detalle-venta.component.ts, agrega o modifica el método volverAPanel()
volverAPanel() {
  // Leer la ruta guardada en localStorage
  const previousRoute = localStorage.getItem('previous_ventas_route');
  
  if (previousRoute) {
    // Limpiar el localStorage después de usarlo
    localStorage.removeItem('previous_ventas_route');
    
    // Navegar a la ruta anterior
    console.log('Volviendo a ruta anterior:', previousRoute);
    this.router.navigate([previousRoute]);
  } else {
    // Si no hay ruta guardada, volver al panel por defecto
    console.log('No hay ruta anterior, volviendo a /ventas');
    this.router.navigate(['/ventas']);
  }
}

  // Método para cambiar estado
  cambiarEstado() {
    if (!this.venta?.id_venta) return;
    
    const nuevoEstado = prompt('Ingrese el nuevo estado (1-8):\n1. Pendiente\n2. Confirmado\n3. En preparación\n4. Listo para repartos\n5. En ruta\n6. Entregado\n7. Pagado\n8. Cancelado');
    
    if (nuevoEstado && +nuevoEstado >= 1 && +nuevoEstado <= 8) {
      this.ventasService.updateEstadoVenta(this.venta.id_venta!, +nuevoEstado).subscribe({
        next: () => {
          alert('✅ Estado actualizado correctamente');
          this.cargarVenta();
        },
        error: (error) => {
          alert('❌ Error al actualizar estado');
          console.error('Error:', error);
        }
      });
    }
  }

  // Solo admin puede cambiar estados
  get puedeCambiarEstado(): boolean {
    return this.authService.isAdmin();
  }

  // ✅ NUEVO: Imprimir comprobante sencillo
// Corrige el método imprimirComprobante para usar el servicio:
imprimirComprobante() {
  if (!this.venta) return;

  const ventana = window.open('', '_blank', 'width=800,height=600');

  const contenido = `
    <html>
      <head>
        <title>Comprobante de Venta #${this.venta.id_venta}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 30px;
            color: #333;
            background: #fff;
          }
          h1 { text-align: center; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th { background-color: #f5f5f5; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <h1>Comprobante de Venta</h1>
        <p><strong>ID Venta:</strong> ${this.venta.id_venta}</p>
        <p><strong>Cliente:</strong> ${this.venta.nombre_completo || 'Cliente General'}</p>
        <p><strong>Fecha:</strong> ${this.fechaService.formatFechaCompleta(this.venta.fecha)} ${this.fechaService.formatHora(this.venta.hora)}</p> <!-- CAMBIAR -->

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${this.venta.detalles.map((d: any) => `
              <tr>
                <td>${d.producto_nombre}</td>
                <td>${d.cantidad}</td>
                <td>S/ ${Number(d.precio_unitario).toFixed(2)}</td>
                <td>S/ ${(Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;"><strong>Total:</strong></td>
              <td><strong>S/ ${Number(this.venta.total).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Gracias por su compra 💙</p>
          <p>Agua Viña - Distribución de bidones</p>
        </div>
      </body>
    </html>
  `;

  ventana?.document.write(contenido);
  ventana?.document.close();

  // ⏱️ Esperar 500 ms antes de imprimir
  setTimeout(() => {
    ventana?.print();
    ventana?.close();
  }, 500);
}
// Mejorar la función getTipoComprobanteTexto
getTipoComprobanteTexto(tipo: string | undefined): string {
  if (!tipo) {
    // Si no hay tipo en la venta, verificar si hay algún comprobante SUNAT
    if (this.venta && this.venta.id_venta) {
      // Podrías hacer una consulta adicional aquí si necesitas
      return 'Sin comprobante';
    }
    return 'Sin comprobante';
  }
  
  switch(tipo.toUpperCase()) { // Usar toUpperCase para mayor seguridad
    case 'FACTURA': return 'Factura Electrónica';
    case 'BOLETA': return 'Boleta Electrónica';
    case 'SIN_COMPROBANTE': return 'Nota de Venta';
    case 'NOTA': return 'Nota de Venta';
    case '': 
    case 'NULL': 
    case 'UNDEFINED': return 'Nota de Venta';
    default: return tipo; // Devolver el valor original si no coincide
  }
}
}