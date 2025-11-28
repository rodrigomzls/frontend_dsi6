// src/app/components/movimiento-stock-unificado-form/movimiento-stock-unificado-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { MovimientoStockService } from '../../core/services/movimiento-stock.service';
import { LoteService } from '../../core/services/lote.service';
import { ProductService } from '../../core/services/producto.service';
import { Product } from '../../core/models/producto.model';
import { Lote } from '../../core/models/lote.model';

import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon'; // ✅ AGREGAR ESTA IMPORTACIÓN

@Component({
  selector: 'app-movimiento-stock-unificado-form',
  templateUrl: './movimiento-stock-unificado-form.component.html',
  styleUrls: ['./movimiento-stock-unificado-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatIconModule // ✅ AGREGAR ESTA IMPORTACIÓN
  ]
})
export class MovimientoStockUnificadoFormComponent implements OnInit {
  form: FormGroup;
  productos: Product[] = [];
  lotes: Lote[] = [];
  filteredLotes: Observable<Lote[]> = of([]);
  isLoading = false;
  isSubmitting = false;

  // Configuración de productos con tiempos de validez
  configProductos: { [key: number]: any } = {
    1: { mesesValidez: 6, prefijoLote: 'BL' },  // Bidón Agua Bella
    2: { mesesValidez: 6, prefijoLote: 'VL' },  // Bidón Agua Viña  
    3: { mesesValidez: 12, prefijoLote: 'BP' }, // Paquete Botella Bella
    4: { mesesValidez: 12, prefijoLote: 'VP' }  // Paquete Botella Viña
  };

  tiposMovimiento = [
    { value: 'ingreso', label: '📥 Ingreso', creaLote: true },
    { value: 'egreso', label: '📤 Egreso', creaLote: false },
    { value: 'ajuste', label: '⚖️ Ajuste', creaLote: false },
    { value: 'devolucion', label: '🔄 Devolución', creaLote: false }
  ];

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoStockService,
    private loteService: LoteService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MovimientoStockUnificadoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Datos básicos del movimiento
      id_producto: [null, Validators.required],
      tipo_movimiento: ['ingreso', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      
      // Gestión de lote
      gestion_lote: ['automatico'],
      
      // Para lote automático
      prefijo_lote: [{value: '', disabled: true}],
      fecha_caducidad_auto: [this.calcularFechaCaducidad()],
      
      // Para lote manual
      numero_lote_manual: [''],
      fecha_caducidad_manual: [''],
      
      // Para lote existente
      id_lote_existente: [null],
      lote_search: ['']
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.configurarEventosFormulario();
    this.configurarBusquedaLotes();
  }

  private configurarEventosFormulario(): void {
    // Cuando cambia el producto
    this.form.get('id_producto')?.valueChanges.subscribe(productoId => {
      if (productoId) {
        this.actualizarConfiguracionProducto(productoId);
        this.cargarLotesDelProducto(productoId);
      }
    });

    // Cuando cambia el tipo de movimiento
    this.form.get('tipo_movimiento')?.valueChanges.subscribe(tipo => {
      this.actualizarModoLote(tipo);
    });

    // Cuando cambia la gestión de lote
    this.form.get('gestion_lote')?.valueChanges.subscribe(modo => {
      this.actualizarValidacionesLote(modo);
    });
  }

  private configurarBusquedaLotes(): void {
    this.filteredLotes = this.form.get('lote_search')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.filterLotes(value || ''))
    );
  }

  private filterLotes(value: string): Observable<Lote[]> {
    const filterValue = value.toLowerCase();
    return of(this.lotes.filter(lote => 
      lote.numero_lote.toLowerCase().includes(filterValue) ||
      (lote.producto?.nombre && lote.producto.nombre.toLowerCase().includes(filterValue))
    ));
  }

  private actualizarConfiguracionProducto(productoId: number): void {
    const config = this.configProductos[productoId];
    if (config) {
      this.form.patchValue({
        prefijo_lote: config.prefijoLote,
        fecha_caducidad_auto: this.calcularFechaCaducidad(config.mesesValidez)
      });
    }
  }

  private actualizarModoLote(tipoMovimiento: string): void {
    const esIngreso = tipoMovimiento === 'ingreso';
    
    if (esIngreso) {
      this.form.patchValue({ gestion_lote: 'automatico' });
    } else {
      this.form.patchValue({ gestion_lote: 'existente' });
    }
    
    this.actualizarValidacionesLote(this.form.get('gestion_lote')?.value);
  }

  private actualizarValidacionesLote(modo: string): void {
    const controles = {
      manual: ['numero_lote_manual', 'fecha_caducidad_manual'],
      existente: ['id_lote_existente']
    };

    // Limpiar todas las validaciones primero
    Object.values(controles).flat().forEach(controlName => {
      const control = this.form.get(controlName);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    // Aplicar validaciones según el modo
    if (controles[modo as keyof typeof controles]) {
      controles[modo as keyof typeof controles].forEach(controlName => {
        const control = this.form.get(controlName);
        control?.setValidators(Validators.required);
        control?.updateValueAndValidity();
      });
    }
  }

  private cargarLotesDelProducto(productoId: number): void {
    this.isLoading = true;
    this.loteService.getLotes().subscribe({
      next: (lotes) => {
        this.lotes = lotes.filter(lote => 
          lote.id_producto === productoId && 
          lote.activo
        );
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando lotes:', err);
        this.lotes = [];
        this.isLoading = false;
      }
    });
  }

  private calcularFechaCaducidad(meses: number = 6): Date {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha;
  }

  generarNumeroLote(): string {
    const prefijo = this.form.get('prefijo_lote')?.value || 'LOTE';
    const fecha = new Date();
    const consecutivo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefijo}-${fecha.getFullYear()}${(fecha.getMonth()+1).toString().padStart(2, '0')}-${consecutivo}`;
  }

  displayLote(lote: Lote): string {
    return lote ? `${lote.numero_lote} | Stock: ${lote.cantidad_actual} | Caduca: ${new Date(lote.fecha_caducidad).toLocaleDateString()}` : '';
  }

  onLoteSelected(event: any): void {
    const lote = event.option.value;
    this.form.patchValue({
      id_lote_existente: lote.id_lote,
      lote_search: this.displayLote(lote)
    });
  }

 async guardar(): Promise<void> {
  if (this.form.invalid) {
    this.marcarCamposInvalidos();
    this.mostrarError('Por favor complete todos los campos requeridos');
    return;
  }

  this.isSubmitting = true;
  const formValue = this.form.getRawValue();

  try {
    let idLote: number | undefined = undefined;

    // Lógica de gestión de lote
    if (formValue.tipo_movimiento === 'ingreso') {
      idLote = await this.gestionarLoteIngreso(formValue);
    } else {
      idLote = formValue.id_lote_existente || undefined;
      
      // Validar stock para egresos
      if (formValue.tipo_movimiento === 'egreso' && idLote) {
        const loteSeleccionado = this.lotes.find(l => l.id_lote === idLote);
        if (loteSeleccionado && loteSeleccionado.cantidad_actual < formValue.cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${loteSeleccionado.cantidad_actual}`);
        }
      }
    }

    // ✅ CORREGIDO: Usar undefined directamente en lugar de null
    const movimientoData = {
      id_producto: formValue.id_producto,
      tipo_movimiento: formValue.tipo_movimiento,
      cantidad: formValue.cantidad,
      descripcion: formValue.descripcion || this.generarDescripcionAutomatica(formValue),
      id_lote: idLote // ✅ Ya es undefined por defecto
    };

    await this.movimientoService.createMovimiento(movimientoData).toPromise();

    this.mostrarExito('Movimiento registrado correctamente');
    this.dialogRef.close(true);

  } catch (error: any) {
    console.error('Error:', error);
    this.mostrarError(error.message || 'Error al registrar movimiento');
  } finally {
    this.isSubmitting = false;
  }
}

