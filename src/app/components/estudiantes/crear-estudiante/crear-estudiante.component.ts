import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { DocumentosPersonaComponent } from '../../../common/documentos-persona/documentos-persona.component';
import { FotoPersonaComponent } from '../../../common/foto-persona/foto-persona.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudiantesService } from '../../../services/estudiantes.service';
import { GenerosService } from '../../../services/generos.service';
import { PersonasService } from '../../../services/personas.service';
import { TiposIdentificacionService } from '../../../services/tipos-identificacion.service';
import { GruposService } from '../../../services/grupos.service';
import { CiudadesService } from '../../../services/ciudades.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';
import { UtilService } from '../../../common/constantes/util.service';

interface EstudianteModel {
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
  grupo: number | string;
  grado: number | string;
  anno: number | string;
  idEstudiante: string;
  activo: number;
}

interface HorarioEstudiante {
  id: string;
  id_estudiante: string;
  id_dia_semana: number;
  nombre_dia: string;
  hora_entrada: string;
  hora_salida: string;
}

interface ConvenioEstudiante {
  id: string;
  id_estudiante: string;
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

interface GrupoDatosDinamicos {
  nombre_tipo: string;
  icono: string;
  id_tipo: string;
  orden_tipo: number;
  datos: DatoDinamico[];
}

@Component({
  selector: 'app-crear-estudiante',
  standalone: true,
  imports: [
    HeaderComponent,
    CommonModule,
    FormsModule,
    DocumentosPersonaComponent,
    FotoPersonaComponent,
  ],
  templateUrl: './crear-estudiante.component.html',
  styleUrl: './crear-estudiante.component.scss',
})
export class CrearEstudianteComponent implements OnInit {
  public id = '0';
  public accion = '';
  public editable = true;
  public submitted = false;
  public titulo = 'Registro de estudiante';
  public regresar = '/estudiantes';
  public documentoEncontrado = false;
  public camposHabilitados = false;
  public idEstudianteGrupo = 0;
  // Grupo y grado originales al cargar el estudiante en modo editar, para detectar si hubo cambio
  private grupoOriginal: any = null;
  private gradoOriginal: any = null;

  // Sidebar y navegación por secciones
  public nuevo = false;
  public seccionActiva: 'datos-personales' | 'datos-academicos' | 'documentos' = 'datos-personales';
  public sidebarAbierto = false;

  public listas = {
    tiposIdentificacion: [] as any[],
    generos: [] as any[],
    grupos: [] as any[],
    ciudades: [] as any[],
    annos: [] as any[],
    gruposRh: [
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

  // Horarios del estudiante
  public horarios: HorarioEstudiante[] = [];
  public horariosModificados = false;

  // Días de la semana traídos del backend (BD: tabla dias_semana)
  private diasSemana: any[] = [];

  // Convenios del estudiante
  public conveniosEstudiante: ConvenioEstudiante[] = [];
  public nuevoConvenio = {
    id_convenio: '',
    fecha_inicio: '',
    fecha_fin: '',
    crear_cobros_automaticos: false
  };

  // Datos médicos dinámicos
  public gruposDatosMedicos: GrupoDatosDinamicos[] = [];
  public datosMedicosModificados = false;

  // Datos adicionales dinámicos
  public gruposDatosAdicionales: GrupoDatosDinamicos[] = [];
  public datosAdicionalesModificados = false;

  // Control de carga perezosa por sección (solo en edición/consulta).
  // Una vez cargada una sección no se vuelve a consultar al regresar a ella.
  private horariosCargados = false;
  private conveniosCargados = false;
  private datosMedicosCargados = false;
  private datosAdicionalesCargados = false;

  public model: EstudianteModel = {
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
    ocupacion: 'Estudiante',
    fechaIngreso: '',
    telefonoEmergencia: '',
    eps: '',
    alimentacion: false,
    permanente: false,
    grupo: '',
    grado: '',
    anno: '',
    idEstudiante: '',
    activo: 1,
  };
  public estudianteActivoSwitch = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tiposIdentificacionService: TiposIdentificacionService,
    private generosService: GenerosService,
    private gruposService: GruposService,
    private personasService: PersonasService,
    private estudiantesService: EstudiantesService,
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
          this.titulo = 'Crear estudiante';
          this.establecerValoresPorDefecto();
          break;
        case 'editar':
          this.editable = true;
          this.camposHabilitados = true;
          this.documentoEncontrado = true;
          this.nuevo = false;
          this.titulo = 'Editar estudiante';
          this.regresar = '/estudiantes/opciones/' + this.id;
          this.obtenerEstudiante(this.id);
          break;
        case 'consultar':
          this.editable = false;
          this.camposHabilitados = false;
          this.documentoEncontrado = true;
          this.nuevo = false;
          this.titulo = 'Consultar estudiante';
          this.regresar = '/estudiantes/opciones/' + this.id;
          this.obtenerEstudiante(this.id);
          break;
        default:
          this.editable = true;
          this.camposHabilitados = false;
          this.nuevo = true;
          this.titulo = 'Crear estudiante';
          this.establecerValoresPorDefecto();
          break;
      }
    });

