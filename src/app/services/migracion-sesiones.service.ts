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
export class MigracionSesionesService {

  private servicio = environment.api + 'migracion-sesiones';

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

  /** La sesión con bloques, archivos, preguntas abiertas y el resumen del expediente. */
  obtenerDetalle(id: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/detalle/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Pasar de pruebas a producción: los scripts quedan listos para volver a correrse. */
  cambiarDestino(idSesion: string, idConexion: string): Observable<any> {
    var body = JSON.stringify({ id_sesion: idSesion, id_conexion: idConexion });
    return this.http.post<any>(`${this.servicio}/cambiar-destino`, body, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  /** Valida la sesión y borra los datos personales. La bitácora sobrevive. */
  purgar(idSesion: string): Observable<any> {
    var body = JSON.stringify({ id_sesion: idSesion });
    return this.http.post<any>(`${this.servicio}/purgar`, body, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionSesionesService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
