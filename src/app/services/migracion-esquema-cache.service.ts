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
export class MigracionEsquemaCacheService {

  private servicio = environment.api + 'migracion-esquema-cache';

  constructor(private http: HttpClient) {}

  obtenerTodos() {
    return this.http
      .get<HttpResponse<Object>>(this.servicio, { observe: 'response' })
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

  eliminar(elemento: any): Observable<any> {
    var body = JSON.stringify(elemento);
    return this.http.request<any>('DELETE', this.servicio, {
      body: body,
      headers: httpOptions.headers
    }).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  /** Esquema real del destino para un bloque, leído en vivo. */
  obtenerEsquema(idSesion: string, codigoBloque?: string): Observable<any> {
    const parametro = codigoBloque ? `&codigo_bloque=${codigoBloque}` : '';
    return this.http.get<any>(`${this.servicio}/esquema?id_sesion=${idSesion}${parametro}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Catálogos reales del destino: contra esto se normalizan grados y parentescos. */
  obtenerCatalogos(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/catalogos?id_sesion=${idSesion}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Confirma que el esquema del destino sigue siendo el mismo con el que se abrió la sesión. */
  verificar(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/verificacion?id_sesion=${idSesion}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionEsquemaCacheService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
