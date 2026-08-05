import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { httpOptions } from './http';

/**
 * Campo parametrizable de una plantilla. En el texto del documento se
 * referencia con el marcador {{campo_LLAVE}}; los de tipo opcion tienen
 * ademas {{campo_LLAVE_VALOR}} para marcar casillas.
 */
export interface PlantillaCampo {
  id?: string;
  id_plantilla?: string;
  llave: string;
  etiqueta: string;
  ayuda?: string;
  tipo: string;
  opciones?: string;
  valor_defecto?: string;
  obligatorio?: number;
  orden?: number;
  activo?: number;
  /** Valor diligenciado en el contrato. Vive en el mismo objeto para que el
   *  formulario haga binding directo sobre el, sin indices dinamicos. */
  valor?: string;
  /** Opciones ya resueltas. Se calculan una sola vez al cargar el campo: si el
   *  template las pidiera con un metodo, Angular recrearia los <option> en cada
   *  ciclo de deteccion y el select perderia la seleccion. */
  opcionesLista?: { valor: string; etiqueta: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class PlantillasCamposService {
  private servicio = environment.api + 'plantillas-campos';

  constructor(private http: HttpClient) {}

  /**
   * Todos los campos configurados del tenant
   */
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

  /**
   * Campos activos de una plantilla, por su clave (ej. contrato_completo).
   * Es el que usa el formulario para pintar los controles.
   */
  obtenerPorClave(clave: string) {
    return this.http
      .get<HttpResponse<Object>>(this.servicio + '/por-clave/' + clave, {
        observe: 'response',
      })
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

  crear(campo: PlantillaCampo) {
    const body = JSON.stringify(campo);
    return this.http.post<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  actualizar(campo: PlantillaCampo) {
    const body = JSON.stringify(campo);
    return this.http.put<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  eliminar(id: any) {
    const body = JSON.stringify({ id });
    return this.http
      .request<any>('delete', this.servicio, { body, ...httpOptions })
      .pipe(
        tap((respuesta: any) => {
          if (respuesta.error) throw respuesta.error;
          return respuesta;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
