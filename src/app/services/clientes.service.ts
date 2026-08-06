import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
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
export class ClientesService {

  private servicio = environment.api + 'clientes';
  private servicioXplan = environment.api + 'clientes-x-planes';

  constructor(private http: HttpClient) { }


  obtenerById(id: any) {
    return this.http
      .get<HttpResponse<Object>>(this.servicio + `/${id}`, {
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

  obtenerTodosXPlan(idPlan: any) {
    return this.http
      .get<HttpResponse<Object>>(this.servicioXplan + '/' + idPlan, { observe: 'response' })
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

  // Listado filtrado del módulo. Solo se envían los filtros con valor; sin filtros trae todos.
  obtenerPorFiltros(filtros: { id_plan?: any; estado?: any; permanente?: any; nombre?: any }) {
    let params = new HttpParams();

    if (filtros.id_plan) {
      params = params.set('id_plan', filtros.id_plan);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.permanente !== undefined && filtros.permanente !== null && filtros.permanente !== '') {
      params = params.set('permanente', filtros.permanente);
    }
    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }

    return this.http
      .get<HttpResponse<Object>>(this.servicioXplan + '-filtros', { observe: 'response', params })
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

  obtenerActivos() {
    return this.http
      .get<HttpResponse<Object>>(this.servicioXplan + '-activos', { observe: 'response' })
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

  obtenerPlanByCliente(idCliente: any) {
    return this.http
      .get<HttpResponse<Object>>(this.servicioXplan + '/cliente/' + idCliente, { observe: 'response' })
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

  activarClientePlan(idCliente: any, idPlan: any, anio: any, idGrado: any = null) {
    const body = JSON.stringify({
      anio: anio,
      id_cliente: idCliente,
      id_plan: idPlan
    });

    return this.http.post<any>(this.servicioXplan, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) {
          console.log(respuesta);
          throw respuesta.error;
        }
        console.log(respuesta);
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  inactivarClientePlan(id: any) {
    const body = JSON.stringify({ id: id });

    return this.http.put<any>(this.servicioXplan, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) {
          console.log(respuesta);
          throw respuesta.error;
        }
        console.log(respuesta);
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }


  crear(cliente: any) {
    const body = JSON.stringify(cliente);

    return this.http.post<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) {
          console.log(respuesta);
          throw respuesta.error;
        }
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  actualizar(cliente: any) {
    const body = JSON.stringify(cliente);
    return this.http.put<any>(this.servicio, body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  verificarDuplicados(id_persona: any) {
    const body = JSON.stringify({
      id_persona: id_persona
    });

    return this.http.post<any>(this.servicio + '/verificar-duplicados', body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  obtenerReporteCompleto() {
    return this.http
      .get<HttpResponse<Object>>(this.servicio + '-reporte-completo', { observe: 'response' })
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

  obtenerReporteRecordatorios() {
    return this.http
      .get<HttpResponse<Object>>(this.servicio + '-reporte-recordatorios', { observe: 'response' })
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

  actualizacionMasiva(body: any) {
    return this.http.post<any>(this.servicio + '/actualizacion-masiva', JSON.stringify(body), httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  cambioPlanMasivo(body: any) {
    return this.http.post<any>(this.servicioXplan + '/cambio-plan-masivo', JSON.stringify(body), httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  registroRapido(data: any) {
    const body = JSON.stringify(data);
    return this.http.post<any>(this.servicio + '/registro-rapido', body, httpOptions).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  // Lee la foto/archivo del registro civil con IA y devuelve los datos del niño y
  // sus padres para prellenar el asistente. No crea nada en la BD.
  analizarRegistroCivil(archivo: File) {
    const formData = new FormData();
    formData.append('registro_civil', archivo);

    return this.http.post<any>(this.servicio + '/analizar-registro-civil', formData).pipe(
      tap((respuesta: any) => {
        if (respuesta.error) throw respuesta.error;
        return respuesta;
      }),
      catchError(this.handleError)
    );
  }

  // Crea en una sola transacción el niño (persona + cliente), su plan/grado,
  // horarios y los representantes (persona + representante). Los usuarios del portal se
  // crean aparte con Usuarios.crear a partir de los id_persona que devuelve.
  registroRapidoCompleto(data: any) {
    const body = JSON.stringify(data);
    return this.http.post<any>(this.servicio + '/registro-rapido-completo', body, httpOptions).pipe(
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