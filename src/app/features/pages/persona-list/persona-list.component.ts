import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PersonaService } from '../../../core/services/persona.service';
import { PersonaFormComponent } from '../../../components/persona-form/persona-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-persona-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './persona-list.component.html',
  styleUrls: ['./persona-list.component.css']
})
export class PersonaListComponent implements OnInit {
  pageSize = 10; // Valor inicial
  currentPage = 0; // Página actual
  displayedColumns: string[] = ['id', 'documento', 'informacion', 'direccion', 'contacto', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  filteredData: any[] = []; // Datos filtrados para paginación
  isLoading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('tableWrapper') tableWrapper!: ElementRef;

  constructor(
    private personaService: PersonaService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPersonas();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }

  // Cambiar tamaño de página
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Resetear a primera página
    this.updateTableData();
    this.cdr.detectChanges();
  }

  // Cargar personas
  loadPersonas(): void {
    this.isLoading = true;
    this.personaService.getAll().subscribe({
      next: (personas) => { 
        console.log('Personas cargadas:', personas);
        this.dataSource.data = personas;
        this.filteredData = [...personas]; // Inicializar datos filtrados
        
        // Configurar sort después de cargar datos
        setTimeout(() => {
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
          
          this.isLoading = false;
          this.updateTableData();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => { 
        console.error('Error cargando personas:', err); 
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Aplicar filtro
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    // Actualizar datos filtrados
    if (this.dataSource.filteredData) {
      this.filteredData = this.dataSource.filteredData;
    } else {
      this.filteredData = this.dataSource.data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    this.currentPage = 0; // Resetear a primera página al filtrar
    this.updateTableData();
  }

  // Actualizar datos de la tabla según paginación
  updateTableData(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    // Obtener slice de datos para la página actual
    const pageData = this.filteredData.slice(startIndex, endIndex);
    this.dataSource.data = pageData;
  }

  // Métodos de navegación
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.updateTableData();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage--;
      this.updateTableData();
    }
  }

  hasNextPage(): boolean {
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    return this.currentPage < totalPages - 1;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize;
  }

  getEndIndex(): number {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return Math.min(endIndex, this.filteredData.length);
  }

  // ======================
  // MÉTODOS DE DIALOGOS
  // ======================

  addPersona(): void {
    const dialogRef = this.dialog.open(PersonaFormComponent, { 
      width: '520px', 
      maxWidth: '95vw', 
      autoFocus: false 
    });
    
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.id_persona) {
        this.showSuccess('Persona creada exitosamente');
        this.loadPersonas();
      }
    });
  }

  editPersona(persona: any): void {
    const dialogRef = this.dialog.open(PersonaFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { persona }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.id_persona) {
        this.showSuccess('Persona actualizada exitosamente');
        this.loadPersonas();
      }
    });
  }

  deletePersona(persona: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      panelClass: 'confirm-dialog',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de eliminar a la persona <strong>${persona.nombre_completo}</strong> (${persona.numero_documento})? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'warning',
        confirmIcon: 'delete',
        showIcon: true
      } as ConfirmDialogData
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.personaService.delete(persona.id_persona).subscribe({
          next: () => { 
            this.showSuccess('Persona eliminada exitosamente'); 
            this.loadPersonas(); 
          },
          error: (e) => { 
            this.showError('Error al eliminar persona'); 
            console.error(e); 
            this.isLoading = false;
          }
        });
      }
    });
  }

  // ======================
  // MÉTODOS AUXILIARES
  // ======================

  // Determinar tipo de documento por longitud
  getTipoDocumento(numeroDocumento: string): string {
    if (!numeroDocumento) return '';
    
    const doc = numeroDocumento.trim();
    
    // DNI peruano: 8 dígitos
    if (/^\d{8}$/.test(doc)) {
      return 'DNI';
    }
    
    // RUC peruano: 11 dígitos
    if (/^\d{11}$/.test(doc)) {
      return 'RUC';
    }
    
    // Carnet de extranjería: generalmente 9-12 caracteres alfanuméricos
    if (/^[A-Za-z0-9]{9,12}$/.test(doc)) {
      return 'CE';
    }
    
    return '';
  }

  // Formatear fecha para mostrar
  formatDate(value: any): string {
    if (!value) return '-';
    
    try {
      if (typeof value === 'string') {
        if (value.includes('T')) {
          const date = new Date(value);
          return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
        return value;
      }
      
      const date = new Date(value);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', value, error);
      return '-';
    }
  }

  // ======================
  // MÉTODOS DE NOTIFICACIÓN
  // ======================
  
  private showSuccess(msg: string) { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 3000, 
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    }); 
  }
  
  private showError(msg: string) { 
    this.snackBar.open(msg, 'Cerrar', { 
      duration: 5000, 
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    }); 
  }
}