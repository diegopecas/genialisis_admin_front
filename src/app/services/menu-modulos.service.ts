import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PermisosService } from './permisos.service';

/**
 * Opción de un submenú de módulo (las tarjetas pequeñas dentro de cada grupo).
 * - `id` es el código que recibe el `seleccionarOpcion` de cada componente.
 * - `ruta` es el destino real; es la que usa el árbol del menú principal.
 * - `imagen` o `icono` (clase de Font Awesome) definen el gráfico de la tarjeta;
 *   `iconoArbol` es el emoji con el que se ve la opción en el árbol.
 * - `permiso` (opcional) gatea la visibilidad; las opciones sin permiso se muestran siempre.
 * - `keywords` (opcional) son términos alternativos para que la búsqueda encuentre la opción
 *   aunque el usuario escriba una palabra distinta al label.
 * - `hijos` son las pantallas que se abren desde esta opción. No se pintan como tarjeta:
 *   existen para que el árbol refleje el siguiente nivel de navegación real.
 * - `labelHtml` lo llena el filtrado con el label y el término resaltado; no se declara a mano.
 */
export interface OpcionMenuModulo {
  id: string;
  label: string;
  alt?: string;
  imagen?: string;
  icono?: string;
  iconoEstilo?: { [propiedad: string]: string };
  iconoArbol?: string;
  ruta?: string;
  permiso?: string;
  columna?: string;
  keywords?: string[];
  hijos?: OpcionMenuModulo[];
  labelHtml?: SafeHtml | string;
  // Solo para las opciones que se pintan como tarjeta simple (pantalla de Administración)
  descripcion?: string;
  claseIcono?: string;
  textoAccion?: string;
}

/**
 * Grupo del menú de un módulo (la tarjeta grande con su submenú).
 * - `permisos` funciona como el `tieneAlguno` de los componentes: basta con tener uno.
 *   Si viene vacío o no viene, el grupo se muestra siempre.
 * - `claseIcono` es la clase de color que ya está en el SCSS de cada módulo
 *   (por ejemplo `actividades`, `inventario`, `apoyo`).
 * - `estilo` son variables CSS puntuales de la tarjeta, como el naranja de Cobros Automáticos.
 */
export interface GrupoMenuModulo {
  id: string;
  titulo: string;
  descripcion: string;
  claseIcono: string;
  alt?: string;
  imagen?: string;
  icono?: string;
  iconoArbol?: string;
  permisos?: string[];
  estilo?: { [propiedad: string]: string };
  keywords?: string[];
  opciones: OpcionMenuModulo[];
  tituloHtml?: SafeHtml | string;
}

/**
 * Módulo del sistema: una pantalla con tarjetas y, cuando aplica, otras pantallas
 * que cuelgan de ella. Es la raíz del árbol del menú principal.
 * - `ruta` es la pantalla del módulo y `rutaLabel` la etiqueta de ese acceso dentro del árbol.
 * - `grupos` son las tarjetas de esa pantalla (lo que consumen los componentes).
 * - `opciones` son pantallas que se alcanzan desde el módulo sin pasar por una tarjeta
 *   con submenú (por ejemplo Migración, que solo se alcanza desde el menú principal).
 * - `submodulos` son ids de otros módulos a los que se llega desde esta pantalla;
 *   el árbol los anida ahí para reflejar la navegación real.
 * - `raiz: false` marca los módulos que no son raíz del árbol porque cuelgan de otro.
 */
export interface ModuloMenu {
  id: string;
  label: string;
  iconoArbol: string;
  imagen?: string;
  permiso?: string;
  ruta?: string;
  rutaLabel?: string;
  rutaPermiso?: string;
  keywords?: string[];
  raiz?: boolean;
  grupos: GrupoMenuModulo[];
  opciones?: OpcionMenuModulo[];
  submodulos?: string[];
  // Datos con los que el módulo se pinta como tarjeta dentro de la pantalla de su padre
  descripcion?: string;
  claseIcono?: string;
  textoAccion?: string;
  idTarjeta?: string;
}

/**
 * Tarjeta simple de una pantalla que no tiene submenús (hoy, la de Administración).
 * `id` es el código que recibe el `seleccionarOpcion` del componente y `keywords`
 * incluye lo que hay dentro de esa pantalla, para que el buscador la encuentre
 * escribiendo por ejemplo "mora" o "usuarios".
 */
