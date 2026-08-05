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

export interface ContratoCampo {
  llave: string;
  valor: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContratosCamposService {
  private servicio = environment.api + 'contratos-campos';

  constructor(private http: HttpClient) {}

  /**
   * Valores diligenciados de un contrato
   */
  obtenerPorContrato(idContrato: string) {
    return this.http
      .get<HttpResponse<Object>>(this.servicio + '/' + idContrato, {
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

  /**
   * Guarda todos los campos del contrato de una sola vez.
   * El backend reemplaza los valores anteriores.
   */
  guardar(idContrato: string, campos: ContratoCampo[]) {
    const body = JSON.stringify({ id_contrato: idContrato, campos });
    return this.http.post<any>(this.servicio, body, httpOptions).pipe(
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
