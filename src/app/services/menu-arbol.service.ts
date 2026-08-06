import { Injectable } from '@angular/core';

/**
 * Nodo del árbol de menú.
 * - Si tiene `ruta` es una hoja navegable.
 * - Si tiene `hijos` es un grupo expandible.
 * - `permiso` (opcional) gatea la visibilidad; los nodos sin permiso se muestran siempre.
 * - `keywords` (opcional) son términos alternativos para que la búsqueda encuentre el nodo
 *   aunque el usuario escriba una palabra distinta al label.
 */
export interface MenuNodo {
  id: string;
  label: string;
  icono: string;
  imagen?: string;
  ruta?: string;
  permiso?: string;
  keywords?: string[];
  hijos?: MenuNodo[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuArbolService {

  /**
   * Devuelve el árbol completo del menú.
   * Por ahora está declarado en código; más adelante se reemplaza por una
   * consulta a la tabla del menú sin cambiar la firma de este método.
   */
  getArbol(): MenuNodo[] {
    return [
      {
        id: 'estudiantes',
        label: 'Estudiantes',
        icono: '🎓',
        imagen: '/assets/images/estudiantes.png',
        permiso: 'estudiantes.ver',
        keywords: ['alumnos', 'niños', 'matricula', 'matrícula', 'estudiantado', 'parvulos'],
        hijos: [
          {
            id: 'estudiantes-gestion',
            label: 'Gestión',
            icono: '🎓',
            keywords: ['alumnos', 'niños', 'matricula'],
            hijos: [
              { id: 'estudiantes-gestion-estudiantes', label: 'Gestión Estudiantes', icono: '🎓', ruta: '/estudiantes/gestion', permiso: 'estudiantes.gestion', keywords: ['alumnos', 'niños', 'matricula', 'registro rapido', 'registro civil'] },
              { id: 'estudiantes-registro-rapido', label: 'Registro Rápido', icono: '⚡', ruta: '/estudiantes/registro-rapido', permiso: 'estudiantes.administrar', keywords: ['registro rapido', 'registro civil', 'matricula', 'nuip', 'foto'] },
              { id: 'estudiantes-listado', label: 'Estudiantes', icono: '🎓', ruta: '/estudiantes', permiso: 'estudiantes.listado', keywords: ['alumnos', 'niños', 'estudiantado', 'parvulos'] }
            ]
          }
        ]
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icono: '📊',
        imagen: '/assets/images/detalle.png',
        permiso: 'reportes.ver',
        keywords: ['informes', 'reporteria', 'estadisticas', 'tablero'],
        hijos: [
          { id: 'reportes-inicio', label: 'Reportes', icono: '📊', ruta: '/reportes', permiso: 'reportes.ver' },
          {
            id: 'reportes-financieros',
            label: 'Financieros',
            icono: '💵',
            keywords: ['dinero', 'plata', 'finanzas'],
            hijos: [
              { id: 'reportes-cartera', label: 'Reporte Cartera', icono: '💰', ruta: '/reportes/cartera', permiso: 'reportes.cartera', keywords: ['deudas', 'cuentas por cobrar', 'morosos', 'cobranza'] },
              { id: 'reportes-mov-financieros', label: 'Ingresos y Egresos', icono: '💹', ruta: '/reportes/movimientos-financieros', permiso: 'reportes.movimientos_financieros', keywords: ['movimientos financieros', 'gastos', 'flujo', 'plata'] },
              { id: 'reportes-pagos', label: 'Reporte Pagos', icono: '💳', ruta: '/reportes/pagos-recibidos', permiso: 'reportes.pagos_recibidos', keywords: ['pagos recibidos', 'recaudo'] },
              { id: 'reportes-cobros', label: 'Cobros Realizados', icono: '🧾', ruta: '/reportes/cobros-realizados', permiso: 'reportes.cobros_realizados', keywords: ['cobros', 'recaudo'] },
              { id: 'reportes-reportes-pago', label: 'Reportes de Pago', icono: '📑', ruta: '/reportes/reportes-pago', permiso: 'reportes.reportes_pago' },
              { id: 'reportes-dashboard-gerencial', label: 'Dashboard Gerencial', icono: '📊', ruta: '/reportes/dashboard-gerencial', permiso: 'dashboard.gerencial.listado', keywords: ['indicadores', 'gerencia', 'tablero'] }
            ]
          },
          {
            id: 'reportes-colaboradores',
            label: 'Colaboradores',
            icono: '🧑‍💼',
            keywords: ['empleados', 'personal'],
            hijos: [
              { id: 'reportes-colab-contabilizaciones', label: 'Reporte Contabilizaciones', icono: '🧾', ruta: '/reportes/reporte-contabilizaciones', permiso: 'reportes.contabilizaciones' },
              { id: 'reportes-colab-historial', label: 'Historial Actividades', icono: '📜', ruta: '/reportes/historial-actividades', permiso: 'reportes.historial_actividades' }
            ]
          },
          {
            id: 'reportes-operativos',
            label: 'Operativos',
            icono: '📋',
            hijos: [
              { id: 'reportes-estudiantes-general', label: 'Reporte Estudiantes', icono: '📋', ruta: '/reportes/estudiantes-general', permiso: 'reportes.estudiantes_general', keywords: ['listado estudiantes', 'alumnos'] }
            ]
          }
        ]
      },
      {
        id: 'operaciones',
        label: 'Operaciones',
        icono: '⚙️',
        imagen: '/assets/images/operaciones.png',
        permiso: 'operaciones.ver',
        keywords: ['operativo', 'dia a dia', 'gestion diaria'],
        hijos: [
          {
            id: 'operaciones-productos',
            label: 'Productos',
            icono: '📦',
            keywords: ['inventario', 'stock', 'bodega'],
            hijos: [
              { id: 'operaciones-mov-productos', label: 'Movimientos Productos', icono: '📦', ruta: '/operaciones/movimientos-productos', permiso: 'operaciones.movimientos_productos', keywords: ['inventario', 'stock', 'bodega'] },
              { id: 'operaciones-registros-limpieza', label: 'Registros Limpieza', icono: '🧼', ruta: '/operaciones/registros-limpieza', permiso: 'operaciones.registros_limpieza', keywords: ['aseo', 'limpieza'] },
              { id: 'operaciones-registro-rapido-limpieza', label: 'Registro Rápido de Aseo', icono: '⚡', ruta: '/operaciones/registro-rapido-limpieza', permiso: 'operaciones.registro_rapido_limpieza', keywords: ['aseo', 'limpieza', 'rapido', 'express'] },
              { id: 'operaciones-registro-masivo-limpieza', label: 'Registro Masivo de Aseo', icono: '📅', ruta: '/operaciones/registro-masivo-limpieza', permiso: 'operaciones.registro_masivo_limpieza', keywords: ['aseo', 'limpieza', 'masivo', 'rango', 'fechas', 'varios dias', 'lote'] },
              { id: 'operaciones-edicion-masiva-limpieza', label: 'Edición Masiva de Aseo', icono: '✏️', ruta: '/operaciones/edicion-masiva-limpieza', permiso: 'operaciones.edicion_masiva_limpieza', keywords: ['aseo', 'limpieza', 'editar', 'edicion', 'masiva', 'lote', 'corregir', 'eliminar', 'borrar'] },
              { id: 'operaciones-supervision-limpieza', label: 'Supervisión de Aseo', icono: '✅', ruta: '/operaciones/supervision-limpieza', permiso: 'operaciones.supervision_limpieza', keywords: ['aseo', 'limpieza', 'supervisar', 'supervision', 'aprobar'] },
              { id: 'operaciones-reporte-aseo', label: 'Reporte de Aseo', icono: '📄', ruta: '/operaciones/reporte-aseo', permiso: 'operaciones.reporte_aseo', keywords: ['aseo', 'limpieza', 'reporte', 'informe', 'pdf'] }
            ]
          },
          {
            id: 'operaciones-comunicaciones',
            label: 'Comunicaciones y Seguimiento',
            icono: '📢',
            keywords: ['whatsapp', 'avisos', 'notificaciones'],
            hijos: [
              { id: 'operaciones-recordatorios-generales', label: 'Recordatorios Generales', icono: '📢', ruta: '/operaciones/recordatorios-generales', permiso: 'operaciones.recordatorios_generales', keywords: ['avisos', 'notificaciones', 'whatsapp'] }
            ]
          }
        ]
      },
      {
        id: 'colaboradores',
        label: 'Colaboradores',
        icono: '🧑‍💼',
        imagen: '/assets/images/colaboradores.png',
        permiso: 'colaboradores.ver',
        keywords: ['empleados', 'personal', 'trabajadores', 'staff'],
        hijos: [
          {
            id: 'colaboradores-gestion',
            label: 'Gestión',
            icono: '👥',
            keywords: ['empleados', 'personal'],
            hijos: [
              { id: 'colaboradores-gestion-colab', label: 'Gestión Colaboradores', icono: '👥', ruta: '/colaboradores/gestion', permiso: 'colaboradores.gestion', keywords: ['empleados', 'personal', 'staff'] },
              { id: 'colaboradores-listado', label: 'Colaboradores', icono: '🧑‍💼', ruta: '/colaboradores', permiso: 'colaboradores.listado', keywords: ['empleados', 'personal'] },
              { id: 'colaboradores-registro-ingreso-salida', label: 'Registro Ingreso / Salida', icono: '⏱️', ruta: '/registro-ingreso-salida', keywords: ['marcacion', 'entrada', 'salida', 'huella'] }
            ]
          },
          {
            id: 'colaboradores-actividades',
            label: 'Actividades',
            icono: '📋',
            keywords: ['tareas', 'agenda'],
            hijos: [
              { id: 'colaboradores-act-colab', label: 'Actividades Colaboradores', icono: '📋', ruta: '/colaboradores/actividades', permiso: 'colaboradores.actividades', keywords: ['tareas'] },
              { id: 'colaboradores-calendario', label: 'Calendario Colaboradores', icono: '📅', ruta: '/colaboradores/actividades/calendario', permiso: 'colaboradores.calendario', keywords: ['agenda'] },
              { id: 'colaboradores-aprobacion-act', label: 'Aprobación Actividades', icono: '✅', ruta: '/colaboradores/actividades/aprobacion', permiso: 'colaboradores.aprobacion_actividades', keywords: ['aprobar'] },
              { id: 'colaboradores-contab-act', label: 'Contabilización Actividades', icono: '🧮', ruta: '/colaboradores/actividades/contabilizacion', permiso: 'colaboradores.contabilizacion_actividades', keywords: ['contabilizar'] }
            ]
          },
          {
            id: 'colaboradores-nomina',
            label: 'Nómina',
            icono: '💰',
            keywords: ['sueldos', 'salarios'],
            hijos: [
              { id: 'colaboradores-nominas', label: 'Nóminas', icono: '💰', ruta: '/colaboradores/nominas', permiso: 'colaboradores.nominas', keywords: ['sueldos', 'salarios', 'pago empleados'] }
            ]
          }
        ]
      },
      {
        id: 'administracion',
        label: 'Administración',
        icono: '🏛️',
        imagen: '/assets/images/administracion.png',
        permiso: 'administracion.ver',
        keywords: ['admin', 'configuracion', 'ajustes', 'parametros'],
        hijos: [
          { id: 'administracion-inicio', label: 'Administración', icono: '🏛️', ruta: '/administracion', permiso: 'administracion.ver' },
          { id: 'administracion-datos-maestros', label: 'Datos Maestros', icono: '🗃️', ruta: '/administracion/datos-maestros', permiso: 'administracion.datos_maestros', keywords: ['catalogos', 'parametros'] },
          {
            id: 'administracion-operaciones',
            label: 'Operaciones',
            icono: '⚙️',
            keywords: ['operaciones', 'entes', 'control'],
            hijos: [
              { id: 'administracion-oper-inicio', label: 'Operaciones', icono: '⚙️', ruta: '/administracion/operaciones', permiso: 'administracion.operaciones' },
              { id: 'administracion-entes-control', label: 'Entes de Control', icono: '🏛️', ruta: '/administracion/operaciones/entes-control', permiso: 'admin.entes_control', keywords: ['entes', 'control', 'vigilancia', 'secretaria', 'icbf'] },
              { id: 'administracion-consulta-entes-control', label: 'Consulta Entes de Control', icono: '🔎', ruta: '/administracion/operaciones/consulta-entes-control', permiso: 'admin.consulta_entes_control', keywords: ['consulta', 'entes', 'control', 'visita', 'documentos', 'reportes'] }
            ]
          },
          {
            id: 'administracion-financiero',
            label: 'Financiero',
            icono: '💵',
            keywords: ['dinero', 'plata', 'finanzas'],
            hijos: [
              { id: 'administracion-fin-inicio', label: 'Financiero', icono: '💵', ruta: '/administracion/financiero', permiso: 'administracion.financiero' },
              { id: 'administracion-fin-movimientos', label: 'Movimientos Financieros', icono: '💸', ruta: '/administracion/financiero/movimientos-financieros', permiso: 'admin.movimientos_financieros', keywords: ['ingresos', 'egresos', 'gastos'] },
              { id: 'administracion-fin-aprobacion', label: 'Aprobación Múltiple', icono: '✅', ruta: '/administracion/financiero/aprobacion-multiple', permiso: 'admin.aprobacion_multiple', keywords: ['aprobar'] },
              { id: 'administracion-fin-registro-pagos', label: 'Registro Pagos Rápido', icono: '⚡', ruta: '/administracion/financiero/registro-pagos-rapido', permiso: 'admin.registro_pagos_rapido', keywords: ['recaudo', 'pagos'] },
              { id: 'administracion-fin-contab-multiple', label: 'Contabilización Múltiple', icono: '🧮', ruta: '/administracion/financiero/contabilizacion-multiple', permiso: 'admin.contabilizacion_multiple', keywords: ['contabilizar'] }
            ]
          },
          {
            id: 'administracion-productos',
            label: 'Productos e Inventario',
            icono: '📦',
            keywords: ['inventario', 'stock', 'bodega'],
            hijos: [
              { id: 'administracion-prod', label: 'Productos', icono: '📦', ruta: '/administracion/datos-maestros/productos', permiso: 'admin.productos', keywords: ['inventario', 'articulos'] },
              { id: 'administracion-prod-servicios', label: 'Productos y Servicios', icono: '🛒', ruta: '/administracion/datos-maestros/productos-servicios', permiso: 'admin.productos_servicios', keywords: ['servicios', 'tarifas', 'precios'] },
              { id: 'administracion-prod-mobiliario', label: 'Productos Mobiliario', icono: '🪑', ruta: '/administracion/datos-maestros/productos-mobiliario', permiso: 'admin.productos_mobiliario', keywords: ['muebles'] },
              { id: 'administracion-prod-limpieza', label: 'Productos Limpieza', icono: '🧹', ruta: '/administracion/datos-maestros/productos-limpieza', permiso: 'admin.productos_limpieza', keywords: ['aseo'] },
              { id: 'administracion-proveedores', label: 'Proveedores', icono: '🚚', ruta: '/administracion/datos-maestros/proveedores', permiso: 'admin.proveedores', keywords: ['compras'] },
              { id: 'administracion-areas-fisicas', label: 'Áreas Físicas', icono: '🏗️', ruta: '/administracion/datos-maestros/areas-fisicas', permiso: 'admin.areas_fisicas', keywords: ['espacios', 'salones'] },
              { id: 'administracion-elementos-fisicos', label: 'Elementos Físicos', icono: '🔧', ruta: '/administracion/datos-maestros/elementos-fisicos', permiso: 'admin.elementos_fisicos', keywords: ['activos'] },
              { id: 'administracion-config-aseo', label: 'Configuración de Aseo', icono: '🧹', ruta: '/administracion/datos-maestros/config-aseo', permiso: 'admin.config_aseo', keywords: ['aseo', 'limpieza', 'procesos', 'configurar', 'masiva', 'tiempos', 'dias'] }
            ]
          },
          {
            id: 'administracion-configuracion',
            label: 'Configuración',
            icono: '⚙️',
            keywords: ['ajustes', 'parametros'],
            hijos: [
              { id: 'administracion-config-global', label: 'Configuración Global', icono: '⚙️', ruta: '/administracion/datos-maestros/configuracion-global', permiso: 'admin.configuracion_global', keywords: ['ajustes'] },
              { id: 'administracion-config-plantillas', label: 'Plantillas', icono: '📃', ruta: '/administracion/datos-maestros/plantillas', permiso: 'admin.plantillas' },
              { id: 'administracion-config-ia', label: 'Configuración IA', icono: '🤖', ruta: '/administracion/datos-maestros/configuracion-ia', permiso: 'admin.configuracion_ia', keywords: ['ia', 'inteligencia artificial'] },
              { id: 'administracion-cargos', label: 'Cargos', icono: '💼', ruta: '/administracion/datos-maestros/cargos', permiso: 'admin.cargos', keywords: ['puestos', 'roles'] },
              { id: 'administracion-tipos-documentos', label: 'Tipos Documentos', icono: '📄', ruta: '/administracion/datos-maestros/tipos-documentos', permiso: 'admin.tipos_documentos', keywords: ['documentos'] },
              { id: 'administracion-institucion', label: 'Institución', icono: '🏫', ruta: '/administracion/datos-maestros/institucion', permiso: 'admin.institucion', keywords: ['institucion', 'documentos institucionales', 'plan de emergencia'] }
            ]
          },
          {
            id: 'administracion-seguridad',
            label: 'Seguridad',
            icono: '🔐',
            keywords: ['roles', 'permisos', 'accesos'],
            hijos: [
              { id: 'administracion-permisos', label: 'Permisos por Rol', icono: '🔐', ruta: '/administracion/datos-maestros/permisos', permiso: 'admin.permisos_rol', keywords: ['roles', 'permisos', 'accesos'] },
              { id: 'administracion-usuarios', label: 'Usuarios', icono: '👤', ruta: '/administracion/datos-maestros/usuarios', permiso: 'admin.usuarios', keywords: ['cuentas', 'accesos', 'login', 'claves'] },
              { id: 'administracion-roles', label: 'Roles', icono: '🎭', ruta: '/administracion/datos-maestros/roles', permiso: 'admin.roles', keywords: ['perfiles', 'cargos de sistema'] },
              { id: 'administracion-usuarios-x-rol', label: 'Usuarios por Rol', icono: '👥', ruta: '/administracion/datos-maestros/usuarios-x-rol', permiso: 'admin.usuarios_x_rol', keywords: ['asignar usuarios', 'asignacion masiva'] }
            ]
          },
          { id: 'administracion-documentacion', label: 'Documentación', icono: '📖', ruta: '/administracion/datos-maestros/documentacion-sistema', permiso: 'admin.documentacion', keywords: ['ayuda', 'manual'] }
        ]
      }
    ];
  }
}