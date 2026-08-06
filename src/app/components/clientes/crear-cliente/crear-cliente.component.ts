import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { DocumentosPersonaComponent } from '../../../common/documentos-persona/documentos-persona.component';
import { FotoPersonaComponent } from '../../../common/foto-persona/foto-persona.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../../services/clientes.service';
import { GenerosService } from '../../../services/generos.service';
import { PersonasService } from '../../../services/personas.service';
import { TiposIdentificacionService } from '../../../services/tipos-identificacion.service';
import { PlanesService } from '../../../services/planes.service';
import { CiudadesService } from '../../../services/ciudades.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';
import { UtilService } from '../../../common/constantes/util.service';

interface ClienteModel {
  idPersona: string;
  tipoIdentificacion: number | string;
  numeroIdentificacion: number | string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
  genero: number | string;
  direccion: string;
  correoElectronico: string;
  telefono: string;
  nacionalidad: string;
  ciudad: number | string;
  rh: string;
  ocupacion: string;
  fechaIngreso: string;
  telefonoEmergencia: string;
  eps: string;
  alimentacion: boolean;
  permanente: boolean;
  plan: number | string;
  grado: number | string;
  anno: number | string;
  idCliente: string;
  activo: number;
}

interface HorarioCliente {
  id: string;
  id_cliente: string;
  id_dia_semana: number;
  nombre_dia: string;
  hora_entrada: string;
  hora_salida: string;
}

interface ConvenioCliente {
  id: string;
  id_cliente: string;
  id_convenio: string;
  nombre_convenio: string;
  descripcion_convenio: string;
  nombre_producto_servicio: string;
  valor_sugerido: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  nombre_usuario: string;
}

interface DatoDinamico {
  id_dato: string;
  nombre: string;
  nombre_tipo: string;
  id_tipo: string;
  orden_tipo: number;
  orden_dato: number;
  es_numero: boolean;
  es_texto: boolean;
  es_parrafo: boolean;
  es_fecha: boolean;
  opciones: string[];
  valor_numero: any;
  valor_texto: string;
  valor_parrafo: string;
  valor_fecha: string;
  observacion: string;
}

interface PlanDatosDinamicos {
  nombre_tipo: string;
  icono: string;
  id_tipo: string;
  orden_tipo: number;
  datos: DatoDinamico[];
}

@Component({
  selector: 'app-crear-cliente',
  standalone: true,
  imports: [
    HeaderComponent,
    CommonModule,
    FormsModule,
    DocumentosPersonaComponent,
    FotoPersonaComponent,
  ],
  templateUrl: './crear-cliente.component.html',
  styleUrl: './crear-cliente.component.scss',
})
export class CrearClienteComponent implements OnInit {
  public id = '0';
  public accion = '';
  public editable = true;
  public submitted = false;
  public titulo = 'Registro de cliente';
  public regresar = '/clientes';
  public documentoEncontrado = false;
  public camposHabilitados = false;
  public idClientePlan = 0;
  // Plan y grado originales al cargar el cliente en modo editar, para detectar si hubo cambio
  private planOriginal: any = null;
  private gradoOriginal: any = null;

  // Sidebar y navegación por secciones
  public nuevo = false;
  public seccionActiva: 'datos-personales' | 'datos-academicos' | 'documentos' = 'datos-personales';
  public sidebarAbierto = false;

  public listas = {
    tiposIdentificacion: [] as any[],
    generos: [] as any[],
    planes: [] as any[],
    ciudades: [] as any[],
    annos: [] as any[],
    planesRh: [
      { id: 'O+', nombre: 'O+' },
      { id: 'O-', nombre: 'O-' },
      { id: 'A+', nombre: 'A+' },
      { id: 'A-', nombre: 'A-' },
      { id: 'B+', nombre: 'B+' },
      { id: 'B-', nombre: 'B-' },
      { id: 'AB+', nombre: 'AB+' },
      { id: 'AB-', nombre: 'AB-' },
    ],
    conveniosDisponibles: [] as any[],
  };

