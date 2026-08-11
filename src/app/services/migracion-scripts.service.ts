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
export class MigracionScriptsService {

  private servicio = environment.api + 'migracion-scripts';

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

  crear(elemento: any): Observable<any> {
    var body = JSON.stringify(elemento);
    return this.http.post<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta && respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

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

  /** No toca el destino: dice cuántas filas entran por tabla y muestra las primeras sentencias. */
  previsualizar(id: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/previsualizacion?id=${id}`).pipe(
      catchError(this.handleError)
    );
  }

  aprobar(id: string): Observable<any> {
    var body = JSON.stringify({ id });
    return this.http.post<any>(`${this.servicio}/aprobar`, body, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  ejecutar(id: string): Observable<any> {
    var body = JSON.stringify({ id });
    return this.http.post<any>(`${this.servicio}/ejecutar`, body, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionScriptsService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
