import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuarioService } from '../../../core/services/usuario.service';
import { UsuarioFormComponent } from '../../../components/usuario-form/usuario-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  pageSize = 10; // Valor inicial
  currentPage = 0; // Página actual
  displayedColumns: string[] = ['numero', 'usuario_info', 'persona', 'rol', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  filteredData: any[] = []; // Datos filtrados para paginación
  isLoading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('tableWrapper') tableWrapper!: ElementRef;

  constructor(
    private usuarioService: UsuarioService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    // Ajustar columnas según permisos
    if (!this.authService.isAdmin()) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'acciones');
    }
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

  // Cargar usuarios
  loadUsers(): void {
    this.isLoading = true;
    this.usuarioService.getUsers().subscribe({
      next: (users) => {
        console.log('Usuarios cargados:', users);
        this.dataSource.data = users;
        this.filteredData = [...users]; // Inicializar datos filtrados
        
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
        console.error('Error cargando usuarios:', err);
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
    
    // Si hay datos filtrados, usarlos; si no, usar todos
    const dataToUse = this.filteredData.length > 0 ? this.filteredData : this.dataSource.data;
    
    // Obtener slice de datos para la página actual
    const pageData = dataToUse.slice(startIndex, endIndex);
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
    const dataToUse = this.filteredData.length > 0 ? this.filteredData : this.dataSource.data;
    const totalPages = Math.ceil(dataToUse.length / this.pageSize);
    return this.currentPage < totalPages - 1;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize;
  }

  getEndIndex(): number {
    const dataToUse = this.filteredData.length > 0 ? this.filteredData : this.dataSource.data;
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return Math.min(endIndex, dataToUse.length);
  }

  // Número de fila
  getRowNumber(index: number): number {
    return this.getStartIndex() + index + 1;
  }

  // ======================
  // MÉTODOS DE DIALOGOS (mantenidos igual)
  // ======================

  openAddDialog(): void {
    const ref = this.dialog.open(UsuarioFormComponent, { width: '520px', maxWidth: '95vw', autoFocus: false });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  openEditDialog(user: any): void {
    const ref = this.dialog.open(UsuarioFormComponent, { 
      width: '520px', 
      maxWidth: '95vw', 
      autoFocus: false, 
      data: { user } 
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  toggleActive(user: any): void {
    const isActivating = !user.activo;
    const actionText = isActivating ? 'activar' : 'desactivar';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      panelClass: 'confirm-dialog',
      data: {
        title: `Confirmar ${actionText}`,
        message: `¿Estás seguro de ${actionText} al usuario <strong>${user.nombre_usuario || user.username}</strong>?`,
        confirmText: isActivating ? 'Activar' : 'Desactivar',
        cancelText: 'Cancelar',
        confirmColor: isActivating ? 'primary' : 'warn',
        icon: isActivating ? 'check_circle' : 'toggle_off',
        showIcon: true
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.toggleActive(user.id_usuario, !user.activo).subscribe({
          next: () => { 
            this.showSuccess(`Usuario ${actionText}do correctamente`); 
            this.loadUsers(); 
          },
          error: (e) => { 
            this.showError(`Error al ${actionText} usuario`); 
            console.error(e); 
          }
        });
      }
    });
  }

  deleteUser(user: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { message: `Eliminar usuario "${user.nombre_usuario}"? Esta acción no se puede deshacer.` }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.deleteUser(user.id_usuario).subscribe({
          next: () => { this.showSuccess('Usuario eliminado'); this.loadUsers(); },
          error: (e) => { this.showError('Error al eliminar usuario'); console.error(e); }
        });
      }
    });
  }

  // ======================
  // MÉTODOS AUXILIARES
  // ======================

  getRoleClass(idRol: number): string {
    switch (idRol) {
      case 1: return 'admin';
      case 2: return 'vendedor';
      case 3: return 'repartidor';
      case 4: return 'almacenero';
      default: return 'default';
    }
  }

  getRoleName(idRol: number): string {
    switch (idRol) {
      case 1: return 'Administrador';
      case 2: return 'Vendedor';
      case 3: return 'Repartidor';
      case 4: return 'Almacenero';
      default: return 'Sin rol';
    }
  }

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