private async gestionarLoteIngreso(formValue: any): Promise<number> {
  // Validar que tenemos un producto seleccionado
  if (!formValue.id_producto) {
    throw new Error('Debe seleccionar un producto');
  }

  switch (formValue.gestion_lote) {
    case 'automatico':
      const fechaCaducidad = formValue.fecha_caducidad_auto || this.calcularFechaCaducidad();
      const loteAutoData = {
        id_producto: formValue.id_producto,
        numero_lote: this.generarNumeroLote(),
        fecha_caducidad: this.formatDateForBackend(fechaCaducidad),
        cantidad_inicial: formValue.cantidad
      };
      
      const loteAuto = await this.loteService.createLote(loteAutoData).toPromise();
      if (!loteAuto || !loteAuto.id_lote) {
        throw new Error('Error al crear lote automático');
      }
      return loteAuto.id_lote;

      case 'manual':
        if (!formValue.numero_lote_manual || !formValue.fecha_caducidad_manual) {
          throw new Error('Complete los datos del lote manual');
        }
        const loteManualData = {
          id_producto: formValue.id_producto,
          numero_lote: formValue.numero_lote_manual,
          fecha_caducidad: this.formatDateForBackend(formValue.fecha_caducidad_manual),
          cantidad_inicial: formValue.cantidad
        };
        
        // ✅ CORREGIDO: Manejar el posible undefined
        const loteManual = await this.loteService.createLote(loteManualData).toPromise();
        if (!loteManual) {
          throw new Error('Error al crear lote manual');
        }
        return loteManual.id_lote;

      case 'existente':
        if (!formValue.id_lote_existente) {
          throw new Error('Seleccione un lote existente');
        }
        return formValue.id_lote_existente;

      default:
        throw new Error('Modo de gestión de lote no válido');
    }
  }

  private generarDescripcionAutomatica(formValue: any): string {
    const tipo = this.tiposMovimiento.find(t => t.value === formValue.tipo_movimiento)?.label;
    const producto = this.productos.find(p => p.id_producto === formValue.id_producto)?.nombre;
    return `${tipo} - ${producto} - ${formValue.cantidad} unidades`;
  }

private formatDateForBackend(date: Date | string): string {
  if (!date) return new Date().toISOString().split('T')[0];
  
  if (typeof date === 'string') {
    // Si es string, intentar parsear
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) 
      ? new Date().toISOString().split('T')[0] 
      : parsed.toISOString().split('T')[0];
  }
  
  // Si es Date object
  return date.toISOString().split('T')[0];
}
  private marcarCamposInvalidos(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(`❌ ${mensaje}`, 'Cerrar', { 
      duration: 5000,
      panelClass: ['error-snackbar'] 
    });
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(`✅ ${mensaje}`, 'Cerrar', { 
      duration: 3000,
      panelClass: ['success-snackbar'] 
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  cargarProductos(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.isLoading = false;
      },
      error: (err) => {
        this.mostrarError('Error cargando productos');
        this.isLoading = false;
      }
    });
  }

  // Helper para verificar si es ingreso
  get esIngreso(): boolean {
    return this.form.get('tipo_movimiento')?.value === 'ingreso';
  }

  // Helper para obtener el modo actual de lote
  get modoLoteActual(): string {
    return this.form.get('gestion_lote')?.value;
  }
}