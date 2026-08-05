import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { PermisosGuard } from './core/permisos.guard';

export const routes: Routes = [

  // ==================================================================
  // Transversales
  // ==================================================================
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'configuracion', loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), canActivate: [AuthGuard] },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'menu', loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent), canActivate: [AuthGuard] },
  { path: 'mi-perfil', loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent), canActivate: [AuthGuard] },
  { path: 'registro', loadComponent: () => import('./components/registro/registro.component').then(m => m.RegistroComponent), canActivate: [AuthGuard] },
  { path: 'registro-ingreso-salida', loadComponent: () => import('./components/colaboradores/registro-ingreso-salida/registro-ingreso-salida.component').then(m => m.RegistroIngresoSalidaComponent), canActivate: [AuthGuard] },
  { path: 'salir', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'usuarios', redirectTo: 'administracion/datos-maestros/usuarios', pathMatch: 'full' },

  // ==================================================================
  // Estudiantes
  // ==================================================================
  { path: 'estudiantes/gestion', loadComponent: () => import('./components/estudiantes/gestion-estudiantes/gestion-estudiantes.component').then(m => m.GestionEstudiantesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.gestion', trackear: true, labelAcceso: 'Gestión Estudiantes', iconoAcceso: '🎓' } },
  { path: 'estudiantes/registro-rapido', loadComponent: () => import('./components/estudiantes/registro-rapido-estudiante/registro-rapido-estudiante.component').then(m => m.RegistroRapidoEstudianteComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.administrar' } },
  { path: 'estudiantes', loadComponent: () => import('./components/estudiantes/estudiantes.component').then(m => m.EstudiantesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.listado', trackear: true, labelAcceso: 'Estudiantes', iconoAcceso: '🎓' } },
  { path: 'estudiantes/pagos/comprobante/:id', loadComponent: () => import('./components/estudiantes/pagos/comprobante-pago/comprobante-pago-view.component').then(m => m.ComprobantePagoViewComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.pagos' } },
  { path: 'estudiantes/acudientes/:accion/:id/:idEstudiante', loadComponent: () => import('./components/estudiantes/acudientes/crear-acudiente/crear-acudiente.component').then(m => m.CrearAcudienteComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.acudientes.administrar' } },
  { path: 'estudiantes/acudientes/:id', loadComponent: () => import('./components/estudiantes/acudientes/acudientes.component').then(m => m.AcudientesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.acudientes' } },
  { path: 'estudiantes/contratos/:accion/:id/:idEstudiante', loadComponent: () => import('./components/estudiantes/contratos-estudiantes/crear-contrato/crear-contrato.component').then(m => m.CrearContratoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.contratos.administrar' } },
  { path: 'estudiantes/contratos/:id', loadComponent: () => import('./components/estudiantes/contratos-estudiantes/contratos-estudiantes.component').then(m => m.ContratosEstudiantesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.contratos' } },
  { path: 'estudiantes/opciones/:id', loadComponent: () => import('./components/estudiantes/opciones-estudiante/opciones-estudiante.component').then(m => m.OpcionesEstudianteComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.listado' } },
  { path: 'estudiantes/pagos/:accion/:id/:idEstudiante', loadComponent: () => import('./components/estudiantes/pagos/crear-pagos-recibidos/crear-pagos-recibidos.component').then(m => m.CrearPagosRecibidosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.pagos.administrar' } },
  { path: 'estudiantes/pagos/:id', loadComponent: () => import('./components/estudiantes/pagos/pagos-recibidos.component').then(m => m.PagosRecibidosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.pagos' } },
  { path: 'estudiantes/productos-servicios/:accion/:id/:idEstudiante', loadComponent: () => import('./components/estudiantes/productos-servicios/crear-productos-servicios/crear-productos-servicios.component').then(m => m.CrearProductosServiciosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.productos_servicios.administrar' } },
  { path: 'estudiantes/productos-servicios/:id', loadComponent: () => import('./components/estudiantes/productos-servicios/productos-servicios.component').then(m => m.ProductosServiciosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.productos_servicios' } },
  { path: 'estudiantes/servicios/:accion/:id/:idEstudiante', loadComponent: () => import('./components/servicios/administrar-servicios-estudiante/administrar-servicios-estudiante.component').then(m => m.AdministrarServiciosEstudianteComponent), canActivate: [AuthGuard] },
  { path: 'estudiantes/servicios/:id', loadComponent: () => import('./components/servicios/servicios/servicios.component').then(m => m.ServiciosComponent), canActivate: [AuthGuard] },
  { path: 'estudiantes/vista/:id', loadComponent: () => import('./components/estudiantes/vista-estudiante/vista-estudiante.component').then(m => m.VistaEstudianteComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.vista_360' } },
  { path: 'estudiantes/:accion/:id', loadComponent: () => import('./components/estudiantes/crear-estudiante/crear-estudiante.component').then(m => m.CrearEstudianteComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'estudiantes.administrar' } },

  // ==================================================================
  // Académico
  // ==================================================================

  // ==================================================================
  // Asistencia
  // ==================================================================

  // ==================================================================
  // Reportes
  // ==================================================================
  { path: 'reportes/cartera', loadComponent: () => import('./components/reportes/reporte-cartera/reporte-cartera.component').then(m => m.ReporteCarteraComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.cartera', trackear: true, labelAcceso: 'Reporte Cartera', iconoAcceso: '💰' } },
  { path: 'reportes/cobros-realizados', loadComponent: () => import('./components/reportes/reporte-cobros/reporte-cobros.component').then(m => m.ReporteCobrosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.cobros_realizados', trackear: true, labelAcceso: 'Cobros Realizados', iconoAcceso: '🧾' } },
  { path: 'reportes/dashboard-gerencial', loadComponent: () => import('./components/reportes/dashboard-gerencial/dashboard-gerencial.component').then(m => m.DashboardGerencialComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'dashboard.gerencial.listado', trackear: true, labelAcceso: 'Dashboard Gerencial', iconoAcceso: '📊' } },
  { path: 'reportes/estudiantes-general', loadComponent: () => import('./components/reportes/reporte-estudiantes/reporte-estudiantes.component').then(m => m.ReporteEstudiantesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.estudiantes_general', trackear: true, labelAcceso: 'Reporte Estudiantes', iconoAcceso: '📋' } },
  { path: 'reportes/historial-actividades', loadComponent: () => import('./components/reportes/historial-actividades/historial-actividades.component').then(m => m.HistorialActividadesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.historial_actividades', trackear: true, labelAcceso: 'Historial Actividades', iconoAcceso: '📜' } },
  { path: 'reportes/movimientos-financieros', loadComponent: () => import('./components/reportes/reporte-movimientos-financieros/reporte-movimientos-financieros.component').then(m => m.ReporteMovimientosFinancierosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.movimientos_financieros', trackear: true, labelAcceso: 'Ingresos y Egresos', iconoAcceso: '💹' } },
  { path: 'reportes/pagos-recibidos', loadComponent: () => import('./components/reportes/reporte-pagos-recibidos/reporte-pagos-recibidos.component').then(m => m.ReportePagosRecibidosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.pagos_recibidos', trackear: true, labelAcceso: 'Reporte Pagos', iconoAcceso: '💳' } },
  { path: 'reportes/reporte-contabilizaciones', loadComponent: () => import('./components/reportes/reporte-contabilizaciones/reporte-contabilizaciones.component').then(m => m.ReporteContabilizacionesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.contabilizaciones', trackear: true, labelAcceso: 'Reporte Contabilizaciones', iconoAcceso: '🧾' } },
  { path: 'reportes/reportes-pago', loadComponent: () => import('./components/reportes/reporte-reportes-pago/reporte-reportes-pago.component').then(m => m.ReporteReportesPagoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.reportes_pago', trackear: true, labelAcceso: 'Reportes de Pago', iconoAcceso: '📑' } },
  { path: 'reportes', loadComponent: () => import('./components/reportes/reportes.component').then(m => m.ReportesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'reportes.ver', trackear: true, labelAcceso: 'Reportes', iconoAcceso: '📊' } },

  // ==================================================================
  // Operaciones
  // ==================================================================

  // ==================================================================
  // Colaboradores
  // ==================================================================
  { path: 'colaboradores/actividades/aprobacion', loadComponent: () => import('./components/colaboradores/actividades-colaboradores/aprobacion-actividades-colaboradores/aprobacion-actividades-colaboradores.component').then(m => m.AprobacionActividadesColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.aprobacion_actividades', trackear: true, labelAcceso: 'Aprobación Actividades', iconoAcceso: '✅' } },
  { path: 'colaboradores/actividades/calendario', loadComponent: () => import('./components/colaboradores/actividades-colaboradores/calendario-colaboradores/calendario-colaboradores.component').then(m => m.CalendarioColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.calendario', trackear: true, labelAcceso: 'Calendario Colaboradores', iconoAcceso: '📅' } },
  { path: 'colaboradores/actividades/contabilizacion', loadComponent: () => import('./components/colaboradores/actividades-colaboradores/contabilizacion-actividades-colaboradores/contabilizacion-actividades-colaboradores.component').then(m => m.ContabilizacionActividadesColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.contabilizacion_actividades', trackear: true, labelAcceso: 'Contabilización Actividades', iconoAcceso: '🧮' } },
  { path: 'colaboradores/actividades', loadComponent: () => import('./components/colaboradores/actividades-colaboradores/actividades-colaboradores.component').then(m => m.ActividadesColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.actividades', trackear: true, labelAcceso: 'Actividades Colaboradores', iconoAcceso: '📋' } },
  { path: 'colaboradores/gestion', loadComponent: () => import('./components/colaboradores/gestion-colaboradores/gestion-colaboradores.component').then(m => m.GestionColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.gestion', trackear: true, labelAcceso: 'Gestión Colaboradores', iconoAcceso: '👥' } },
  { path: 'colaboradores/nominas', loadComponent: () => import('./components/colaboradores/nominas/nominas.component').then(m => m.NominasComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.nominas', trackear: true, labelAcceso: 'Nóminas', iconoAcceso: '💰' } },
  { path: 'colaboradores', loadComponent: () => import('./components/colaboradores/colaboradores.component').then(m => m.ColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado', trackear: true, labelAcceso: 'Colaboradores', iconoAcceso: '🧑‍💼' } },
  { path: 'colaboradores/pagos-recibidos/comprobante/:id', loadComponent: () => import('./components/colaboradores/pagos-recibidos/comprobante-pago-colaborador-view/comprobante-pago-colaborador-view.component').then(m => m.ComprobantePagoColaboradorViewComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/prestamos-pagos/crear/:idPrestamo/:idColaborador', loadComponent: () => import('./components/colaboradores/prestamos/colaboradores-prestamos-pagos/crear-colaboradores-prestamos-pagos.component').then(m => m.CrearColaboradoresPrestamosPagosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/contratos/:accion/:id/:idColaborador', loadComponent: () => import('./components/colaboradores/contratos-colaborador/crear-contrato-colaborador/crear-contrato-colaborador.component').then(m => m.CrearContratoColaboradorComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.contratos.administrar' } },
  { path: 'colaboradores/contratos/:id', loadComponent: () => import('./components/colaboradores/contratos-colaborador/contratos-colaborador.component').then(m => m.ContratosColaboradorComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.contratos' } },
  { path: 'colaboradores/nominas/:accion/:id', loadComponent: () => import('./components/colaboradores/nominas/crear-nomina/crear-nomina.component').then(m => m.CrearNominaComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.nominas' } },
  { path: 'colaboradores/opciones/:id', loadComponent: () => import('./components/colaboradores/opciones-colaborador/opciones-colaborador.component').then(m => m.OpcionesColaboradorComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/pagos-recibidos/:accion/:id/:idColaborador', loadComponent: () => import('./components/colaboradores/pagos-recibidos/crear-colaboradores-pagos-recibidos/crear-colaboradores-pagos-recibidos.component').then(m => m.CrearColaboradoresPagosRecibidosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/pagos-recibidos/:id', loadComponent: () => import('./components/colaboradores/pagos-recibidos/colaboradores-pagos-recibidos.component').then(m => m.ColaboradoresPagosRecibidosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/prestamos/:accion/:id/:idColaborador', loadComponent: () => import('./components/colaboradores/prestamos/crear-colaboradores-prestamos/crear-colaboradores-prestamos/crear-colaboradores-prestamos.component').then(m => m.CrearColaboradoresPrestamosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/prestamos/:id', loadComponent: () => import('./components/colaboradores/prestamos/colaboradores-prestamos.component').then(m => m.ColaboradoresPrestamosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/productos-servicios/:accion/:id/:idColaborador', loadComponent: () => import('./components/colaboradores/productos-servicios/crear-colaboradores-productos-servicios/crear-colaboradores-productos-servicios.component').then(m => m.CrearColaboradoresProductosServiciosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/productos-servicios/:id', loadComponent: () => import('./components/colaboradores/productos-servicios/colaboradores-productos-servicios.component').then(m => m.ColaboradoresProductosServiciosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },
  { path: 'colaboradores/:accion/:id', loadComponent: () => import('./components/colaboradores/crear-colaboradores/crear-colaboradores.component').then(m => m.CrearColaboradoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'colaboradores.listado' } },

  // ==================================================================
  // Administración
  // ==================================================================
  { path: 'administracion', loadComponent: () => import('./components/administracion/administracion/administracion.component').then(m => m.AdministracionComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'administracion.ver', trackear: true, labelAcceso: 'Administración', iconoAcceso: '🏛️' } },

  // ==================================================================
  // Administración / Datos Maestros
  // ==================================================================
  { path: 'administracion/datos-maestros/cargos', loadComponent: () => import('./components/administracion/cargos/cargos.component').then(m => m.CargosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.cargos', trackear: true, labelAcceso: 'Cargos', iconoAcceso: '💼' } },
  { path: 'administracion/datos-maestros/configuracion-global', loadComponent: () => import('./components/administracion/configuracion/configuracion-global/configuracion-global.component').then(m => m.ConfiguracionGlobalComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.configuracion_global', trackear: true, labelAcceso: 'Configuración Global', iconoAcceso: '⚙️' } },
  { path: 'administracion/datos-maestros/configuracion-ia', loadComponent: () => import('./components/administracion/configuracion-ia/configuracion-ia.component').then(m => m.ConfiguracionIaComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.configuracion_ia', trackear: true, labelAcceso: 'Configuración IA', iconoAcceso: '🤖' } },
  { path: 'administracion/datos-maestros/documentacion-sistema', loadComponent: () => import('./components/administracion/documentacion-sistema/documentacion-sistema.component').then(m => m.DocumentacionSistemaComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.documentacion', trackear: true, labelAcceso: 'Documentación', iconoAcceso: '📖' } },
  { path: 'administracion/datos-maestros/institucion', loadComponent: () => import('./components/administracion/institucion/institucion.component').then(m => m.InstitucionComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.institucion', trackear: true, labelAcceso: 'Institución', iconoAcceso: '🏫' } },
  { path: 'administracion/datos-maestros/permisos', loadComponent: () => import('./components/administracion/seguridad/permisos-rol/permisos-rol.component').then(m => m.PermisosRolComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.permisos_rol', trackear: true, labelAcceso: 'Permisos por Rol', iconoAcceso: '🔐' } },
  { path: 'administracion/datos-maestros/usuarios', loadComponent: () => import('./components/administracion/seguridad/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.usuarios' } },
  { path: 'administracion/datos-maestros/usuarios-x-rol', loadComponent: () => import('./components/administracion/seguridad/usuarios-x-rol/usuarios-x-rol.component').then(m => m.UsuariosXRolComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.usuarios_x_rol' } },
  { path: 'administracion/datos-maestros/roles', loadComponent: () => import('./components/administracion/seguridad/roles/roles.component').then(m => m.RolesComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.roles' } },
  { path: 'administracion/datos-maestros/usuarios/:accion/:id', loadComponent: () => import('./components/administracion/seguridad/gestion-usuarios/crear-usuario/crear-usuario.component').then(m => m.CrearUsuarioComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.usuarios' } },
  { path: 'administracion/datos-maestros/roles/:accion/:id', loadComponent: () => import('./components/administracion/seguridad/roles/crear-rol/crear-rol.component').then(m => m.CrearRolComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.roles' } },
  { path: 'administracion/datos-maestros/plantillas', loadComponent: () => import('./components/administracion/configuracion/plantillas/plantillas.component').then(m => m.PlantillasComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.plantillas', trackear: true, labelAcceso: 'Plantillas', iconoAcceso: '📃' } },
  { path: 'administracion/datos-maestros/productos', loadComponent: () => import('./components/administracion/productos/productos.component').then(m => m.ProductosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.productos', trackear: true, labelAcceso: 'Productos', iconoAcceso: '📦' } },
  { path: 'administracion/datos-maestros/productos-servicios', loadComponent: () => import('./components/administracion/productos-servicios/listar-productos-servicios.component').then(m => m.ListarProductosServiciosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.productos_servicios', trackear: true, labelAcceso: 'Productos y Servicios', iconoAcceso: '🛒' } },
  { path: 'administracion/datos-maestros/proveedores', loadComponent: () => import('./components/administracion/proveedores/proveedores.component').then(m => m.ProveedoresComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.proveedores', trackear: true, labelAcceso: 'Proveedores', iconoAcceso: '🚚' } },
  { path: 'administracion/datos-maestros/tipos-documentos', loadComponent: () => import('./components/administracion/tipos-documentos/tipos-documentos.component').then(m => m.TiposDocumentosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.tipos_documentos', trackear: true, labelAcceso: 'Tipos Documentos', iconoAcceso: '📄' } },
  { path: 'administracion/datos-maestros', loadComponent: () => import('./components/administracion/datos-maestros/datos-maestros.component').then(m => m.DatosMaestrosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'administracion.datos_maestros', trackear: true, labelAcceso: 'Datos Maestros', iconoAcceso: '🗃️' } },
  { path: 'administracion/datos-maestros/cargos/:accion/:id', loadComponent: () => import('./components/administracion/cargos/crear-cargo/crear-cargo.component').then(m => m.CrearCargoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.cargos' } },
  { path: 'administracion/datos-maestros/configuracion-global/:accion/:id', loadComponent: () => import('./components/administracion/configuracion/configuracion-global/editar-configuracion-global/editar-configuracion-global.component').then(m => m.EditarConfiguracionGlobalComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.configuracion_global' } },
  { path: 'administracion/datos-maestros/configuracion-ia/:accion/:id', loadComponent: () => import('./components/administracion/configuracion-ia/editar-configuracion-ia/editar-configuracion-ia.component').then(m => m.EditarConfiguracionIaComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.configuracion_ia' } },
  { path: 'administracion/datos-maestros/plantillas/:accion/:id', loadComponent: () => import('./components/administracion/configuracion/plantillas/editar-plantilla/editar-plantilla.component').then(m => m.EditarPlantillaComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.plantillas' } },
  { path: 'administracion/datos-maestros/productos-servicios/:accion/:id', loadComponent: () => import('./components/administracion/productos-servicios/crear-producto-servicio/crear-producto-servicio.component').then(m => m.CrearProductoServicioComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.productos_servicios' } },
  { path: 'administracion/datos-maestros/productos/:accion/:id', loadComponent: () => import('./components/administracion/productos/crear-producto/crear-producto.component').then(m => m.CrearProductoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.productos' } },
  { path: 'administracion/datos-maestros/proveedores/:accion/:id', loadComponent: () => import('./components/administracion/proveedores/crear-proveedor/crear-proveedor.component').then(m => m.CrearProveedorComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.proveedores' } },
  { path: 'administracion/datos-maestros/tipos-documentos/:accion/:id', loadComponent: () => import('./components/administracion/tipos-documentos/crear-tipo-documento/crear-tipo-documento.component').then(m => m.CrearTipoDocumentoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.tipos_documentos' } },

  // ==================================================================
  // Administración / Financiero
  // ==================================================================
  { path: 'administracion/financiero/aprobacion-multiple', loadComponent: () => import('./components/administracion/aprobacion-multiple-financiero/aprobacion-multiple-financiero.component').then(m => m.AprobacionMultipleFinancieroComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.aprobacion_multiple', trackear: true, labelAcceso: 'Aprobación Múltiple', iconoAcceso: '✅' } },
  { path: 'administracion/financiero/contabilizacion-multiple', loadComponent: () => import('./components/administracion/contabilizacion-multiple/contabilizacion-multiple.component').then(m => m.ContabilizacionMultipleComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.contabilizacion_multiple', trackear: true, labelAcceso: 'Contabilización Múltiple', iconoAcceso: '🧮' } },
  { path: 'administracion/financiero/movimientos-financieros', loadComponent: () => import('./components/administracion/movimientos-financieros/movimientos-financieros.component').then(m => m.MovimientosFinancierosComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.movimientos_financieros', trackear: true, labelAcceso: 'Movimientos Financieros', iconoAcceso: '💸' } },
  { path: 'administracion/financiero/registro-pagos-rapido', loadComponent: () => import('./components/administracion/registro-pagos-rapido/registro-pagos-rapido.component').then(m => m.RegistroPagosRapidoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.registro_pagos_rapido', trackear: true, labelAcceso: 'Registro Pagos Rápido', iconoAcceso: '⚡' } },
  { path: 'administracion/financiero', loadComponent: () => import('./components/administracion/financiero/financiero.component').then(m => m.FinancieroComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'administracion.financiero', trackear: true, labelAcceso: 'Financiero', iconoAcceso: '💵' } },
  { path: 'administracion/financiero/movimientos-financieros/:accion/:id', loadComponent: () => import('./components/administracion/movimientos-financieros/crear-movimiento/crear-movimiento.component').then(m => m.CrearMovimientoComponent), canActivate: [AuthGuard, PermisosGuard], data: { permiso: 'admin.movimientos_financieros' } },

  // ==================================================================
  // Administración / CRM
  // ==================================================================

  // ==================================================================
  // Administración / Operaciones
  // ==================================================================

  // ==================================================================
  // Administración / Otros
  // ==================================================================

  // Ruta comodín
  { path: '**', redirectTo: 'login' }
];
