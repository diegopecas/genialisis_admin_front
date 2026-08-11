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
export class MigracionCodigoIndiceService {

  private servicio = environment.api + 'migracion-codigo-indice';

  constructor(private http: HttpClient) {}

  obtenerTodos(origen?: string) {
    const url = origen ? `${this.servicio}?origen=${origen}` : this.servicio;
    return this.http
      .get<HttpResponse<Object>>(url, { observe: 'response' })
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
   * Sube el zip del back o del front de Genialisis producto y lo indexa.
   * Sin httpOptions: con FormData el navegador arma el Content-Type.
   */
  crear(origen: string, version: string, zip: File): Observable<any> {
    const datos = new FormData();
    datos.append('origen', origen);
    datos.append('version', version);
    datos.append('zip', zip, zip.name);

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

  /** Contenido de un archivo del zip, por su ruta. */
  obtenerArchivo(origen: string, ruta: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/archivo?origen=${origen}&ruta=${encodeURIComponent(ruta)}`).pipe(
      catchError(this.handleError)
    );
  }

  /** Busca por ruta o por firma de clase o función. */
  buscar(termino: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/busqueda?q=${encodeURIComponent(termino)}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionCodigoIndiceService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
