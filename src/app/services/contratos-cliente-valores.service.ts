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

export interface ContratoValor {
  id?: string;
  id_contrato?: string;
  id_producto_servicio: string;
  nombre_producto?: string;
  fecha: string;
  valor: number;
  id_periodicidad_cobro?: number;
  periodicidad?: string;
  es_implementacion?: boolean;
  // Tipo de cobro del producto al que pertenece la cuota
  id_tipo_cobro?: string;
  codigo_tipo_cobro?: string;
  orden?: number;
  mes?: number;
  anio?: number;
  // Para UI
  valorFormateado?: string;
}

export interface ResumenValores {
  total_implementacion: number;
  total_suscripcion: number;
  // Total de los productos distintos de implementacion y suscripcion
  total_otros: number;
  numero_cuotas: number;
  valor_total: number;
}

/** Linea del contrato que se envia para generar el calendario */
export interface LineaGenerarValores {
  id_producto_servicio: string;
  id_tipo_cobro?: string;
  codigo_tipo_cobro?: string;
  valor_final: number;
  orden?: number;
}

export interface GenerarValoresRequest {
  id_plan: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  cuotas_implementacion?: number;
  // Lineas escogidas en el contrato, con descuentos/recargos ya aplicados.
  // Si no vienen, el back usa las filas obligatorias de la tarifa del plan.
  lineas?: LineaGenerarValores[];
}

export interface GenerarValoresResponse {
  valores: ContratoValor[];
  tarifa: any;
  resumen: ResumenValores;
}

@Injectable({
  providedIn: 'root'
})
export class ContratosClienteValoresService {

  private servicio = environment.api + 'contratos-cliente-valores';

  constructor(private http: HttpClient) { }

  /**
   * Obtener todos los valores de un contrato
   */
  obtenerByContrato(idContrato: string): Observable<HttpResponse<ContratoValor[]>> {
    return this.http
      .get<ContratoValor[]>(this.servicio + `/contrato/${idContrato}`, {
        observe: 'response',
      })
      .pipe(
        tap((response: HttpResponse<ContratoValor[]>) => {
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Guardar todos los valores de un contrato
   */
  guardarValores(idContrato: string, valores: ContratoValor[]): Observable<any> {
    const body = JSON.stringify({
      id_contrato: idContrato,
      valores: valores.map(v => ({
        id_producto_servicio: v.id_producto_servicio,
        fecha: v.fecha,
        valor: v.valor,
        id_periodicidad_cobro: v.id_periodicidad_cobro
      }))
    });

    return this.http.post<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Generar valores por defecto basado en tarifas del plan
   */
  generarValoresPorDefecto(params: GenerarValoresRequest): Observable<GenerarValoresResponse> {
    const body = JSON.stringify(params);
    return this.http.post<GenerarValoresResponse>(this.servicio + '/generar-defecto', body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) {
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}