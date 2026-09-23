import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Una opción de la ficha del cliente o del colaborador.
 * `permiso` en null significa visible para todos; `ruta` en null significa que
 * es una acción en sitio (el cambio de plan) y no se puede enlazar desde fuera.
 */
export interface OpcionCliente {
  id: string;
  label: string;
  icono: string;
  categoria: string;
  permiso: string | null;
  ruta: string | null;
}

/**
 * Catálogo de las opciones de la ficha del cliente y de la del colaborador.
 *
 * Vive aparte porque lo usan dos pantallas: la ficha misma y el buscador del
 * menú, que muestra estas opciones debajo de cada persona encontrada. Tenerlo
 * duplicado haría que una opción nueva apareciera en un lado y en el otro no.
 */
@Injectable({
  providedIn: 'root',
})
export class OpcionesClienteService {

  constructor(private router: Router) {}

  private opciones: OpcionCliente[] = [
    { id: 'vista_360', label: 'Vista 360', icono: '/assets/images/vista_360.png', categoria: 'Información', permiso: 'clientes.vista_360', ruta: '/clientes/vista/' },
    { id: 'registro_representantes', label: 'Representantes', icono: '/assets/images/familia.png', categoria: 'Información', permiso: 'clientes.representantes', ruta: '/clientes/representantes/' },
    { id: 'registro_medidas', label: 'Medidas', icono: '/assets/images/medidas.png', categoria: 'Información', permiso: 'clientes.medidas', ruta: '/clientes/medidas/' },
    { id: 'observaciones', label: 'Observaciones', icono: '/assets/images/observaciones.png', categoria: 'Información', permiso: 'clientes.observaciones', ruta: '/clientes/observaciones/' },
    { id: 'pagos', label: 'Pagos', icono: '/assets/images/pagos.png', categoria: 'Servicios y cobros', permiso: 'clientes.pagos', ruta: '/clientes/pagos/' },
    { id: 'productos_servicios', label: 'Productos', icono: '/assets/images/productos.png', categoria: 'Servicios y cobros', permiso: 'clientes.productos_servicios', ruta: '/clientes/productos-servicios/' },
    { id: 'contratos', label: 'Contratos', icono: '/assets/images/contratos.png', categoria: 'Servicios y cobros', permiso: 'clientes.contratos', ruta: '/clientes/contratos/' },
    { id: 'cursos_extra', label: 'Cursos Extra', icono: '/assets/images/cursos-extra.png', categoria: 'Servicios y cobros', permiso: null, ruta: '/clientes/cursos-extra/' },
    { id: 'onces', label: 'Onces', icono: '/assets/images/onces.png', categoria: 'Servicios y cobros', permiso: 'clientes.onces', ruta: '/clientes/onces/' },
    { id: 'editar', label: 'Editar', icono: '/assets/images/editar.png', categoria: 'Gestión', permiso: 'clientes.administrar', ruta: 'clientes/editar/' },
    { id: 'cambiar_plan', label: 'Cambio Plan', icono: '/assets/images/cambio_plan.png', categoria: 'Gestión', permiso: 'clientes.cambio_plan', ruta: null },
  ];

  /** Orden de presentación de las categorías */
  private ordenCategorias = ['Información', 'Servicios y cobros', 'Gestión'];

  getOpciones(): OpcionCliente[] {
    return this.opciones;
  }

  getOrdenCategorias(): string[] {
    return this.ordenCategorias;
  }

  /**
   * Opciones enlazables desde fuera de la ficha: las que tienen ruta y cuya
   * pantalla está registrada en las rutas de la aplicación. El cambio de plan
   * se queda por fuera porque abre un modal dentro de la pantalla.
   */
  getOpcionesNavegables(): OpcionCliente[] {
    return this.opciones.filter(opcion => !!opcion.ruta && this.rutaRegistrada(opcion.ruta));
  }

  // -----------------------------------------------------------------
  // Colaborador
  // -----------------------------------------------------------------

  private opcionesColaborador: OpcionCliente[] = [
    { id: 'asistencia', label: 'Asistencia', icono: '/assets/images/asistencia.png', categoria: 'Tiempo y asistencia', permiso: null, ruta: '/colaboradores/asistencia/' },
    { id: 'gestion_tiempo', label: 'Gestión Tiempo', icono: '/assets/images/tiempo.png', categoria: 'Tiempo y asistencia', permiso: null, ruta: '/colaboradores/gestion-tiempo/' },
    { id: 'productos_servicios', label: 'Productos/Servicios', icono: '/assets/images/productos.png', categoria: 'Servicios y cobros', permiso: null, ruta: '/colaboradores/productos-servicios/' },
    { id: 'pagos_recibidos', label: 'Pagos Recibidos', icono: '/assets/images/pagos.png', categoria: 'Servicios y cobros', permiso: null, ruta: '/colaboradores/pagos-recibidos/' },
    { id: 'prestamos', label: 'Préstamos', icono: '/assets/images/prestamos.png', categoria: 'Servicios y cobros', permiso: null, ruta: '/colaboradores/prestamos/' },
    { id: 'contratos', label: 'Contratos', icono: '/assets/images/contratos.png', categoria: 'Servicios y cobros', permiso: 'colaboradores.contratos', ruta: '/colaboradores/contratos/' },
    { id: 'editar', label: 'Editar', icono: '/assets/images/editar.png', categoria: 'Gestión', permiso: null, ruta: '/colaboradores/editar/' },
    { id: 'eliminar', label: 'Eliminar', icono: '/assets/images/eliminar.png', categoria: 'Gestión', permiso: null, ruta: null },
  ];

  getOpcionesColaborador(): OpcionCliente[] {
    return this.opcionesColaborador;
  }

  getOpcionesColaboradorNavegables(): OpcionCliente[] {
    return this.opcionesColaborador.filter(opcion => !!opcion.ruta && this.rutaRegistrada(opcion.ruta));
  }

  /**
   * True si la ruta de la opción (que termina en "/" y espera el id) coincide
   * con alguna ruta registrada en la aplicación. Evita que el buscador ofrezca
   * opciones heredadas del sistema de jardines cuya pantalla no existe aquí.
   */
  private rutaRegistrada(ruta: string): boolean {
    const segmentos = (ruta + 'id').replace(/^\//, '').split('/');

    return this.router.config.some((configuracion) => {
      const partes = (configuracion.path || '').split('/');
      return partes.length === segmentos.length
        && partes.every((parte, indice) => parte.startsWith(':') || parte === segmentos[indice]);
    });
  }
}
