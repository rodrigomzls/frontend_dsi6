import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
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

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  pageSize = 5; // default
  displayedColumns: string[] = ['numero', 'nombre_usuario', 'nombre_completo', 'email', 'roleName', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuarioService: UsuarioService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // Asegurar que el paginador inicial tenga el pageSize definido
    try {
      if (this.paginator) this.paginator.pageSize = this.pageSize;
    } catch (e) { /* noop */ }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    if (this.paginator) {
      this.paginator.pageSize = size;
      this.dataSource.paginator = this.paginator;
      try {
        if ((this.paginator as any)._changePageSize) {
          (this.paginator as any)._changePageSize(size);
        } else {
          this.paginator.firstPage();
        }
      } catch (e) { /* noop */ }
    }
    this.cdr.detectChanges();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usuarioService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        // Asegurar pageSize actual en el paginador
        try { if (this.paginator) this.paginator.pageSize = this.pageSize; } catch (e) { /* noop */ }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(UsuarioFormComponent, { width: '520px', maxWidth: '95vw', autoFocus: false });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  openEditDialog(user: any): void {
    const ref = this.dialog.open(UsuarioFormComponent, { width: '520px', maxWidth: '95vw', autoFocus: false, data: { user } });
    ref.afterClosed().subscribe(result => { if (result) this.loadUsers(); });
  }

  toggleActive(user: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { message: user.activo ? 'Desactivar usuario?' : 'Activar usuario?' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.toggleActive(user.id_usuario, !user.activo).subscribe({
          next: () => { this.showSuccess('Estado actualizado'); this.loadUsers(); },
          error: (e) => { this.showError('Error actualizando estado'); console.error(e); }
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

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
}