  // Horarios del cliente
  public horarios: HorarioCliente[] = [];
  public horariosModificados = false;

  // Días de la semana traídos del backend (BD: tabla dias_semana)
  private diasSemana: any[] = [];

  // Convenios del cliente
  public conveniosCliente: ConvenioCliente[] = [];
  public nuevoConvenio = {
    id_convenio: '',
    fecha_inicio: '',
    fecha_fin: '',
    crear_cobros_automaticos: false
  };

  // Datos médicos dinámicos
  public planesDatosMedicos: PlanDatosDinamicos[] = [];
  public datosMedicosModificados = false;

  // Datos adicionales dinámicos
  public planesDatosAdicionales: PlanDatosDinamicos[] = [];
  public datosAdicionalesModificados = false;

  // Control de carga perezosa por sección (solo en edición/consulta).
  // Una vez cargada una sección no se vuelve a consultar al regresar a ella.
  private horariosCargados = false;
  private conveniosCargados = false;
  private datosMedicosCargados = false;
  private datosAdicionalesCargados = false;

  public model: ClienteModel = {
    idPersona: '',
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '',
    genero: '',
    direccion: '',
    correoElectronico: '',
    telefono: '',
    nacionalidad: 'Colombiana',
    ciudad: '',
    rh: '',
    ocupacion: 'Cliente',
    fechaIngreso: '',
    telefonoEmergencia: '',
    eps: '',
    alimentacion: false,
    permanente: false,
    plan: '',
    grado: '',
    anno: '',
    idCliente: '',
    activo: 1,
  };
  public clienteActivoSwitch = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tiposIdentificacionService: TiposIdentificacionService,
    private generosService: GenerosService,
    private planesService: PlanesService,
    private personasService: PersonasService,
    private clientesService: ClientesService,
    private ciudadesService: CiudadesService,
    private institucionConfigService: InstitucionConfigService,
    private utilService: UtilService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.accion = params['accion'];
      this.id = params['id'];
      switch (this.accion) {
        case 'crear':
          this.editable = true;
          this.camposHabilitados = false;
          this.nuevo = true;
          this.titulo = 'Crear cliente';
          this.establecerValoresPorDefecto();
          break;
        case 'editar':
          this.editable = true;
          this.camposHabilitados = true;
          this.documentoEncontrado = true;
          this.nuevo = false;
          this.titulo = 'Editar cliente';
          this.regresar = '/clientes/opciones/' + this.id;
          this.obtenerCliente(this.id);
          break;
        case 'consultar':
          this.editable = false;
          this.camposHabilitados = false;
          this.documentoEncontrado = true;
          this.nuevo = false;
          this.titulo = 'Consultar cliente';
          this.regresar = '/clientes/opciones/' + this.id;
          this.obtenerCliente(this.id);
          break;
        default:
          this.editable = true;
          this.camposHabilitados = false;
          this.nuevo = true;
          this.titulo = 'Crear cliente';
          this.establecerValoresPorDefecto();
          break;
      }
    });

    this.consultarTiposIdentificacion();
    this.consultarGeneros();
    this.consultarPlanes();
    this.consultarCiudades();
    this.consultarAnnos();
  }

  // ============ SIDEBAR Y NAVEGACIÓN POR SECCIONES ============

  cambiarSeccion(seccion: 'datos-personales' | 'datos-academicos' | 'documentos'): void {
    this.seccionActiva = seccion;
    this.cerrarSidebar();
  }

  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  cerrarSidebar(): void {
    this.sidebarAbierto = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrarSidebar();
  }

  obtenerNombreSeccion(): string {
    const nombres: Record<string, string> = {
      'datos-personales': 'Datos Personales',
      'datos-academicos': 'Datos Académicos',
      'documentos': 'Documentos',
    };
    return nombres[this.seccionActiva] || '';
  }

  obtenerIconoSeccion(): string {
    const iconos: Record<string, string> = {
      'datos-personales': 'fas fa-user-circle',
      'datos-academicos': 'fas fa-graduation-cap',
      'documentos': 'fas fa-file-alt',
    };
    return iconos[this.seccionActiva] || 'fas fa-circle';
  }

  // ============ LISTAS ============

  consultarTiposIdentificacion() {
    this.tiposIdentificacionService
      .obtenerTodos()
      .subscribe((response: any) => {
        this.listas.tiposIdentificacion = response.body;
      });
  }

  consultarGeneros() {
    this.generosService.obtenerTodos().subscribe((response: any) => {
      this.listas.generos = response.body;
    });
  }

  consultarPlanes() {
    this.planesService.obtenerTodos().subscribe((response: any) => {
      this.listas.planes = response.body;
    });
  }

  consultarCiudades() {
    this.ciudadesService.obtenerTodos().subscribe((response: any) => {
      this.listas.ciudades = response.body;
    });
  }

  consultarAnnos() {
    this.listas.annos = this.institucionConfigService.getAnnosEscolares();
  }

  consultaPersona(tipoIdentificacion: any, numeroIdentificacion: any) {
    if (!tipoIdentificacion || !numeroIdentificacion) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor ingrese tipo y número de documento para verificar',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    this.personasService
      .obtenerByIdentificacion(tipoIdentificacion, numeroIdentificacion)
      .subscribe({
        next: (response: any) => {
          if (response.body && response.body.length > 0) {
            const persona = response.body[0];
            this.clientesService.verificarDuplicados(persona.id).subscribe({
              next: (respuesta: any) => {
                if (respuesta.existe) {
                  Swal.fire({
                    title: 'Cliente existente',
                    text: 'Esta persona ya está registrada como cliente en el sistema',
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                  });
                  return;
                } else {
                  this.llenarFormularioPersona(persona);
                  this.documentoEncontrado = true;
                  this.camposHabilitados = true;
                  Swal.fire({
                    title: 'Persona encontrada',
                    text: 'Se encontró una persona con esta identificación',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                  });
                }
              },
              error: (error: any) => {
                console.error('Error al verificar cliente', error);
                Swal.fire({
                  title: 'Error',
                  text: 'Error al verificar si la persona ya está registrada como cliente',
                  icon: 'error',
                  confirmButtonText: 'Aceptar',
                });
              },
            });
          } else {
            this.documentoEncontrado = true;
            this.camposHabilitados = true;
            Swal.fire({
              title: 'Persona no encontrada',
              text: 'No se encontró ninguna persona con esta identificación. Ahora puede ingresar los datos.',
              icon: 'info',
              confirmButtonText: 'Aceptar',
            });
          }
        },
        error: (error: any) => {
          console.error('Error al consultar persona', error);
          Swal.fire({
            title: 'Error',
            text: 'Error al consultar la persona',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        },
      });
  }

  llenarFormularioPersona(persona: any) {
    this.model.idPersona = persona.id;
    this.model.tipoIdentificacion = persona.id_tipo_identificacion;
    this.model.numeroIdentificacion = persona.numero_identificacion;
    this.model.primerNombre = persona.primer_nombre;
    this.model.segundoNombre = persona.segundo_nombre;
    this.model.primerApellido = persona.primer_apellido;
    this.model.segundoApellido = persona.segundo_apellido;
    this.model.fechaNacimiento = persona.fecha_nacimiento;
    this.model.genero = persona.id_genero;
    this.model.direccion = persona.direccion;
    this.model.correoElectronico = persona.correo_electronico;
    this.model.nacionalidad = persona.nacionalidad || 'Colombiana';
    this.model.telefono = persona.telefono;
    this.model.ciudad = persona.id_ciudad;
    this.model.rh = persona.rh;
    this.model.ocupacion = 'Cliente';
  }

  obtenerCliente(id: any) {
    if (id && id !== '0') {
      this.clientesService.obtenerById(id).subscribe({
        next: (response: any) => {
          const cliente = response.body[0];
          if (cliente) {
            this.personasService.obtenerById(cliente.id_persona).subscribe({
              next: (personaResponse: any) => {
                const persona = personaResponse.body[0];
                if (persona) {
                  this.model.idPersona = persona.id;
                  this.model.tipoIdentificacion = persona.id_tipo_identificacion;
                  this.model.numeroIdentificacion = persona.numero_identificacion;
                  this.model.primerNombre = persona.primer_nombre;
                  this.model.segundoNombre = persona.segundo_nombre;
                  this.model.primerApellido = persona.primer_apellido;
                  this.model.segundoApellido = persona.segundo_apellido;
                  this.model.fechaNacimiento = persona.fecha_nacimiento;
                  this.model.genero = persona.id_genero;
                  this.model.direccion = persona.direccion;
                  this.model.correoElectronico = persona.correo_electronico;
                  this.model.nacionalidad = persona.nacionalidad || 'Colombiana';
                  this.model.telefono = persona.telefono;
                  this.model.ciudad = persona.id_ciudad;
                  this.model.rh = persona.rh;
                  this.model.ocupacion = 'Cliente';
                  const nombreCompleto = this.construirNombreCompleto(persona);
                  if (this.accion === 'editar') {
                    this.titulo = `Editar cliente: ${nombreCompleto}`;
                  } else if (this.accion === 'consultar') {
                    this.titulo = `Consultar cliente: ${nombreCompleto}`;
                  }
                }

                this.model.idCliente = cliente.id;
                this.model.fechaIngreso = cliente.fecha_ingreso;
                this.model.telefonoEmergencia = cliente.telefono_emergencia;
                this.model.eps = cliente.eps;
                this.model.alimentacion = Boolean(cliente.alimentacion);
                this.model.permanente = Boolean(cliente.permanente);
                this.model.anno = cliente.anno;
                this.model.activo = cliente.activo;
                this.clienteActivoSwitch = cliente.activo == 1 || cliente.activo === '1';

                this.obtenerPlanCliente(cliente.id);
              },
              error: (error: any) => {
                console.error('Error al obtener persona', error);
                Swal.fire('Error', 'Error al cargar los datos de la persona', 'error');
              },
            });
          }
        },
        error: (error: any) => {
          console.error('Error al obtener cliente', error);
          Swal.fire('Error', 'Error al cargar los datos del cliente', 'error');
        },
      });
    }
  }

  construirNombreCompleto(persona: any): string {
    const partes = [];
    if (persona.primer_nombre) partes.push(persona.primer_nombre);
    if (persona.segundo_nombre) partes.push(persona.segundo_nombre);
    if (persona.primer_apellido) partes.push(persona.primer_apellido);
    if (persona.segundo_apellido) partes.push(persona.segundo_apellido);
    return partes.join(' ') || 'Sin nombre';
  }

  cambiarEstadoCliente(): void {
    this.model.activo = this.clienteActivoSwitch ? 1 : 0;
  }

  obtenerPlanCliente(idCliente: any) {
    this.clientesService.obtenerPlanByCliente(idCliente).subscribe({
      next: (response: any) => {
        if (response.body && response.body.length > 0) {
          this.model.plan = response.body[0].id_plan;
          this.idClientePlan = response.body[0].id;
          // Guardar valores originales para luego detectar si el usuario los cambió
          this.planOriginal = response.body[0].id_plan;
          this.gradoOriginal = response.body[0].id_grado;
        }
      },
      error: (error: any) => {
        console.error('Error al obtener plan del cliente', error);
      },
    });
  }

  guardarPersona(persona: any) {
    this.submitted = true;

    if (!this.formularioValido()) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete los campos obligatorios',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    if (this.accion === 'editar' && persona.idPersona) {
      this.actualizarPersona(persona);
    } else {
      if (!persona.idPersona || !persona.idPersona) {
        const personaData = this.prepararDatosPersona(persona);
        this.personasService.crear(personaData).subscribe({
          next: (response: any) => {
            if (+!response.id) {
              Swal.fire({ title: 'Error', text: 'Error al crear persona', icon: 'error', confirmButtonText: 'Aceptar' });
              return;
            }
            persona.idPersona = response.id;
            this.crearActualizarCliente(persona);
          },
          error: (error: any) => {
            console.error('Error al crear persona', error);
            Swal.fire({ title: 'Error', text: 'Error al crear la persona', icon: 'error', confirmButtonText: 'Aceptar' });
          },
        });
      } else {
        this.clientesService.verificarDuplicados(persona.idPersona).subscribe({
          next: (respuesta: any) => {
            if (respuesta.existe) {
              Swal.fire({ title: 'Cliente existente', text: 'Esta persona ya está registrada como cliente en el sistema', icon: 'warning', confirmButtonText: 'Aceptar' });
              return;
            } else {
              this.crearActualizarCliente(persona);
            }
          },
          error: (error: any) => {
            console.error('Error al verificar cliente', error);
            Swal.fire({ title: 'Error', text: 'Error al verificar si la persona ya está registrada como cliente', icon: 'error', confirmButtonText: 'Aceptar' });
          },
        });
      }
    }
  }

  actualizarPersona(persona: any) {
    const personaData = this.prepararDatosPersona(persona);
    this.personasService.actualizar(personaData).subscribe({
      next: (response: any) => {
        if (response.error) {
          Swal.fire({ title: 'Error', text: 'Error al actualizar la persona', icon: 'error', confirmButtonText: 'Aceptar' });
          return;
        }
        this.crearActualizarCliente(persona);
      },
      error: (error: any) => {
        console.error('Error al actualizar persona', error);
        Swal.fire({ title: 'Error', text: 'Error al actualizar la persona', icon: 'error', confirmButtonText: 'Aceptar' });
      },
    });
  }

  prepararDatosPersona(persona: any) {
    if (!persona.nacionalidad) {
      persona.nacionalidad = 'Colombiana';
    }
    persona.ocupacion = 'Cliente';

    return {
      id: persona.idPersona || 0,
      primer_nombre: persona.primerNombre,
      segundo_nombre: persona.segundoNombre,
      primer_apellido: persona.primerApellido,
      segundo_apellido: persona.segundoApellido,
      id_tipo_identificacion: persona.tipoIdentificacion,
      numero_identificacion: persona.numeroIdentificacion,
      fecha_nacimiento: persona.fechaNacimiento,
      id_genero: persona.genero === '' ? null : persona.genero,
      direccion: persona.direccion,
      correo_electronico: persona.correoElectronico,
      nacionalidad: persona.nacionalidad,
      telefono: persona.telefono,
      id_ciudad: persona.ciudad === '' ? null : persona.ciudad,
      rh: persona.rh,
      ocupacion: persona.ocupacion,
    };
  }

  crearActualizarCliente(cliente: any) {
    const clienteData = {
      id: cliente.idCliente || 0,
      id_persona: cliente.idPersona,
      fecha_ingreso: cliente.fechaIngreso,
      telefono_emergencia: cliente.telefonoEmergencia || '',
      eps: cliente.eps || '',
      alimentacion: cliente.alimentacion ? 1 : 0,
      permanente: cliente.permanente ? 1 : 0,
      anno: cliente.anno || new Date().getFullYear(),
      activo: cliente.activo,
    };

    if (this.accion === 'crear') {
      this.clientesService.crear(clienteData).subscribe({
        next: (response: any) => {
          cliente.idCliente = response.id;
          this.model.idCliente = response.id;
          this.asignarPlan(cliente);
        },
        error: (error: any) => this.manejarError(error, 'crear'),
      });
    } else if (this.accion === 'editar') {
      this.clientesService.actualizar(clienteData).subscribe({
        next: (response: any) => {
          this.asignarPlan(cliente);
        },
        error: (error: any) => this.manejarError(error, 'actualizar'),
      });
    }
  }

  asignarPlan(cliente: any) {
    if (!cliente.plan) {
      Swal.fire({
        title: 'Advertencia',
        text: 'No se ha seleccionado un plan para el cliente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // En modo editar, si el plan y el grado no cambiaron respecto a los valores
    // originales, no rotar el registro de clientes_x_planes: solo confirmar éxito.
    if (this.accion === 'editar') {
      const planIgual = String(cliente.plan) === String(this.planOriginal);
      const gradoActual = cliente.grado || null;
      const gradoOriginal = this.gradoOriginal || null;
      const gradoIgual = String(gradoActual) === String(gradoOriginal);

      if (planIgual && gradoIgual) {
        Swal.fire({
          title: 'Éxito',
          text: 'Cliente actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.volver();
        });
        return;
      }
    }

    this.clientesService
      .inactivarClientePlan(this.idClientePlan)
      .subscribe((response: any) => {
        this.clientesService
          .activarClientePlan(cliente.idCliente, cliente.plan, cliente.anno || new Date().getFullYear(), cliente.grado)
          .subscribe({
            next: (response: any) => {
              Swal.fire({
                title: 'Éxito',
                text: this.accion === 'crear'
                  ? 'Cliente creado correctamente'
                  : 'Cliente actualizado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
              }).then(() => {
                this.volver();
              });
            },
            error: (error: any) => {
              console.error('Error al asignar plan', error);
              Swal.fire({ title: 'Error', text: 'Error al asignar el plan al cliente', icon: 'error', confirmButtonText: 'Aceptar' });
            },
          });
      });
  }

  formularioValido(): boolean {
    return Boolean(
      this.model.tipoIdentificacion &&
      this.model.numeroIdentificacion &&
      this.model.primerNombre &&
      this.model.primerApellido &&
      this.model.fechaNacimiento &&
      this.model.genero &&
      this.model.plan &&
      this.model.fechaIngreso,
    );
  }

  manejarError(error: any, accion: string): void {
    console.error(`Error al ${accion} cliente`, error);
    Swal.fire({
      title: 'Error',
      text: `Error al ${accion} el cliente`,
      icon: 'error',
      confirmButtonText: 'Aceptar',
    });
  }

  limpiarFormulario(): void {
    this.model = {
      idPersona: '',
      tipoIdentificacion: '',
      numeroIdentificacion: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      fechaNacimiento: '',
      genero: '',
      direccion: '',
      correoElectronico: '',
      telefono: '',
      nacionalidad: 'Colombiana',
      ciudad: '',
      rh: '',
      ocupacion: 'Cliente',
      fechaIngreso: '',
      telefonoEmergencia: '',
      eps: '',
      alimentacion: false,
      permanente: false,
      plan: '',
      grado: '',
      anno: '',
      idCliente: '',
      activo: 1,
    };
    this.submitted = false;
    this.documentoEncontrado = false;
    this.camposHabilitados = false;
    this.clienteActivoSwitch = true;
    this.horarios = [];
    this.conveniosCliente = [];
    this.horariosModificados = false;
    this.planesDatosMedicos = [];
    this.planesDatosAdicionales = [];
    this.datosMedicosModificados = false;
    this.datosAdicionalesModificados = false;
    this.horariosCargados = false;
    this.conveniosCargados = false;
    this.datosMedicosCargados = false;
    this.datosAdicionalesCargados = false;
    this.nuevoConvenio = {
      id_convenio: '',
      fecha_inicio: '',
      fecha_fin: '',
      crear_cobros_automaticos: false
    };
  }

  volver(): void {
    if (this.model.idCliente && this.model.idCliente !== '0') {
      this.router.navigate(['/clientes/opciones/' + this.model.idCliente]);
    } else {
      this.router.navigate(['/clientes']);
    }
  }

  establecerValoresPorDefecto(): void {
    this.model.nacionalidad = 'Colombiana';
    this.model.ocupacion = 'Cliente';
    this.model.tipoIdentificacion = 2;
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.model.fechaIngreso = `${año}-${mes}-${dia}`;
    this.model.anno = año;
    this.model.activo = 1;
    this.clienteActivoSwitch = true;
    this.model.alimentacion = false;
    this.model.permanente = false;
    this.nuevoConvenio.fecha_inicio = `${año}-${mes}-${dia}`;
    this.nuevoConvenio.crear_cobros_automaticos = false;
  }

  obtenerNombreCompleto(): string {
    return [
      this.model.primerNombre,
      this.model.segundoNombre,
      this.model.primerApellido,
      this.model.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }
}