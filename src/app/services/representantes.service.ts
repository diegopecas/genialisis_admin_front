import {
    HttpClient,
    HttpErrorResponse,
    HttpResponse,
  } from '@angular/common/http';
  import { map, catchError, tap } from 'rxjs/operators';
  import { Injectable } from '@angular/core';
  import { environment } from '../../environments/environment';
  import { Observable, throwError } from 'rxjs';
  import { httpOptions } from './http';
  import { UtilService } from '../common/constantes/util.service';
  
  @Injectable({
    providedIn: 'root'
  })
  export class RepresentantesService {
  
    private servicio = environment.api + 'representantes';
  
    constructor(
      private http: HttpClient,
      private utilService: UtilService
    ) {}
  
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
  
    obtenerPorCliente(idCliente: any) {
      return this.http
        .get<HttpResponse<Object>>(this.servicio + '/cliente/' + idCliente, { 
          observe: 'response' 
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
  
    crear(representante: any) {
      const body = JSON.stringify(representante);
            
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
  
    actualizar(representante: any) {
      const body = JSON.stringify(representante);
      return this.http.put<any>(this.servicio, body, httpOptions).pipe(
        tap((respuesta: any) => {
          if (respuesta.error) throw respuesta.error;
          return respuesta;
        }),
        catchError(this.handleError)
      );
    }
  
    eliminar(representante: any) {
      return this.http.delete<any>(`${this.servicio}/${representante.id}`).pipe(
        map((respuesta: any) => {
          if (respuesta?.error) {
            console.error('Error en la respuesta:', respuesta.error);
            throw new Error(respuesta.error);
          }
          return respuesta;
        }),
        catchError(this.handleError)
      );
    }
  
    verificarDuplicados(representante: any) {
      const body = JSON.stringify({
        id_cliente: representante.id_cliente,
        id_persona: representante.id_persona,
        id_tipo_representante: representante.id_tipo_representante
      });
      
      return this.http.post<any>(this.servicio + '/verificar-duplicados', body, httpOptions).pipe(
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