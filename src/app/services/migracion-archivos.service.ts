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
export class MigracionArchivosService {

  private servicio = environment.api + 'migracion-archivos';

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

  /**
   * Subida múltiple. No lleva httpOptions a propósito: con FormData el
   * navegador arma el Content-Type con su boundary, y fijarlo a mano rompe
   * la carga.
   */
  crear(idSesion: string, archivos: File[]): Observable<any> {
    const datos = new FormData();
    datos.append('id_sesion', idSesion);
    archivos.forEach(archivo => datos.append('archivos[]', archivo, archivo.name));

    return this.http.post<any>(this.servicio, datos).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  /** Lo único editable es el tipo detectado, cuando la clasificación automática se equivoca. */
  actualizar(elemento: any): Observable<any> {
    var body = JSON.stringify(elemento);
    return this.http.put<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionArchivosService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
