import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { httpOptions } from './http';

@Injectable({
  providedIn: 'root'
})
export class MigracionEjecucionesService {

  private servicio = environment.api + 'migracion-ejecuciones';

  constructor(private http: HttpClient) {}

  obtenerTodos(idSesion: string) {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}?id_sesion=${idSesion}`, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<Object>) => {
          let respuesta: any = response.body;
          if (respuesta.error) {
            throw respuesta.error;
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  obtenerById(id: any): Observable<HttpResponse<Object>> {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}/${id}`, {
        observe: 'response',
      })
      .pipe(
        tap((response: HttpResponse<Object>) => {
          let respuesta: any = response.body;
          if (respuesta && respuesta.error) {
            throw respuesta.error;
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /** Borra por tenant lo que escribió esa ejecución, en orden inverso. */
  deshacer(id: string): Observable<any> {
    var body = JSON.stringify({ id });
    return this.http.post<any>(`${this.servicio}/deshacer`, body, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionEjecucionesService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
