// frontend/src/app/components/sunat/emitir-comprobante/emitir-comprobante.component.ts
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SunatService } from '../../../core/services/sunat.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-emitir-comprobante',
  standalone: true,  // ✅ AGREGAR ESTO
  imports: [CommonModule],  // ✅ AGREGAR IMPORTS
  template: `
    <button 
      [disabled]="disabled || procesando"
      (click)="emitirComprobante()"
      class="btn {{btnClass}}"
      [title]="ventaInfo">
      
      <i *ngIf="!procesando" class="fas fa-file-invoice"></i>
      <i *ngIf="procesando" class="fas fa-spinner fa-spin"></i>
      
      {{ btnText }}
    </button>
  `,
  styles: [`
    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class EmitirComprobanteComponent implements OnInit {
  @Input() idVenta!: number;
  @Input() estadoVenta: number = 0;
  @Input() comprobanteEmitido: number = 0;
  @Input() btnClass: string = 'btn-success btn-sm';
  @Input() btnText: string = 'Emitir SUNAT';
  @Output() comprobanteEmitidoEvent = new EventEmitter<any>();
  
  private sunatService = inject(SunatService);  // ✅ USAR inject()
  
  procesando = false;
  ventaInfo = '';
  disabled = false;  // ✅ AGREGAR PROPERTY

  ngOnInit() {
    this.actualizarInfoVenta();
  }

  private actualizarInfoVenta() {
    if (this.comprobanteEmitido === 1) {
      this.ventaInfo = 'Comprobante ya emitido';
      this.disabled = true;
      this.btnClass = 'btn-secondary btn-sm';
      this.btnText = 'Emitido';
    } else if (this.estadoVenta !== 7) {
      this.ventaInfo = 'La venta debe estar PAGADA para emitir comprobante';
      this.disabled = true;
      this.btnClass = 'btn-warning btn-sm';
      this.btnText = 'No pagada';
    } else {
      this.ventaInfo = 'Emitir comprobante electrónico';
      this.disabled = false;
    }
  }

  async emitirComprobante() {
    if (!this.idVenta || this.procesando || this.comprobanteEmitido === 1) return;
    
    const result = await Swal.fire({
      title: '¿Emitir comprobante?',
      text: 'Se generará un comprobante electrónico para esta venta',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, emitir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.procesarEmision();
    }
  }

  // En la función procesarEmision, actualiza para usar el correlativo correcto
private procesarEmision() {
    this.procesando = true;
    this.btnText = 'Procesando...';
    
    this.sunatService.emitirComprobante(this.idVenta).subscribe({
      next: (response) => {
        this.procesando = false;
        this.comprobanteEmitido = 1;
        
        // ✅ USAR EL CORRELATIVO DE LA RESPUESTA (ya sincronizado)
        const correlativo = response.data?.comprobante?.correlativo || '00000001';
        
        Swal.fire({
          title: '¡Comprobante emitido!',
          html: `
            <div style="text-align: left;">
              <p><strong>Tipo:</strong> ${response.data.comprobante.tipo}</p>
              <p><strong>Serie-Número:</strong> ${response.data.comprobante.serie}-${correlativo}</p>
              <p><strong>Estado SUNAT:</strong> ${response.data.sunat.estado}</p>
              <p><strong>Hash:</strong> <small>${response.data.sunat.hash?.substring(0, 20)}...</small></p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        
        this.comprobanteEmitidoEvent.emit(response.data);
        this.actualizarInfoVenta();
      },
      error: (error) => {
        this.procesando = false;
        this.btnText = 'Emitir SUNAT';
        
        Swal.fire({
          title: 'Error al emitir',
          text: error.error?.error || 'No se pudo emitir el comprobante',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}