import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { Country, Department, District, Province } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
 private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiUrl}/paises`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/departamentos`);
  }

  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/provincias`);
  }

  getDistricts(): Observable<District[]> {
    return this.http.get<District[]>(`${this.apiUrl}/distritos`);
  }

  getDepartmentsByCountry(countryId: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/departamentos?paisId=${countryId}`);
  }

  getProvincesByDepartment(departmentId: number): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/provincias?departamentoId=${departmentId}`);
  }

  getDistrictsByProvince(provinceId: number): Observable<District[]> {
    return this.http.get<District[]>(`${this.apiUrl}/distritos?provinciaId=${provinceId}`);
  }

  // Método para obtener nombre por ID de cualquier entidad
  getNameById(endpoint: string, id: number): Observable<string> {
    return this.http.get<any[]>(`${this.apiUrl}/${endpoint}?id=${id}`).pipe(
      map(items => items.length > 0 ? items[0].nombre : 'N/A')
    );
  }
}