export interface TarjetaModulo {
  id: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  claseIcono: string;
  textoAccion: string;
  permiso?: string;
  keywords: string[];
  tituloHtml?: SafeHtml | string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuModulosService {

  private permisosService = inject(PermisosService);
  private sanitizer = inject(DomSanitizer);

  // ============================================
  // CATÁLOGO ÚNICO
  // Lo consumen las pantallas de módulo (para las tarjetas) y
  // menu-arbol.service.ts (para armar el árbol del menú principal).
  // ============================================

  getModulos(): ModuloMenu[] {
    return [
      {
        id: 'clientes',
        label: 'Clientes',
        iconoArbol: '🎓',
        imagen: '/assets/images/clientes.png',
        permiso: 'clientes.ver',
        ruta: '/clientes/gestion',
        rutaLabel: 'Gestión de Clientes',
        rutaPermiso: 'clientes.gestion',
        keywords: ['empresas', 'instituciones', 'jardines', 'implementacion', 'implementación'],
        grupos: [
          {
            id: 'clientes',
            titulo: 'Clientes',
            descripcion: 'Administra los clientes, sus planes, grados, horarios y datos académicos',
            claseIcono: 'clientes',
            iconoArbol: '🎓',
            alt: 'Clientes',
            imagen: 'assets/images/clientes.png',
            permisos: ['clientes.administrar', 'clientes.listado'],
            keywords: ['empresas', 'instituciones', 'jardines', 'implementacion'],
            opciones: [
              { id: 'clientes', label: 'Gestión', alt: 'Gestión', imagen: 'assets/images/clientes.png', iconoArbol: '🎓', ruta: '/clientes', permiso: 'clientes.listado', keywords: ['listado', 'empresas', 'instituciones', 'jardines'] },
              { id: 'registro-rapido-cliente', label: 'Registro rápido', alt: 'Registro rápido', imagen: 'assets/images/registro-rapido-cliente.png', iconoArbol: '⚡', ruta: '/clientes/registro-rapido', permiso: 'clientes.administrar', keywords: ['registro rapido', 'rut', 'nit', 'razon social', 'implementacion', 'foto'] }
            ]
          }
        ]
      },
      {
        id: 'reportes',
        label: 'Reportes',
        iconoArbol: '📊',
        imagen: '/assets/images/detalle.png',
        permiso: 'reportes.ver',
        ruta: '/reportes',
        rutaLabel: 'Centro de Reportes',
        rutaPermiso: 'reportes.ver',
        keywords: ['informes', 'reporteria', 'estadisticas', 'tablero'],
        grupos: [
          {
            id: 'clientes',
            titulo: 'Clientes',
            descripcion: 'Información general de los clientes',
            claseIcono: 'clientes',
            iconoArbol: '🎓',
            alt: 'Clientes',
            imagen: 'assets/images/clientes.png',
            permisos: ['reportes.clientes_general'],
            keywords: ['empresas', 'instituciones', 'jardines'],
            opciones: [
              { id: 'clientes-general', label: 'Reporte General', alt: 'Reporte General', imagen: 'assets/images/reporte-clientes.png', iconoArbol: '📋', ruta: '/reportes/clientes-general', permiso: 'reportes.clientes_general', keywords: ['listado clientes', 'general', 'servicios contratados'] }
            ]
          },
          {
            id: 'financiero',
            titulo: 'Financiero',
            descripcion: 'Control financiero, cartera y pagos recibidos',
            claseIcono: 'financiero',
            iconoArbol: '💵',
            alt: 'Financiero',
            imagen: 'assets/images/finanzas.png',
            permisos: ['reportes.cartera', 'reportes.cobros_realizados', 'reportes.movimientos_financieros', 'reportes.pagos_recibidos', 'reportes.reportes_pago'],
            keywords: ['dinero', 'plata', 'finanzas', 'contabilidad'],
            opciones: [
              { id: 'cartera', label: 'Cartera', alt: 'Cartera', imagen: 'assets/images/cartera.png', iconoArbol: '💰', ruta: '/reportes/cartera', permiso: 'reportes.cartera', keywords: ['deudas', 'cuentas por cobrar', 'morosos', 'cobranza'] },
              { id: 'cobros-realizados', label: 'Cobros Realizados', alt: 'Cobros Realizados', imagen: 'assets/images/cobros-realizados.png', iconoArbol: '🧾', ruta: '/reportes/cobros-realizados', permiso: 'reportes.cobros_realizados', keywords: ['cobros', 'facturado', 'cuentas por cobrar', 'recaudo'] },
              { id: 'pagos-recibidos', label: 'Pagos Recibidos', alt: 'Pagos Recibidos', imagen: 'assets/images/pagos.png', iconoArbol: '💳', ruta: '/reportes/pagos-recibidos', permiso: 'reportes.pagos_recibidos', keywords: ['recaudo', 'abonos', 'comprobantes'] },
              { id: 'reportes-pago', label: 'Reportes de Pago', alt: 'Reportes de Pago', imagen: 'assets/images/reportar-pago.png', iconoArbol: '📑', ruta: '/reportes/reportes-pago', permiso: 'reportes.reportes_pago', keywords: ['soportes', 'consignaciones'] },
              { id: 'movimientos-financieros', label: 'Ingresos y Egresos', alt: 'Ingresos y Egresos', imagen: 'assets/images/finanzas.png', iconoArbol: '💹', ruta: '/reportes/movimientos-financieros', permiso: 'reportes.movimientos_financieros', keywords: ['movimientos financieros', 'gastos', 'flujo', 'plata', 'caja'] }
            ]
          },
          {
            id: 'colaboradores',
            titulo: 'Colaboradores',
            descripcion: 'Reportes de contabilización e historial de actividades',
            claseIcono: 'colaboradores',
            iconoArbol: '🧑‍💼',
            alt: 'Colaboradores',
            imagen: 'assets/images/colaboradores.png',
            permisos: ['reportes.contabilizaciones', 'reportes.historial_actividades'],
            keywords: ['empleados', 'personal', 'equipo'],
            opciones: [
              { id: 'reporte-contabilizaciones', label: 'Reportes de Contabilización', alt: 'Reportes Contabilización', imagen: 'assets/images/reportes_actividades_colaboradores.png', iconoArbol: '🧾', ruta: '/reportes/reporte-contabilizaciones', permiso: 'reportes.contabilizaciones', keywords: ['horas', 'actividades', 'pagos'] },
              { id: 'historial-actividades', label: 'Historial de Actividades', alt: 'Historial Actividades', imagen: 'assets/images/historial_actividades.png', iconoArbol: '📜', ruta: '/reportes/historial-actividades', permiso: 'reportes.historial_actividades', keywords: ['tareas', 'equipo', 'seguimiento'] }
            ]
          },
          {
            id: 'administracion',
            titulo: 'Administración',
            descripcion: 'Reportes administrativos generales',
            claseIcono: 'administracion',
            iconoArbol: '🗄️',
            alt: 'Administración',
            imagen: 'assets/images/administracion.png',
            permisos: ['dashboard.gerencial.listado'],
            keywords: ['gerencia', 'tablero'],
            opciones: [
              { id: 'dashboard-gerencial', label: 'Dashboard Gerencial', alt: 'Dashboard Gerencial', imagen: 'assets/images/dashboard-gerencial.png', iconoArbol: '📊', ruta: '/reportes/dashboard-gerencial', permiso: 'dashboard.gerencial.listado', columna: 'col-12', keywords: ['tablero', 'indicadores', 'gerencia'] }
            ]
          }
        ]
      },
      {
        id: 'operaciones',
        label: 'Operaciones',
        iconoArbol: '⚙️',
        imagen: '/assets/images/operaciones.png',
        permiso: 'operaciones.ver',
        ruta: '/operaciones',
        rutaLabel: 'Módulo Operaciones',
        rutaPermiso: 'operaciones.ver',
        keywords: ['operativo', 'dia a dia', 'gestion diaria'],
        grupos: [
          {
            id: 'inventario',
            titulo: 'Inventario',
            descripcion: 'Movimientos y salidas de productos',
            claseIcono: 'inventario',
            iconoArbol: '📦',
            alt: 'Inventario',
            imagen: 'assets/images/inventario.png',
            permisos: ['operaciones.movimientos_productos'],
            keywords: ['stock', 'bodega', 'almacen'],
            opciones: [
              { id: 'movimientos-inventario', label: 'Movimientos de Inventario', alt: 'Movimientos de Inventario', imagen: 'assets/images/movimientos-inventario.png', iconoArbol: '📦', ruta: '/operaciones/movimientos-productos', permiso: 'operaciones.movimientos_productos', keywords: ['inventario', 'stock', 'bodega', 'entradas', 'salidas'] }
            ]
          },
          {
            id: 'apoyo',
            titulo: 'Apoyo',
            descripcion: 'Registro y control de limpieza',
            claseIcono: 'apoyo',
            iconoArbol: '🧹',
            alt: 'Apoyo',
            imagen: 'assets/images/apoyo.png',
            permisos: ['operaciones.edicion_masiva_limpieza', 'operaciones.registro_masivo_limpieza', 'operaciones.registro_rapido_limpieza', 'operaciones.registros_limpieza', 'operaciones.reporte_aseo', 'operaciones.supervision_limpieza'],
            keywords: ['aseo', 'limpieza'],
            opciones: [
              { id: 'registros-limpieza', label: 'Registro de Limpieza', alt: 'Registro de Limpieza', imagen: 'assets/images/limpieza.png', iconoArbol: '🧼', ruta: '/operaciones/registros-limpieza', permiso: 'operaciones.registros_limpieza', keywords: ['aseo', 'limpieza'] },
              { id: 'registro-rapido-limpieza', label: 'Registro Rápido de Aseo', alt: 'Registro Rápido de Aseo', imagen: 'assets/images/registro_limpieza_rapido.png', iconoArbol: '⚡', ruta: '/operaciones/registro-rapido-limpieza', permiso: 'operaciones.registro_rapido_limpieza', keywords: ['aseo', 'limpieza', 'rapido', 'express'] },
              { id: 'registro-masivo-limpieza', label: 'Registro Masivo de Aseo', alt: 'Registro Masivo de Aseo', imagen: 'assets/images/registro_masivo_limpieza.png', iconoArbol: '📅', ruta: '/operaciones/registro-masivo-limpieza', permiso: 'operaciones.registro_masivo_limpieza', keywords: ['aseo', 'limpieza', 'masivo', 'rango', 'fechas', 'varios dias', 'lote'] },
              { id: 'edicion-masiva-limpieza', label: 'Edición Masiva de Aseo', alt: 'Edición Masiva de Aseo', imagen: 'assets/images/edicion_masiva_limpieza.png', iconoArbol: '✏️', ruta: '/operaciones/edicion-masiva-limpieza', permiso: 'operaciones.edicion_masiva_limpieza', keywords: ['aseo', 'limpieza', 'editar', 'edicion', 'masiva', 'lote', 'corregir', 'eliminar', 'borrar'] },
              { id: 'supervision-limpieza', label: 'Supervisión de Aseo', alt: 'Supervisión de Aseo', imagen: 'assets/images/supervision_limpieza.png', iconoArbol: '✅', ruta: '/operaciones/supervision-limpieza', permiso: 'operaciones.supervision_limpieza', keywords: ['aseo', 'limpieza', 'supervisar', 'supervision', 'aprobar'] },
              { id: 'reporte-aseo', label: 'Reporte de Aseo', alt: 'Reporte de Aseo', imagen: 'assets/images/reporte_aseo.png', iconoArbol: '📄', ruta: '/operaciones/reporte-aseo', permiso: 'operaciones.reporte_aseo', keywords: ['aseo', 'limpieza', 'reporte', 'informe', 'pdf'] }
            ]
          },
          {
            id: 'clientes',
            titulo: 'Clientes',
            descripcion: 'Gestión y seguimiento de clientes',
            claseIcono: 'clientes',
            iconoArbol: '🎓',
            alt: 'Clientes',
            imagen: 'assets/images/clientes.png',
            permisos: ['operaciones.recordatorios_generales'],
            keywords: ['avisos', 'seguimiento'],
            opciones: [
              { id: 'recordatorios-generales', label: 'Recordatorios Generales', alt: 'Recordatorios Generales', imagen: 'assets/images/recordatorio-pagos.png', iconoArbol: '📢', ruta: '/operaciones/recordatorios-generales', permiso: 'operaciones.recordatorios_generales', keywords: ['avisos', 'notificaciones', 'whatsapp', 'mensajes'] }
            ]
          },
          {
            id: 'financiero',
            titulo: 'Financiero',
            descripcion: 'Recordatorios de cobro y gestión de pagos',
            claseIcono: 'financiero',
            iconoArbol: '💵',
            alt: 'Financiero',
            imagen: 'assets/images/finanzas.png',
            permisos: ['operaciones.recordatorio_pagos'],
            keywords: ['cobros', 'cartera', 'whatsapp'],
            opciones: [
              { id: 'recordatorio-pagos', label: 'Recordatorio de Pagos', alt: 'Recordatorio de Pagos', imagen: 'assets/images/recordatorio-pagos.png', iconoArbol: '💬', ruta: '/operaciones/recordatorio-pagos', permiso: 'operaciones.recordatorio_pagos', columna: 'col-12', keywords: ['cobro', 'whatsapp', 'cartera', 'morosos'] }
            ]
          },
          {
            id: 'visitas',
            titulo: 'Visitas a Clientes',
            descripcion: 'Talleres en el jardín y cuestionarios del equipo',
            claseIcono: 'visitas',
            iconoArbol: '🏫',
            alt: 'Visitas a Clientes',
            imagen: 'assets/images/visitas.png',
            permisos: ['operaciones.visitas'],
            keywords: ['visita', 'taller', 'jardin', 'jardín', 'encuesta', 'cuestionario'],
            opciones: [
              { id: 'visitas', label: 'Visitas a Clientes', alt: 'Visitas a Clientes', imagen: 'assets/images/visitas.png', iconoArbol: '🏫', ruta: '/operaciones/visitas', permiso: 'operaciones.visitas', columna: 'col-12', keywords: ['visita', 'taller', 'enlace', 'encuesta', 'cuestionario', 'jardin', 'jardín'] }
            ]
          }
        ],
        // Migración no tiene tarjeta en la pantalla de Operaciones: solo se
        // llega desde el menú principal.
        opciones: [
          { id: 'migracion', label: 'Migración', iconoArbol: '📦', ruta: '/migracion/sesiones', permiso: 'migracion.listado', keywords: ['migracion', 'migración', 'carga de datos', 'cargue', 'montaje', 'cliente nuevo', 'implementacion', 'implementación', 'tenant', 'sembrar', 'procesos tenant'] }
        ]
      },
      {
        id: 'colaboradores',
        label: 'Colaboradores',
        iconoArbol: '🧑‍💼',
        imagen: '/assets/images/colaboradores.png',
        permiso: 'colaboradores.ver',
        ruta: '/colaboradores/gestion',
        rutaLabel: 'Gestión de Colaboradores',
        rutaPermiso: 'colaboradores.gestion',
        keywords: ['empleados', 'personal', 'trabajadores', 'staff'],
        grupos: [
          {
            id: 'colaboradores',
            titulo: 'Colaboradores',
            descripcion: 'Administra colaboradores, casas asignadas y actividades del equipo',
            claseIcono: 'colaboradores',
            iconoArbol: '👥',
            alt: 'Colaboradores',
            imagen: 'assets/images/colaboradores.png',
            permisos: ['colaboradores.actividades', 'colaboradores.listado'],
            keywords: ['empleados', 'personal', 'equipo'],
            opciones: [
              { id: 'colaboradores', label: 'Gestión', alt: 'Gestión', imagen: 'assets/images/colaboradores.png', iconoArbol: '🧑‍💼', ruta: '/colaboradores', permiso: 'colaboradores.listado', columna: 'col-4', keywords: ['listado', 'empleados', 'personal', 'staff'] },
              {
                id: 'actividades-colaboradores',
                label: 'Actividades',
                alt: 'Actividades',
                imagen: 'assets/images/actividades_colaboradores.png',
                iconoArbol: '📋',
                ruta: '/colaboradores/actividades',
                permiso: 'colaboradores.actividades',
                columna: 'col-4',
                keywords: ['tareas', 'equipo', 'agenda'],
                hijos: [
                  { id: 'colaboradores-calendario', label: 'Calendario de Actividades', iconoArbol: '📅', ruta: '/colaboradores/actividades/calendario', permiso: 'colaboradores.calendario', keywords: ['agenda', 'calendario'] },
                  { id: 'colaboradores-aprobacion', label: 'Aprobar Actividades', iconoArbol: '✅', ruta: '/colaboradores/actividades/aprobacion', permiso: 'colaboradores.aprobacion_actividades', keywords: ['aprobar', 'autorizar', 'permisos', 'horas adicionales'] },
                  { id: 'colaboradores-contabilizacion', label: 'Contabilizar Actividades', iconoArbol: '🧮', ruta: '/colaboradores/actividades/contabilizacion', permiso: 'colaboradores.contabilizacion_actividades', keywords: ['contabilizar', 'horas', 'pagos', 'nomina'] }
                ]
              }
            ]
          },
          {
            id: 'asistencia',
            titulo: 'Registro Ingreso / Salida',
            descripcion: 'Registra tu entrada y salida de jornada y descanso con geolocalización',
            claseIcono: 'asistencia',
            iconoArbol: '⏱️',
            icono: 'fas fa-fingerprint',
            keywords: ['marcacion', 'huella', 'entrada', 'salida', 'jornada'],
            opciones: [
              { id: 'registro-ingreso-salida', label: 'Registrar Ahora', icono: 'fas fa-clock', iconoEstilo: { 'font-size': '2rem', 'color': '#d4af37' }, iconoArbol: '⏱️', ruta: '/registro-ingreso-salida', columna: 'col-12', keywords: ['marcar', 'marcacion', 'entrada', 'salida', 'descanso', 'huella', 'registro ingreso'] }
            ]
          },
          {
            id: 'nomina',
            titulo: 'Nómina',
            descripcion: 'Gestiona las nóminas de colaboradores, crea periodos, procesa pagos y genera reportes',
            claseIcono: 'nomina',
            iconoArbol: '💰',
            alt: 'Nómina',
            imagen: 'assets/images/nomina.png',
            permisos: ['colaboradores.nominas'],
            keywords: ['sueldos', 'salarios', 'liquidacion'],
            opciones: [
              { id: 'nominas', label: 'Gestionar Nóminas', alt: 'Nóminas', imagen: 'assets/images/nomina.png', iconoArbol: '💰', ruta: '/colaboradores/nominas', permiso: 'colaboradores.nominas', columna: 'col-12', keywords: ['sueldos', 'salarios', 'pago empleados', 'periodos'] }
            ]
          }
        ]
      },
      {
        id: 'administracion',
        label: 'Administración',
        iconoArbol: '🏛️',
        imagen: '/assets/images/administracion.png',
        permiso: 'administracion.ver',
        ruta: '/administracion',
        rutaLabel: 'Módulo administración',
        rutaPermiso: 'administracion.ver',
        keywords: ['admin', 'configuracion', 'ajustes', 'parametros'],
        submodulos: ['datos-maestros', 'financiero'],
        grupos: [
          {
            id: 'operaciones',
            titulo: 'Operaciones',
            descripcion: 'Gestiona entes de control y sus consultas',
            claseIcono: 'operaciones',
            iconoArbol: '⚙️',
            alt: 'Operaciones',
            imagen: '/assets/images/administracion-operaciones.png',
            permisos: ['administracion.operaciones'],
            keywords: ['entes', 'control', 'operaciones'],
            opciones: [
              { id: 'entes-control', label: 'Entes de Control', alt: 'Entes de Control', imagen: '/assets/images/entes-control.png', iconoArbol: '🏛️', ruta: '/administracion/operaciones/entes-control', permiso: 'admin.entes_control', keywords: ['entes', 'control', 'vigilancia', 'secretaria', 'icbf'] },
              { id: 'consulta-entes-control', label: 'Consulta Entes de Control', alt: 'Consulta Entes de Control', imagen: '/assets/images/consulta-entes-control.png', iconoArbol: '🔎', ruta: '/administracion/operaciones/consulta-entes-control', permiso: 'admin.consulta_entes_control', keywords: ['consulta', 'entes', 'control', 'visita', 'documentos', 'reportes'] }
            ]
          }
        ]
      },
      {
        id: 'datos-maestros',
        label: 'Registro de Datos Maestros',
        iconoArbol: '🗃️',
        imagen: '/assets/images/datos-maestros.png',
        descripcion: 'Gestiona proveedores y productos del sistema',
        claseIcono: 'datos-maestros',
        textoAccion: 'Administrar',
        raiz: false,
        permiso: 'administracion.datos_maestros',
        ruta: '/administracion/datos-maestros',
        rutaLabel: 'Registro de Datos Maestros',
        rutaPermiso: 'administracion.datos_maestros',
        keywords: ['catalogos', 'parametros', 'maestros'],
        grupos: [
          {
            id: 'catalogos',
            titulo: 'Catálogos de Productos',
            descripcion: 'Gestiona productos, servicios y proveedores',
            claseIcono: 'catalogos',
            iconoArbol: '📦',
            alt: 'Catálogos',
            imagen: 'assets/images/catalogos-productos.png',
            permisos: ['admin.catalogos_productos'],
            keywords: ['inventario', 'compras', 'articulos', 'stock'],
            opciones: [
              { id: 'productos', label: 'Productos', alt: 'Productos', imagen: 'assets/images/productos.png', iconoArbol: '📦', ruta: '/administracion/datos-maestros/productos', permiso: 'admin.productos', keywords: ['inventario', 'articulos', 'insumos'] },
              { id: 'proveedores', label: 'Proveedores', alt: 'Proveedores', imagen: 'assets/images/proveedores.png', iconoArbol: '🚚', ruta: '/administracion/datos-maestros/proveedores', permiso: 'admin.proveedores', keywords: ['terceros', 'compras'] },
              { id: 'productos-servicios', label: 'Productos y Servicios', alt: 'Productos y Servicios', imagen: 'assets/images/productos_servicios.png', iconoArbol: '🛒', ruta: '/administracion/datos-maestros/productos-servicios', permiso: 'admin.productos_servicios', keywords: ['servicios', 'tarifas', 'precios', 'conceptos'] },
              { id: 'planes', label: 'Planes', alt: 'Planes', imagen: 'assets/images/planes.png', iconoArbol: '🏷️', ruta: '/administracion/datos-maestros/planes', permiso: 'admin.planes', keywords: ['tarifas', 'planes comerciales', 'plan fundador', 'precios'] },
              { id: 'productos-mobiliario', label: 'Productos Mobiliario', alt: 'Mobiliario', imagen: 'assets/images/productos-mobiliario.png', iconoArbol: '🪑', ruta: '/administracion/datos-maestros/productos-mobiliario', permiso: 'admin.productos_mobiliario', keywords: ['muebles', 'dotacion'] },
              { id: 'productos-limpieza', label: 'Productos Limpieza', alt: 'Limpieza', imagen: 'assets/images/productos-limpieza.png', iconoArbol: '🧹', ruta: '/administracion/datos-maestros/productos-limpieza', permiso: 'admin.productos_limpieza', keywords: ['aseo', 'insumos'] }
            ]
          },
          {
            id: 'infraestructura',
            titulo: 'Infraestructura y Espacios',
            descripcion: 'Administra áreas físicas y elementos del colegio',
            claseIcono: 'infraestructura',
            iconoArbol: '🏗️',
            alt: 'Infraestructura',
            imagen: 'assets/images/infraestructura-espacios.png',
            permisos: ['admin.areas_fisicas', 'admin.config_aseo', 'admin.elementos_fisicos'],
            keywords: ['salones', 'planta fisica', 'sedes', 'espacios'],
            opciones: [
              { id: 'areas-fisicas', label: 'Áreas Físicas', alt: 'Áreas Físicas', imagen: 'assets/images/areas_fisicas.png', iconoArbol: '🏗️', ruta: '/administracion/datos-maestros/areas-fisicas', permiso: 'admin.areas_fisicas', keywords: ['espacios', 'salones', 'zonas'] },
              { id: 'elementos-fisicos', label: 'Elementos Físicos', alt: 'Elementos Físicos', imagen: 'assets/images/elementos-fisicos.png', iconoArbol: '🔧', ruta: '/administracion/datos-maestros/elementos-fisicos', permiso: 'admin.elementos_fisicos', keywords: ['activos', 'dotacion', 'equipos'] },
              { id: 'config-aseo', label: 'Configuración de Aseo', alt: 'Configuración de Aseo', imagen: 'assets/images/config_aseo.png', iconoArbol: '🧹', ruta: '/administracion/datos-maestros/config-aseo', permiso: 'admin.config_aseo', keywords: ['aseo', 'limpieza', 'procesos', 'configurar', 'masiva', 'frecuencia', 'tiempos', 'dias'] }
            ]
          },
          {
            id: 'plantillas',
            titulo: 'Plantillas',
            descripcion: 'Gestiona plantillas institucionales',
            claseIcono: 'plantillas',
            iconoArbol: '📃',
            alt: 'Plantillas',
            imagen: 'assets/images/plantillas.png',
            permisos: ['admin.plantillas'],
            keywords: ['contratos', 'minutas', 'documentos', 'textos'],
            opciones: [
              { id: 'plantillas-institucionales', label: 'Institucionales', alt: 'Institucionales', imagen: 'assets/images/plantillas_institucionales.png', iconoArbol: '📃', ruta: '/administracion/datos-maestros/plantillas', permiso: 'admin.plantillas', columna: 'col-12', keywords: ['contratos', 'minutas', 'documentos', 'clausulas'] }
            ]
          },
          {
            id: 'configuracion',
            titulo: 'Configuración',
            descripcion: 'Gestiona parámetros globales del sistema',
            claseIcono: 'configuracion',
            iconoArbol: '⚙️',
            alt: 'Configuración',
            imagen: 'assets/images/configuracion.png',
            permisos: ['admin.cargos', 'admin.configuracion_global', 'admin.configuracion_ia', 'admin.institucion', 'admin.tipos_documentos'],
            keywords: ['parametros', 'ajustes', 'setup'],
            opciones: [
              { id: 'configuracion-global', label: 'Configuración Global', alt: 'Configuración Global', imagen: 'assets/images/configuracion.png', iconoArbol: '⚙️', ruta: '/administracion/datos-maestros/configuracion-global', permiso: 'admin.configuracion_global', keywords: ['parametros', 'ajustes'] },
              { id: 'cargos', label: 'Cargos', alt: 'Cargos', imagen: 'assets/images/cargos.png', iconoArbol: '💼', ruta: '/administracion/datos-maestros/cargos', permiso: 'admin.cargos', keywords: ['puestos', 'colaboradores'] },
              { id: 'tipos-documentos', label: 'Tipos de Documentos', alt: 'Tipos de Documentos', imagen: 'assets/images/tipos-documentos.png', iconoArbol: '📄', ruta: '/administracion/datos-maestros/tipos-documentos', permiso: 'admin.tipos_documentos', keywords: ['documentos', 'papeles', 'requisitos'] },
              { id: 'configuracion-ia', label: 'Configuración IA', alt: 'Configuración IA', imagen: 'assets/images/configuracion-ia.png', iconoArbol: '🤖', ruta: '/administracion/datos-maestros/configuracion-ia', permiso: 'admin.configuracion_ia', keywords: ['ia', 'inteligencia artificial', 'proveedores'] },
              { id: 'institucion', label: 'Institución', alt: 'Institución', imagen: 'assets/images/institucion.png', iconoArbol: '🏫', ruta: '/administracion/datos-maestros/institucion', permiso: 'admin.institucion', keywords: ['institucion', 'datos basicos', 'logo', 'documentos institucionales', 'plan de emergencia'] }
            ]
          },
          {
            id: 'seguridad',
            titulo: 'Seguridad',
            descripcion: 'Gestiona usuarios, roles y permisos',
            claseIcono: 'seguridad',
            iconoArbol: '🔐',
            alt: 'Seguridad',
            imagen: 'assets/images/seguridad.png',
            permisos: ['admin.documentacion', 'admin.permisos_rol', 'admin.usuarios', 'admin.roles', 'admin.usuarios_x_rol'],
            keywords: ['accesos', 'claves', 'perfiles', 'roles'],
            opciones: [
              { id: 'usuarios', label: 'Usuarios', alt: 'Usuarios', imagen: 'assets/images/usuarios.png', iconoArbol: '👤', ruta: '/administracion/datos-maestros/usuarios', permiso: 'admin.usuarios', keywords: ['cuentas', 'accesos', 'login', 'claves'] },
              { id: 'roles', label: 'Roles', alt: 'Roles', imagen: 'assets/images/roles.png', iconoArbol: '🎭', ruta: '/administracion/datos-maestros/roles', permiso: 'admin.roles', keywords: ['perfiles', 'cargos de sistema'] },
              { id: 'usuarios-x-rol', label: 'Usuarios por Rol', alt: 'Usuarios por Rol', imagen: 'assets/images/roles.png', iconoArbol: '👥', ruta: '/administracion/datos-maestros/usuarios-x-rol', permiso: 'admin.usuarios_x_rol', keywords: ['asignar usuarios', 'asignacion masiva'] },
              { id: 'permisos', label: 'Permisos por Rol', alt: 'Permisos', imagen: 'assets/images/permisos.png', iconoArbol: '🔐', ruta: '/administracion/datos-maestros/permisos', permiso: 'admin.permisos_rol', keywords: ['roles', 'permisos', 'accesos', 'opciones'] },
              { id: 'documentacion-sistema', label: 'Documentación', alt: 'Documentación', imagen: 'assets/images/documentacion_configuracion.png', iconoArbol: '📖', ruta: '/administracion/datos-maestros/documentacion-sistema', permiso: 'admin.documentacion', keywords: ['ayuda', 'manual', 'opciones del sistema'] }
            ]
          }
        ]
      },
      {
        id: 'financiero',
        label: 'Módulo Financiero',
        iconoArbol: '💵',
        imagen: '/assets/images/finanzas.png',
        descripcion: 'Gestiona ingresos, egresos y reportes financieros',
        claseIcono: 'financiero',
        textoAccion: 'Administrar',
        raiz: false,
        permiso: 'administracion.financiero',
        ruta: '/administracion/financiero',
        rutaLabel: 'Módulo Financiero',
        rutaPermiso: 'administracion.financiero',
        keywords: ['dinero', 'plata', 'finanzas', 'contabilidad'],
        grupos: [
          {
            id: 'ingresos-egresos',
            titulo: 'Ingresos y Egresos',
            descripcion: 'Gestiona y aprueba movimientos financieros',
            claseIcono: 'ingresos-egresos',
            iconoArbol: '💸',
            alt: 'Ingresos y Egresos',
            imagen: 'assets/images/ingresos-egresos.png',
            permisos: ['admin.movimientos_financieros', 'admin.aprobacion_multiple'],
            keywords: ['gastos', 'movimientos', 'caja'],
            opciones: [
              { id: 'movimientos', label: 'Gestión Ingresos y Egresos', alt: 'Gestión Movimientos', imagen: 'assets/images/finanzas.png', iconoArbol: '💸', ruta: '/administracion/financiero/movimientos-financieros', permiso: 'admin.movimientos_financieros', keywords: ['ingresos', 'egresos', 'gastos', 'movimientos financieros'] },
              { id: 'aprobacion-multiple', label: 'Aprobación Ingresos y Egresos', alt: 'Aprobación', imagen: 'assets/images/aprobar.png', iconoArbol: '✅', ruta: '/administracion/financiero/aprobacion-multiple', permiso: 'admin.aprobacion_multiple', keywords: ['aprobar', 'autorizar', 'aprobacion multiple'] }
            ]
          },
          {
            id: 'pagos-institucionales',
            titulo: 'Pagos Institucionales',
            descripcion: 'Registro rápido y contabilización de pagos',
            claseIcono: 'pagos-institucionales',
            iconoArbol: '🧾',
            alt: 'Pagos Institucionales',
            imagen: 'assets/images/pagos-institucionales.png',
            permisos: ['admin.registro_pagos_rapido', 'admin.contabilizacion_multiple'],
            keywords: ['recaudo', 'cobros', 'cartera'],
            opciones: [
              { id: 'registro-pagos-rapido', label: 'Registro Rápido de Pagos', alt: 'Registro Rápido', imagen: 'assets/images/registro-pagos-rapido.png', iconoArbol: '⚡', ruta: '/administracion/financiero/registro-pagos-rapido', permiso: 'admin.registro_pagos_rapido', keywords: ['recaudo', 'pagos', 'abonos', 'masivo'] },
              { id: 'contabilizar-pagos', label: 'Contabilización de Pagos', alt: 'Contabilizar', imagen: 'assets/images/contabilizar.png', iconoArbol: '🧮', ruta: '/administracion/financiero/contabilizacion-multiple', permiso: 'admin.contabilizacion_multiple', keywords: ['contabilizar', 'contabilidad', 'conciliacion', 'contabilizacion multiple'] }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Devuelve la definición de un módulo por su id.
   */
  getModulo(id: string): ModuloMenu | undefined {
    return this.getModulos().find((modulo) => modulo.id === id);
  }

  /**
   * Devuelve las tarjetas de un módulo. Es lo que consumen las pantallas.
   */
  getGrupos(idModulo: string): GrupoMenuModulo[] {
    return this.getModulo(idModulo)?.grupos ?? [];
  }

  // Accesos por módulo: se conservan para no cambiar la forma en que
  // las pantallas piden sus tarjetas.
  getOperaciones(): GrupoMenuModulo[] { return this.getGrupos('operaciones'); }
  getReportes(): GrupoMenuModulo[] { return this.getGrupos('reportes'); }
  getDatosMaestros(): GrupoMenuModulo[] { return this.getGrupos('datos-maestros'); }
  getFinanciero(): GrupoMenuModulo[] { return this.getGrupos('financiero'); }
  getGestionClientes(): GrupoMenuModulo[] { return this.getGrupos('clientes'); }
  getGestionColaboradores(): GrupoMenuModulo[] { return this.getGrupos('colaboradores'); }

  /**
   * Devuelve las tarjetas simples de una pantalla que no tiene submenús: primero los
   * módulos que cuelgan de ella y después sus opciones sueltas. Las keywords de cada
   * tarjeta incluyen lo que hay dentro de esa pantalla.
   */
  getTarjetas(idModulo: string): TarjetaModulo[] {
    const modulo = this.getModulo(idModulo);
    if (!modulo) {
      return [];
    }

    const tarjetas: TarjetaModulo[] = [];

    for (const idSubmodulo of modulo.submodulos ?? []) {
      const submodulo = this.getModulo(idSubmodulo);
      if (!submodulo) {
        continue;
      }
      tarjetas.push({
        id: submodulo.idTarjeta || submodulo.id,
        titulo: submodulo.rutaLabel || submodulo.label,
        descripcion: submodulo.descripcion ?? '',
        imagen: submodulo.imagen,
        claseIcono: submodulo.claseIcono ?? submodulo.id,
        textoAccion: submodulo.textoAccion ?? 'Administrar',
        permiso: submodulo.permiso,
        keywords: [...(submodulo.keywords ?? []), ...this.terminosInternos(submodulo)]
      });
    }

    for (const opcion of modulo.opciones ?? []) {
      tarjetas.push({
        id: opcion.id,
        titulo: opcion.label,
        descripcion: opcion.descripcion ?? '',
        imagen: opcion.imagen,
        claseIcono: opcion.claseIcono ?? opcion.id,
        textoAccion: opcion.textoAccion ?? 'Administrar',
        permiso: opcion.permiso,
        keywords: [...(opcion.keywords ?? [])]
      });
    }

    return tarjetas;
  }

  /**
   * Recorre las tarjetas y opciones de un módulo y devuelve sus textos, para que
   * buscando "mora" o "usuarios" en Administración aparezca el módulo que las contiene.
   */
  private terminosInternos(modulo: ModuloMenu): string[] {
    const terminos: string[] = [];

    const recorrerOpcion = (opcion: OpcionMenuModulo): void => {
      terminos.push(opcion.label);
      terminos.push(...(opcion.keywords ?? []));
      for (const hijo of opcion.hijos ?? []) {
        recorrerOpcion(hijo);
      }
    };

    for (const grupo of modulo.grupos) {
      terminos.push(grupo.titulo);
      terminos.push(...(grupo.keywords ?? []));
      grupo.opciones.forEach(recorrerOpcion);
    }

    (modulo.opciones ?? []).forEach(recorrerOpcion);

    return terminos;
  }

  // ============================================
  // FILTRADO
  // ============================================

  /**
   * Devuelve una copia de los grupos visibles según permisos.
   * Reglas: el grupo se conserva si no declara `permisos` o si el usuario tiene alguno
   * (equivale al `tieneAlguno` que ya usaban los componentes); dentro del grupo se
   * conservan las opciones sin permiso y aquellas cuyo permiso tiene el usuario.
   * Un grupo sin opciones visibles se conserva, igual que hoy, para no cambiar la pantalla.
   */
  filtrarPorPermiso(grupos: GrupoMenuModulo[]): GrupoMenuModulo[] {
    return grupos
      .filter((grupo) => !grupo.permisos || grupo.permisos.length === 0 || grupo.permisos.some((p) => this.permisosService.tienePermiso(p)))
      .map((grupo) => ({
        ...grupo,
        opciones: grupo.opciones.filter((opcion) => !opcion.permiso || this.permisosService.tienePermiso(opcion.permiso))
      }));
  }

  /**
   * Filtra los grupos por el término escrito. Si el grupo coincide por sí mismo
   * (título, descripción o keywords) se conserva completo; si no, se conserva solo
   * con las opciones que coinciden. El término se resalta en el título y en los labels.
   */
  filtrarPorTexto(grupos: GrupoMenuModulo[], termino: string): GrupoMenuModulo[] {
    const resultado: GrupoMenuModulo[] = [];

    for (const grupo of grupos) {
      const grupoCoincide = this.coincideGrupo(grupo, termino);
      const opciones = grupoCoincide
        ? grupo.opciones
        : grupo.opciones.filter((opcion) => this.coincideOpcion(opcion, termino));

      if (!grupoCoincide && opciones.length === 0) {
        continue;
      }

      resultado.push({
        ...grupo,
        tituloHtml: this.resaltar(grupo.titulo, termino),
        opciones: opciones.map((opcion) => ({ ...opcion, labelHtml: this.resaltar(opcion.label, termino) }))
      });
    }

    return resultado;
  }

  /**
   * Deja solo las tarjetas cuyo permiso tiene el usuario. Las que no declaran permiso
   * se muestran siempre.
   */
  filtrarTarjetasPorPermiso(tarjetas: TarjetaModulo[]): TarjetaModulo[] {
    return tarjetas.filter((tarjeta) => !tarjeta.permiso || this.permisosService.tienePermiso(tarjeta.permiso));
  }

  /**
   * Filtra las tarjetas simples por el término escrito, mirando también lo que hay
   * dentro de cada pantalla. Resalta el término en el título.
   */
  filtrarTarjetasPorTexto(tarjetas: TarjetaModulo[], termino: string): TarjetaModulo[] {
    const t = this.normalizar(termino);

    return tarjetas
      .filter((tarjeta) =>
        this.normalizar(tarjeta.titulo).includes(t) ||
        this.normalizar(tarjeta.descripcion).includes(t) ||
        tarjeta.keywords.some((k) => this.normalizar(k).includes(t)))
      .map((tarjeta) => ({ ...tarjeta, tituloHtml: this.resaltar(tarjeta.titulo, termino) }));
  }

  /**
   * Quita tildes y pasa a minúsculas para comparar de forma insensible a acentos.
   */
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /**
   * Igual que normalizar, pero carácter por carácter, de modo que la cadena resultante
   * conserva la longitud y las posiciones de la original.
   * Se usa en resaltar() para ubicar la coincidencia sobre el texto aunque tenga tildes.
   */
  private normalizarPosicional(texto: string): string {
    return Array.from(texto)
      .map((c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || c)
      .join('')
      .toLowerCase();
  }

  private coincideGrupo(grupo: GrupoMenuModulo, termino: string): boolean {
    const t = this.normalizar(termino);
    if (this.normalizar(grupo.titulo).includes(t) || this.normalizar(grupo.descripcion).includes(t)) {
      return true;
    }
    return !!grupo.keywords && grupo.keywords.some((k) => this.normalizar(k).includes(t));
  }

  private coincideOpcion(opcion: OpcionMenuModulo, termino: string): boolean {
    const t = this.normalizar(termino);
    if (this.normalizar(opcion.label).includes(t)) {
      return true;
    }
    if (opcion.alt && this.normalizar(opcion.alt).includes(t)) {
      return true;
    }
    return !!opcion.keywords && opcion.keywords.some((k) => this.normalizar(k).includes(t));
  }

  /**
   * Envuelve la coincidencia en <mark>. Los textos del menú son estáticos,
   * por eso es seguro renderizar el HTML resultante.
   * El estilo va en línea (mismo dorado del menú principal) para no depender
   * del SCSS de ningún componente.
   */
  private resaltar(texto: string, termino: string): SafeHtml | string {
    const buscado = termino.trim();
    if (buscado.length === 0) {
      return texto;
    }

    const indice = this.normalizarPosicional(texto).indexOf(this.normalizarPosicional(buscado));
    if (indice < 0) {
      return texto;
    }

    const antes = texto.substring(0, indice);
    const match = texto.substring(indice, indice + buscado.length);
    const despues = texto.substring(indice + buscado.length);
    return this.sanitizer.bypassSecurityTrustHtml(
      `${antes}<mark style="background:#FFC107;color:#1A1A1A;border-radius:3px;padding:0 2px;font-weight:700;">${match}</mark>${despues}`
    );
  }
}