import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PersonaService } from '../../../core/services/persona.service';
import { PersonaFormComponent } from '../../../components/persona-form/persona-form.component';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-persona-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
    
  ],
  templateUrl: './persona-list.component.html',
  styleUrls: ['./persona-list.component.css']
})
export class PersonaListComponent implements OnInit {
  pageSize = 5;
  displayedColumns: string[] = ['id_persona', 'numero_documento', 'nombre_completo', 'telefono', 'direccion', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private personaService: PersonaService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPersonas();
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
  }

  loadPersonas(): void {
    this.isLoading = true;
    this.personaService.getAll().subscribe({
      next: (rows) => { 
        this.dataSource.data = rows;
        // Asegurar pageSize actual en el paginador
        try { if (this.paginator) this.paginator.pageSize = this.pageSize; } catch (e) { /* noop */ }
        this.isLoading = false; 
      },
      error: (err) => { console.error('Error cargando personas:', err); this.isLoading = false; }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  addPersona(): void {
    const ref = this.dialog.open(PersonaFormComponent, { width: '520px', maxWidth: '95vw', autoFocus: false });
    ref.afterClosed().subscribe((res: any) => {
      if (res && res.id_persona) {
        this.showSuccess('Persona creada');
        this.loadPersonas();
      }
    });
  }

  editPersona(p: any): void {
    const dialogRef = this.dialog.open(PersonaFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { persona: p }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.id_persona) {
        this.showSuccess('Persona actualizada');
        this.loadPersonas();
      }
    });
  }

  deletePersona(p: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { message: `Eliminar persona "${p.nombre_completo}"?` } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.personaService.delete(p.id_persona).subscribe({
          next: () => { this.showSuccess('Persona eliminada'); this.loadPersonas(); },
          error: (e) => { this.showError('Error al eliminar persona'); console.error(e); }
        });
      }
    });
  }

  private showSuccess(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] }); }
  private showError(msg: string) { this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] }); }
}