    this.consultarTiposIdentificacion();
    this.consultarGeneros();
    this.consultarGrupos();
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

  consultarGrupos() {
    this.gruposService.obtenerTodos().subscribe((response: any) => {
      this.listas.grupos = response.body;
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
            this.estudiantesService.verificarDuplicados(persona.id).subscribe({
              next: (respuesta: any) => {
                if (respuesta.existe) {
                  Swal.fire({
                    title: 'Estudiante existente',
                    text: 'Esta persona ya está registrada como estudiante en el sistema',
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
                console.error('Error al verificar estudiante', error);
                Swal.fire({
                  title: 'Error',
                  text: 'Error al verificar si la persona ya está registrada como estudiante',
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
    this.model.ocupacion = 'Estudiante';
  }

  obtenerEstudiante(id: any) {
    if (id && id !== '0') {
      this.estudiantesService.obtenerById(id).subscribe({
        next: (response: any) => {
          const estudiante = response.body[0];
          if (estudiante) {
            this.personasService.obtenerById(estudiante.id_persona).subscribe({
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
                  this.model.ocupacion = 'Estudiante';
                  const nombreCompleto = this.construirNombreCompleto(persona);
                  if (this.accion === 'editar') {
                    this.titulo = `Editar estudiante: ${nombreCompleto}`;
                  } else if (this.accion === 'consultar') {
                    this.titulo = `Consultar estudiante: ${nombreCompleto}`;
                  }
                }

                this.model.idEstudiante = estudiante.id;
                this.model.fechaIngreso = estudiante.fecha_ingreso;
                this.model.telefonoEmergencia = estudiante.telefono_emergencia;
                this.model.eps = estudiante.eps;
                this.model.alimentacion = Boolean(estudiante.alimentacion);
                this.model.permanente = Boolean(estudiante.permanente);
                this.model.anno = estudiante.anno;
                this.model.activo = estudiante.activo;
                this.estudianteActivoSwitch = estudiante.activo == 1 || estudiante.activo === '1';

                this.obtenerGrupoEstudiante(estudiante.id);
              },
              error: (error: any) => {
                console.error('Error al obtener persona', error);
                Swal.fire('Error', 'Error al cargar los datos de la persona', 'error');
              },
            });
          }
        },
        error: (error: any) => {
          console.error('Error al obtener estudiante', error);
          Swal.fire('Error', 'Error al cargar los datos del estudiante', 'error');
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

  cambiarEstadoEstudiante(): void {
    this.model.activo = this.estudianteActivoSwitch ? 1 : 0;
  }

  obtenerGrupoEstudiante(idEstudiante: any) {
    this.estudiantesService.obtenerGrupoByEstudiante(idEstudiante).subscribe({
      next: (response: any) => {
        if (response.body && response.body.length > 0) {
          this.model.grupo = response.body[0].id_grupo;
          this.idEstudianteGrupo = response.body[0].id;
          // Guardar valores originales para luego detectar si el usuario los cambió
          this.grupoOriginal = response.body[0].id_grupo;
          this.gradoOriginal = response.body[0].id_grado;
        }
      },
      error: (error: any) => {
        console.error('Error al obtener grupo del estudiante', error);
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
            this.crearActualizarEstudiante(persona);
          },
          error: (error: any) => {
            console.error('Error al crear persona', error);
            Swal.fire({ title: 'Error', text: 'Error al crear la persona', icon: 'error', confirmButtonText: 'Aceptar' });
          },
        });
      } else {
        this.estudiantesService.verificarDuplicados(persona.idPersona).subscribe({
          next: (respuesta: any) => {
            if (respuesta.existe) {
              Swal.fire({ title: 'Estudiante existente', text: 'Esta persona ya está registrada como estudiante en el sistema', icon: 'warning', confirmButtonText: 'Aceptar' });
              return;
            } else {
              this.crearActualizarEstudiante(persona);
            }
          },
          error: (error: any) => {
            console.error('Error al verificar estudiante', error);
            Swal.fire({ title: 'Error', text: 'Error al verificar si la persona ya está registrada como estudiante', icon: 'error', confirmButtonText: 'Aceptar' });
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
        this.crearActualizarEstudiante(persona);
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
    persona.ocupacion = 'Estudiante';

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

  crearActualizarEstudiante(estudiante: any) {
    const estudianteData = {
      id: estudiante.idEstudiante || 0,
      id_persona: estudiante.idPersona,
      fecha_ingreso: estudiante.fechaIngreso,
      telefono_emergencia: estudiante.telefonoEmergencia || '',
      eps: estudiante.eps || '',
      alimentacion: estudiante.alimentacion ? 1 : 0,
      permanente: estudiante.permanente ? 1 : 0,
      anno: estudiante.anno || new Date().getFullYear(),
      activo: estudiante.activo,
    };

    if (this.accion === 'crear') {
      this.estudiantesService.crear(estudianteData).subscribe({
        next: (response: any) => {
          estudiante.idEstudiante = response.id;
          this.model.idEstudiante = response.id;
          this.asignarGrupo(estudiante);
        },
        error: (error: any) => this.manejarError(error, 'crear'),
      });
    } else if (this.accion === 'editar') {
      this.estudiantesService.actualizar(estudianteData).subscribe({
        next: (response: any) => {
          this.asignarGrupo(estudiante);
        },
        error: (error: any) => this.manejarError(error, 'actualizar'),
      });
    }
  }

  asignarGrupo(estudiante: any) {
    if (!estudiante.grupo) {
      Swal.fire({
        title: 'Advertencia',
        text: 'No se ha seleccionado un grupo para el estudiante.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // En modo editar, si el grupo y el grado no cambiaron respecto a los valores
    // originales, no rotar el registro de estudiantes_x_grupos: solo confirmar éxito.
    if (this.accion === 'editar') {
      const grupoIgual = String(estudiante.grupo) === String(this.grupoOriginal);
      const gradoActual = estudiante.grado || null;
      const gradoOriginal = this.gradoOriginal || null;
      const gradoIgual = String(gradoActual) === String(gradoOriginal);

      if (grupoIgual && gradoIgual) {
        Swal.fire({
          title: 'Éxito',
          text: 'Estudiante actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.volver();
        });
        return;
      }
    }

    this.estudiantesService
      .inactivarEstudianteGrupo(this.idEstudianteGrupo)
      .subscribe((response: any) => {
        this.estudiantesService
          .activarEstudianteGrupo(estudiante.idEstudiante, estudiante.grupo, estudiante.anno || new Date().getFullYear(), estudiante.grado)
          .subscribe({
            next: (response: any) => {
              Swal.fire({
                title: 'Éxito',
                text: this.accion === 'crear'
                  ? 'Estudiante creado correctamente'
                  : 'Estudiante actualizado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
              }).then(() => {
                this.volver();
              });
            },
            error: (error: any) => {
              console.error('Error al asignar grupo', error);
              Swal.fire({ title: 'Error', text: 'Error al asignar el grupo al estudiante', icon: 'error', confirmButtonText: 'Aceptar' });
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
      this.model.grupo &&
      this.model.fechaIngreso,
    );
  }

  manejarError(error: any, accion: string): void {
    console.error(`Error al ${accion} estudiante`, error);
    Swal.fire({
      title: 'Error',
      text: `Error al ${accion} el estudiante`,
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
      ocupacion: 'Estudiante',
      fechaIngreso: '',
      telefonoEmergencia: '',
      eps: '',
      alimentacion: false,
      permanente: false,
      grupo: '',
      grado: '',
      anno: '',
      idEstudiante: '',
      activo: 1,
    };
    this.submitted = false;
    this.documentoEncontrado = false;
    this.camposHabilitados = false;
    this.estudianteActivoSwitch = true;
    this.horarios = [];
    this.conveniosEstudiante = [];
    this.horariosModificados = false;
    this.gruposDatosMedicos = [];
    this.gruposDatosAdicionales = [];
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
    if (this.model.idEstudiante && this.model.idEstudiante !== '0') {
      this.router.navigate(['/estudiantes/opciones/' + this.model.idEstudiante]);
    } else {
      this.router.navigate(['/estudiantes']);
    }
  }

  establecerValoresPorDefecto(): void {
    this.model.nacionalidad = 'Colombiana';
    this.model.ocupacion = 'Estudiante';
    this.model.tipoIdentificacion = 2;
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.model.fechaIngreso = `${año}-${mes}-${dia}`;
    this.model.anno = año;
    this.model.activo = 1;
    this.estudianteActivoSwitch = true;
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