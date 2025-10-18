import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, throwError, catchError } from 'rxjs';
import { Country, Department, District, Person, Province } from '../models/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
   private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  // Obtener personas con información completa de ubicación
  getPeopleWithLocation(): Observable<any[]> {
    return forkJoin({
      personas: this.http.get<Person[]>(`${this.apiUrl}/personas`),
      paises: this.http.get<Country[]>(`${this.apiUrl}/paises`),
      departamentos: this.http.get<Department[]>(`${this.apiUrl}/departamentos`),
      provincias: this.http.get<Province[]>(`${this.apiUrl}/provincias`),
      distritos: this.http.get<District[]>(`${this.apiUrl}/distritos`)
    }).pipe(
      map(({ personas, paises, departamentos, provincias, distritos }) => {
        return personas.map(person => ({
          ...person,
          paisNombre: this.getNameById(paises, person.paisId),
          departamentoNombre: this.getNameById(departamentos, person.departamentoId),
          provinciaNombre: this.getNameById(provincias, person.provinciaId),
          distritoNombre: this.getNameById(distritos, person.distritoId)
        }));
      }),
      catchError(this.handleError)
    );
  }

  // Función auxiliar para obtener nombre por ID
  private getNameById(items: any[], id: number): string {
    const item = items.find(i => i.id === id);
    return item ? item.nombre : 'N/A';
  }

  getPeople(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.apiUrl}/personas`).pipe(
      catchError(this.handleError)
    );
  }

  getPerson(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.apiUrl}/personas/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createPerson(person: Person): Observable<Person> {
    return this.http.post<Person>(`${this.apiUrl}/personas`, person).pipe(
      catchError(this.handleError)
    );
  }

  updatePerson(id: number, person: Person): Observable<Person> {
    return this.http.put<Person>(`${this.apiUrl}/personas/${id}`, person).pipe(
      catchError(this.handleError)
    );
  }

  deletePerson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/personas/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}
