import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Country, Department, District, Person, Province } from '../../core/models/persona.model';
import { PersonService } from '../../core/services/persona.service';
import { LocationService } from '../../core/services/ubicacion.service';
import { CustomValidators } from '../../utils/validators';
import { GeocodingService } from '../../core/services/geocoding.service';

@Component({
  selector: 'app-persona-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './persona-form.component.html',
  styleUrls: ['./persona-form.component.css'],
})
export class PersonaFormComponent implements OnInit {
  personForm: FormGroup;
  isEditMode = false;

  countries: Country[] = [];
  departments: Department[] = [];
  provinces: Province[] = [];
  districts: District[] = [];

  isLoading = false;
  isGeocoding = false;

  private paisNombre = '';
  private departamentoNombre = '';
  private provinciaNombre = '';
  private distritoNombre = '';

  constructor(
    private fb: FormBuilder,
    private personService: PersonService,
    private locationService: LocationService,
    private geocodingService: GeocodingService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PersonaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { person: Person }
  ) {
    this.personForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCountries();

    if (this.data?.person) {
      this.isEditMode = true;
      this.loadFormData(this.data.person);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      dni: ['', [Validators.required, CustomValidators.dniValidator()]],
      correo: ['', [Validators.required, CustomValidators.emailValidator()]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      paisId: ['', Validators.required],
      departamentoId: ['', Validators.required],
      provinciaId: ['', Validators.required],
      distritoId: ['', Validators.required],
      coordenadas: [''],
    });
  }

  public canGeocode(): boolean {
    return (
      this.personForm.get('direccion')?.valid &&
      this.personForm.get('paisId')?.valid &&
      this.personForm.get('departamentoId')?.valid &&
      this.personForm.get('provinciaId')?.valid &&
      this.personForm.get('distritoId')?.valid
    ) as boolean;
  }

  private geocodeAddress(): void {
    if (this.isGeocoding) return;

    const direccion = this.personForm.get('direccion')?.value;
    const distrito = this.distritoNombre;
    const provincia = this.provinciaNombre;
    const departamento = this.departamentoNombre;
    const pais = this.paisNombre;

    if (direccion && distrito && provincia && departamento && pais) {
      this.isGeocoding = true;

      this.geocodingService
        .geocodeFromComponents(direccion, distrito, provincia, departamento, pais)
        .subscribe({
          next: (coordinates) => {
            this.isGeocoding = false;
            if (coordinates) {
              this.personForm.get('coordenadas')?.setValue(
                `${coordinates.lat},${coordinates.lng}`
              );
              this.showMessage('Coordenadas calculadas correctamente', 'success');
            } else {
              this.showMessage('No se pudieron calcular las coordenadas', 'warn');
            }
          },
          error: (error) => {
            this.isGeocoding = false;
            console.error('Error en geocodificación:', error);
            this.showMessage('Error al calcular coordenadas', 'error');
          },
        });
    }
  }

  manualGeocode(): void {
    if (this.canGeocode()) {
      this.geocodeAddress();
    } else {
      this.showMessage('Complete todos los campos de ubicación primero', 'warn');
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warn'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // --- Métodos de carga en cascada ---
  loadFormData(person: Person): void {
    this.personForm.patchValue({
      nombre: person.nombre,
      apellidos: person.apellidos,
      dni: person.dni,
      correo: person.correo,
      telefono: person.telefono,
      direccion: person.direccion,
      coordenadas: person.coordenadas || '',
      paisId: person.paisId,
    });

    this.onCountryChange(person.paisId, person.departamentoId);
  }

  loadCountries(): void {
    this.isLoading = true;
    this.locationService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.isLoading = false;

        if (this.isEditMode && this.data.person) {
          this.loadDepartmentsByCountry(
            this.data.person.paisId,
            this.data.person.departamentoId
          );
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.isLoading = false;
      },
    });
  }

  loadDepartmentsByCountry(countryId: number, selectDepartmentId?: number): void {
    if (!countryId) return;

    this.isLoading = true;
    this.locationService.getDepartmentsByCountry(countryId).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.paisNombre = this.countries.find((c) => c.id === countryId)?.nombre || '';

        if (selectDepartmentId) {
          this.personForm.get('departamentoId')?.setValue(selectDepartmentId);
          this.loadProvincesByDepartment(selectDepartmentId, this.data.person.provinciaId);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.isLoading = false;
      },
    });
  }

  loadProvincesByDepartment(departmentId: number, selectProvinceId?: number): void {
    if (!departmentId) return;

    this.isLoading = true;
    this.locationService.getProvincesByDepartment(departmentId).subscribe({
      next: (provinces) => {
        this.provinces = provinces;
        this.departamentoNombre =
          this.departments.find((d) => d.id === departmentId)?.nombre || '';

        if (selectProvinceId) {
          this.personForm.get('provinciaId')?.setValue(selectProvinceId);
          this.loadDistrictsByProvince(selectProvinceId, this.data.person.distritoId);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
        this.isLoading = false;
      },
    });
  }

  loadDistrictsByProvince(provinceId: number, selectDistrictId?: number): void {
    if (!provinceId) return;

    this.isLoading = true;
    this.locationService.getDistrictsByProvince(provinceId).subscribe({
      next: (districts) => {
        this.districts = districts;
        this.provinciaNombre = this.provinces.find((p) => p.id === provinceId)?.nombre || '';

        if (selectDistrictId) {
          this.personForm.get('distritoId')?.setValue(selectDistrictId);
          this.distritoNombre =
            this.districts.find((d) => d.id === selectDistrictId)?.nombre || '';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading districts:', error);
        this.isLoading = false;
      },
    });
  }

  onCountryChange(countryId: number | { value: number }, selectDepartmentId?: number): void {
    const id = typeof countryId === 'object' ? countryId.value : countryId;
    this.loadDepartmentsByCountry(id, selectDepartmentId);
  }

  onDepartmentChange(departmentId: number | { value: number }, selectProvinceId?: number): void {
    const id = typeof departmentId === 'object' ? departmentId.value : departmentId;
    this.loadProvincesByDepartment(id, selectProvinceId);
  }

  onProvinceChange(provinceId: number | { value: number }, selectDistrictId?: number): void {
    const id = typeof provinceId === 'object' ? provinceId.value : provinceId;
    this.loadDistrictsByProvince(id, selectDistrictId);
  }

  onDistritoChange(distritoId: number | { value: number }): void {
    const id = typeof distritoId === 'object' ? distritoId.value : distritoId;
    this.distritoNombre = this.districts.find((d) => d.id === id)?.nombre || '';
  }

  onSubmit(): void {
    if (this.personForm.valid) {
      const formData = this.personForm.value;

      const request$ = this.isEditMode
        ? this.personService.updatePerson(this.data.person.id!, formData)
        : this.personService.createPerson(formData);

      request$.subscribe({
        next: () => this.dialogRef.close(true),
        error: (error) => console.error('Error saving person:', error),
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
