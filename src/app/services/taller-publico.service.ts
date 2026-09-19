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
 * Flujo público del taller: lo consume la pantalla que abre el equipo del
 * jardín desde el celular, sin sesión. La credencial es el token de la visita,
 * que viaja en cada llamada y el backend valida contra la tabla de visitas.
 */
@Injectable({
  providedIn: 'root',
})
export class TallerPublicoService {
  private servicio = environment.api + 'taller-publico';

  constructor(private http: HttpClient) {}

  obtenerVisita(token: string) {
    return this.get(`${this.servicio}/visita/${token}`);
  }

  // Puerta de entrada: busca a la persona por documento dentro de la visita.
  identificar(token: string, numeroDocumento: string) {
    return this.post(`${this.servicio}/identificar`, {
      token: token,
      numero_documento: numeroDocumento,
    });
  }

  obtenerParticipante(token: string, idParticipante: string) {
    return this.get(`${this.servicio}/participante/${token}/${idParticipante}`);
  }

  guardarParticipante(data: any) {
    return this.post(`${this.servicio}/participante`, data);
  }

  obtenerEncuesta(token: string, idParticipante: string) {
    return this.get(`${this.servicio}/encuesta/${token}/${idParticipante}`);
  }

  guardarEncuesta(data: any) {
    return this.post(`${this.servicio}/encuesta`, data);
  }

  obtenerIdeas(token: string, idParticipante: string) {
    return this.get(`${this.servicio}/ideas/${token}/${idParticipante}`);
  }

  guardarIdeas(data: any) {
    return this.post(`${this.servicio}/ideas`, data);
  }

  obtenerCaracter(token: string, idParticipante: string) {
    return this.get(`${this.servicio}/caracter/${token}/${idParticipante}`);
  }

  guardarCaracter(data: any) {
    return this.post(`${this.servicio}/caracter`, data);
  }

  // La calificación no lleva participante: es anónima.
  obtenerCalificacion(token: string) {
    return this.get(`${this.servicio}/calificacion/${token}`);
  }

  guardarCalificacion(data: any) {
    return this.post(`${this.servicio}/calificacion`, data);
  }

  private get(url: string) {
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

  private post(url: string, data: any) {
    return this.http
      .post<HttpResponse<Object>>(url, data, httpOptions)
      .pipe(
        tap((response: any) => {
          if (response.error) {
            throw response.error;
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
