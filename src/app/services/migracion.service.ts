import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { httpOptions } from './http';

@Injectable({
  providedIn: 'root'
})
export class MigracionService {

  private servicio = environment.api + 'migracion';

  constructor(private http: HttpClient) {}

  // =====================================================
  // CONEXIONES DESTINO
  // =====================================================

  obtenerConexiones(): Observable<HttpResponse<Object>> {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}/conexiones`, { observe: 'response' })
      .pipe(tap(this.revisar), catchError(this.handleError));
  }

  crearConexion(conexion: any): Observable<any> {
    return this.http.post<any>(`${this.servicio}/conexiones`, JSON.stringify(conexion), httpOptions)
      .pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  actualizarConexion(conexion: any): Observable<any> {
    return this.http.put<any>(`${this.servicio}/conexiones`, JSON.stringify(conexion), httpOptions)
      .pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  eliminarConexion(conexion: any): Observable<any> {
    return this.http.request<any>('DELETE', `${this.servicio}/conexiones`, {
      body: JSON.stringify(conexion),
      headers: httpOptions.headers
    }).pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  probarConexion(id: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/conexiones/probar`, JSON.stringify({ id }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // SESIONES
  // =====================================================

  obtenerSesiones(): Observable<HttpResponse<Object>> {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}/sesiones`, { observe: 'response' })
      .pipe(tap(this.revisar), catchError(this.handleError));
  }

  obtenerSesion(id: string): Observable<HttpResponse<Object>> {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}/sesiones/${id}`, { observe: 'response' })
      .pipe(tap(this.revisar), catchError(this.handleError));
  }

  crearSesion(sesion: any): Observable<any> {
    return this.http.post<any>(`${this.servicio}/sesiones`, JSON.stringify(sesion), httpOptions)
      .pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  actualizarSesion(sesion: any): Observable<any> {
    return this.http.put<any>(`${this.servicio}/sesiones`, JSON.stringify(sesion), httpOptions)
      .pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  eliminarSesion(id: string): Observable<any> {
    return this.http.request<any>('DELETE', `${this.servicio}/sesiones`, {
      body: JSON.stringify({ id }),
      headers: httpOptions.headers
    }).pipe(tap(this.revisarCuerpo), catchError(this.handleError));
  }

  /** Pasar de pruebas a producción: cambia la conexión y deja los scripts listos para volver a correr. */
  cambiarDestino(idSesion: string, idConexion: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/sesiones/cambiar-destino`,
      JSON.stringify({ id_sesion: idSesion, id_conexion: idConexion }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  /** Valida la sesión y borra los datos personales. La bitácora sobrevive. */
  purgarSesion(idSesion: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/sesiones/purgar`,
      JSON.stringify({ id_sesion: idSesion }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  obtenerClientesAdmin(): Observable<HttpResponse<Object>> {
    return this.http
      .get<HttpResponse<Object>>(`${this.servicio}/clientes-admin`, { observe: 'response' })
      .pipe(tap(this.revisar), catchError(this.handleError));
  }

  // =====================================================
  // ESQUEMA
  // =====================================================

  obtenerEsquema(idSesion: string, bloque?: string): Observable<any> {
    const parametro = bloque ? `&bloque=${bloque}` : '';
    return this.http.get<any>(`${this.servicio}/esquema?id_sesion=${idSesion}${parametro}`)
      .pipe(catchError(this.handleError));
  }

  obtenerCatalogos(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/catalogos?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  verificarEsquema(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/esquema/verificar?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // ARCHIVOS
  // =====================================================

  obtenerArchivos(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/archivos?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  /** Subida múltiple. No lleva httpOptions: el navegador arma el boundary del multipart. */
  subirArchivos(idSesion: string, archivos: File[]): Observable<any> {
    const datos = new FormData();
    datos.append('id_sesion', idSesion);
    archivos.forEach(a => datos.append('archivos[]', a, a.name));

    return this.http.post<any>(`${this.servicio}/archivos`, datos)
      .pipe(catchError(this.handleError));
  }

  clasificarArchivo(id: string, tipo: string): Observable<any> {
    return this.http.put<any>(`${this.servicio}/archivos/clasificar`,
      JSON.stringify({ id, tipo_detectado: tipo }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  eliminarArchivo(id: string): Observable<any> {
    return this.http.request<any>('DELETE', `${this.servicio}/archivos`, {
      body: JSON.stringify({ id }),
      headers: httpOptions.headers
    }).pipe(catchError(this.handleError));
  }

  // =====================================================
  // CODIGO DE GENIALISIS PRODUCTO
  // =====================================================

  obtenerIndiceCodigo(origen?: string): Observable<any> {
    const parametro = origen ? `?origen=${origen}` : '';
    return this.http.get<any>(`${this.servicio}/codigo${parametro}`)
      .pipe(catchError(this.handleError));
  }

  verArchivoCodigo(origen: string, ruta: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/codigo/archivo?origen=${origen}&ruta=${encodeURIComponent(ruta)}`)
      .pipe(catchError(this.handleError));
  }

  buscarCodigo(termino: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/codigo/buscar?q=${encodeURIComponent(termino)}`)
      .pipe(catchError(this.handleError));
  }

  subirZipCodigo(origen: string, version: string, zip: File): Observable<any> {
    const datos = new FormData();
    datos.append('origen', origen);
    datos.append('version', version);
    datos.append('zip', zip, zip.name);

    return this.http.post<any>(`${this.servicio}/codigo/zip`, datos)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // ASISTENTE
  // =====================================================

  enviarMensaje(idSesion: string, mensaje: string, bloque?: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/chat`,
      JSON.stringify({ id_sesion: idSesion, mensaje, bloque }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  obtenerHistorial(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/chat/historial?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  obtenerConsumo(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/chat/consumo?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  responderPregunta(id: string, respuesta: string): Observable<any> {
    return this.http.put<any>(`${this.servicio}/preguntas/responder`,
      JSON.stringify({ id, respuesta }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // SCRIPTS
  // =====================================================

  obtenerScripts(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/scripts?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  obtenerScript(id: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/scripts/${id}`)
      .pipe(catchError(this.handleError));
  }

  previsualizarScript(id: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/scripts/previsualizar?id=${id}`)
      .pipe(catchError(this.handleError));
  }

  guardarScriptManual(idSesion: string, codigoBloque: string, titulo: string, sql: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/scripts`,
      JSON.stringify({ id_sesion: idSesion, codigo_bloque: codigoBloque, titulo, sql_generado: sql }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  aprobarScript(id: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/scripts/aprobar`, JSON.stringify({ id }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  ejecutarScript(id: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/scripts/ejecutar`, JSON.stringify({ id }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // BITACORA
  // =====================================================

  obtenerBitacora(idSesion: string): Observable<any> {
    return this.http.get<any>(`${this.servicio}/bitacora?id_sesion=${idSesion}`)
      .pipe(catchError(this.handleError));
  }

  deshacerEjecucion(idEjecucion: string): Observable<any> {
    return this.http.post<any>(`${this.servicio}/deshacer`,
      JSON.stringify({ id_ejecucion: idEjecucion }), httpOptions)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // AYUDAS
  // =====================================================

  private revisar(response: HttpResponse<Object>) {
    const respuesta: any = response.body;
    if (respuesta && respuesta.error) {
      throw respuesta.error;
    }
    return response;
  }

  private revisarCuerpo(respuesta: any) {
    if (respuesta && respuesta.error) {
      throw respuesta.error;
    }
    return respuesta;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en MigracionService:', error);
    const mensaje = error.error && error.error.error ? error.error.error : error.message;
    return throwError(() => new Error(mensaje || `Ocurrió un error; por favor intente más tarde. Status: ${error.status}`));
  }
}
