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
  
  @Injectable({
    providedIn: 'root'
  })
  export class TiposRepresentanteService {
  
    private servicio = environment.api + 'tipos-representante';
  
    constructor(private http: HttpClient) {}
  
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
  
    crear(tipoRepresentante: any) {
      const body = JSON.stringify({
        nombre: tipoRepresentante.nombre
      });
      
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
  
    actualizar(tipoRepresentante: any) {
      const body = JSON.stringify({
        id: tipoRepresentante.id,
        nombre: tipoRepresentante.nombre
      });
      
      return this.http.put<any>(this.servicio, body, httpOptions).pipe(
        tap((respuesta: any) => {
          if (respuesta.error) throw respuesta.error;
          return respuesta;
        }),
        catchError(this.handleError)
      );
    }
  
    eliminar(tipoRepresentante: any) {
      return this.http.delete<any>(`${this.servicio}/${tipoRepresentante.id}`).pipe(
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
  
    private handleError(error: HttpErrorResponse) {
      return throwError(() => error);
    }
  }