import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { ClientesService } from '../../../services/clientes.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { DocumentosPersonasService } from '../../../services/documentos-personas.service';
import { TiposDocumentosService } from '../../../services/tipos-documentos.service';
import { PlanesService } from '../../../services/planes.service';
import { DiasSemanaService } from '../../../services/dias-semana.service';
import { TiposIdentificacionService } from '../../../services/tipos-identificacion.service';
import { GenerosService } from '../../../services/generos.service';
import { TiposRepresentanteService } from '../../../services/tipos-representante.service';
import { UtilService } from '../../../common/constantes/util.service';

// Datos de una persona dentro del asistente (niño o representante).
interface PersonaForm {
  id_tipo_identificacion: any;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
}

interface NinoForm extends PersonaForm {
  fecha_nacimiento: string;
  id_genero: any;
  fecha_ingreso: string;
}

interface RepresentanteForm extends PersonaForm {
  telefono: string;
  correo_electronico: string;
  id_tipo_representante: any;
  es_responsable_pago: boolean;
  autorizado_recoger: boolean;
  autorizado_sistema: boolean;
  incluir: boolean; // si false, no se registra este representante
}

interface DiaHorario {
  id_dia_semana: number;
  nombre_dia: string;
  seleccionado: boolean;
}

@Component({
  selector: 'app-registro-rapido-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './registro-rapido-cliente.component.html',
  styleUrl: './registro-rapido-cliente.component.scss',
})
export class RegistroRapidoClienteComponent implements OnInit, OnDestroy {
  titulo = 'Registro rápido de cliente';
  regresar = '/clientes/gestion';

  // Pasos del asistente: 1=captura+IA, 2=revisión de datos.
  public paso = 1;
  public analizando = false;
  public guardando = false;

  // Archivo del registro civil: sirve tanto para la IA como para subirlo luego.
  public archivoRegistroCivil?: File;
  public previewUrl?: string;

  // Cámara (mismo patrón que documentos-persona: trasera por defecto, voltear, repetir).
  public modoCamara = false;
  public camaraActiva = false;
  public camaraDisponible = false;
  public stream?: MediaStream;

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  // Parámetros de salida de la foto: legible pero liviana (igual que documentos-persona).
  private readonly DIMENSION_MAX = 1600;
  private readonly CALIDAD_JPG = 0.8;

  // Listas para los selects.
  public listas = {
    tiposIdentificacion: [] as any[],
    generos: [] as any[],
    tiposRepresentante: [] as any[],
    planes: [] as any[],
  };

  // Modelo del niño.
  public nino: NinoForm = this.ninoVacio();

  // Plan / año.
  public id_plan: any = '';
  public anno: number = new Date().getFullYear();

  // Horario simple: dos horas (entrada/salida) que aplican a los días marcados.
  // Se preseleccionan lunes a viernes.
  public horaEntrada = '08:00';
  public horaSalida = '18:00';
  public dias: DiaHorario[] = [];
  private diasSemana: any[] = [];

  // Representantes: se arranca con dos (padre y madre); el usuario puede desmarcar uno.
  public representantes: RepresentanteForm[] = [this.representanteVacio(), this.representanteVacio()];

  constructor(
    private router: Router,
    private clientesService: ClientesService,
    private usuariosService: UsuariosService,
    private documentosService: DocumentosPersonasService,
    private tiposDocumentosService: TiposDocumentosService,
    private planesService: PlanesService,
    private diasSemanaService: DiasSemanaService,
    private tiposIdentificacionService: TiposIdentificacionService,
    private generosService: GenerosService,
    private tiposRepresentanteService: TiposRepresentanteService,
    private utilService: UtilService,
  ) {
    this.camaraDisponible = !!(navigator.mediaDevices?.getUserMedia);
  }

  ngOnInit(): void {
    this.cargarListas();
    this.inicializarHorarios();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  // ============================================================
  // CARGA DE LISTAS
  // ============================================================

  cargarListas() {
    this.tiposIdentificacionService.obtenerTodos().subscribe({
      next: (r: any) => (this.listas.tiposIdentificacion = r.body || r),
      error: (e) => console.error('Error cargando tipos de identificación:', e),
    });

    this.generosService.obtenerTodos().subscribe({
      next: (r: any) => (this.listas.generos = r.body || r),
      error: (e) => console.error('Error cargando géneros:', e),
    });

    this.tiposRepresentanteService.obtenerTodos().subscribe({
      next: (r: any) => (this.listas.tiposRepresentante = r.body || r),
      error: (e) => console.error('Error cargando tipos de representante:', e),
    });

    this.planesService.obtenerTodos().subscribe({
      next: (r: any) => (this.listas.planes = r.body || r),
      error: (e) => console.error('Error cargando planes:', e),
    });
  }

  // ============================================================
  // HORARIOS (grilla desde dias_semana)
  // ============================================================

  inicializarHorarios() {
    this.diasSemanaService.obtenerTodos().subscribe({
      next: (response: any) => {
        this.diasSemana = response.body || response || [];
        if (this.diasSemana.length > 0) {
          this.armarDiasDesdeDiasSemana();
        } else {
          this.armarDiasFallback();
        }
      },
      error: (error: any) => {
        console.error('Error al obtener días de la semana:', error);
        this.armarDiasFallback();
      },
    });
  }

  private armarDiasDesdeDiasSemana() {
    this.dias = this.diasSemana.map((d: any) => ({
      id_dia_semana: d.id,
      nombre_dia: d.nombre,
      // Preselecciona los días entre semana (lunes a viernes) por nombre.
      seleccionado: this.esEntreSemana(d.nombre),
    }));
  }

  // Fallback mínimo si dias_semana falla por completo; no es la fuente de verdad.
  private armarDiasFallback() {
    const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    this.dias = nombres.map((nombre, i) => ({
      id_dia_semana: i + 1,
      nombre_dia: nombre,
      seleccionado: this.esEntreSemana(nombre),
    }));
  }

  private esEntreSemana(nombre: string): boolean {
    const n = this.normalizar(nombre);
    return ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].includes(n);
  }

  // ============================================================
  // CÁMARA / ARCHIVO
  // ============================================================

  activarCamara() {
    this.modoCamara = true;
    this.archivoRegistroCivil = undefined;
    this.previewUrl = undefined;

    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream;
        setTimeout(() => {
          if (this.videoElement) {
            const video = this.videoElement.nativeElement;
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              video
                .play()
                .then(() => (this.camaraActiva = true))
                .catch((error) => console.error('Error al reproducir video:', error));
            };
          }
        }, 100);
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara:', error);
        Swal.fire('Error', 'No se pudo acceder a la cámara', 'error');
        this.modoCamara = false;
      });
  }

  detenerCamara() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
    }
    this.camaraActiva = false;
  }

  cambiarCamara() {
    if (!this.stream) {
      return;
    }
    const videoTrack = this.stream.getVideoTracks()[0];
    const currentFacingMode = videoTrack.getSettings().facingMode;
    this.detenerCamara();

    const constraints = {
      video: {
        facingMode: currentFacingMode === 'user' ? 'environment' : 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream;
        if (this.videoElement) {
          const video = this.videoElement.nativeElement;
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().then(() => (this.camaraActiva = true));
          };
        }
      })
      .catch((error) => {
        console.error('Error al cambiar cámara:', error);
        this.activarCamara();
      });
  }

  capturarFoto() {
    if (!this.videoElement || !this.canvasElement) {
      return;
    }
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      Swal.fire('Error', 'La cámara no está lista. Intenta de nuevo.', 'error');
      return;
    }

    // Redimensionar por el lado más largo, manteniendo proporción.
    const anchoOriginal = video.videoWidth;
    const altoOriginal = video.videoHeight;
    const ladoMayor = Math.max(anchoOriginal, altoOriginal);
    let ancho = anchoOriginal;
    let alto = altoOriginal;
    if (ladoMayor > this.DIMENSION_MAX) {
      const escala = this.DIMENSION_MAX / ladoMayor;
      ancho = Math.round(anchoOriginal * escala);
      alto = Math.round(altoOriginal * escala);
    }
    canvas.width = ancho;
    canvas.height = alto;
    context.drawImage(video, 0, 0, ancho, alto);

    const imageDataUrl = canvas.toDataURL('image/jpeg', this.CALIDAD_JPG);
    this.previewUrl = imageDataUrl;

    // dataURL -> Blob -> File (síncrono).
    const arr = imageDataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    this.archivoRegistroCivil = new File([blob], `registro_civil_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    this.detenerCamara();
    this.modoCamara = false;
  }

  // Descartar la foto tomada y volver a abrir la cámara.
  repetirToma() {
    this.archivoRegistroCivil = undefined;
    this.previewUrl = undefined;
    this.activarCamara();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('Error', 'El archivo no puede superar 10MB', 'error');
      event.target.value = '';
      return;
    }
    const extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !extensionesPermitidas.includes(extension)) {
      Swal.fire('Error', 'Solo se permiten archivos PDF, JPG, JPEG o PNG', 'error');
      event.target.value = '';
      return;
    }

    this.detenerCamara();
    this.modoCamara = false;
    this.archivoRegistroCivil = file;
    // Solo previsualizamos imágenes; el PDF no se previsualiza.
    if (extension === 'pdf') {
      this.previewUrl = undefined;
    } else {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ============================================================
  // ANÁLISIS CON IA
  // ============================================================

  analizarRegistroCivil() {
    if (!this.archivoRegistroCivil) {
      Swal.fire('Atención', 'Toma o selecciona la foto del registro civil primero', 'warning');
      return;
    }

    this.analizando = true;
    this.clientesService.analizarRegistroCivil(this.archivoRegistroCivil).subscribe({
      next: (respuesta: any) => {
        this.analizando = false;
        if (respuesta && respuesta.datos) {
          this.prellenarDesdeIA(respuesta.datos);
          this.paso = 2;
        } else {
          Swal.fire('Atención', 'No se pudieron leer datos del documento. Continúa llenando manualmente.', 'info');
          this.paso = 2;
        }
      },
      error: (error: any) => {
        this.analizando = false;
        console.error('Error al analizar el registro civil:', error);
        Swal.fire({
          title: 'No se pudo leer el documento',
          text: 'Puedes continuar y llenar los datos manualmente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar manual',
          cancelButtonText: 'Reintentar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.paso = 2;
          }
        });
      },
    });
  }

  // Continuar al paso 2 sin usar IA (llenado 100% manual).
  continuarManual() {
    this.paso = 2;
  }

  private prellenarDesdeIA(datos: any) {
    // Niño
    if (datos.nino) {
      this.nino.primer_nombre = datos.nino.primer_nombre || '';
      this.nino.segundo_nombre = datos.nino.segundo_nombre || '';
      this.nino.primer_apellido = datos.nino.primer_apellido || '';
      this.nino.segundo_apellido = datos.nino.segundo_apellido || '';
      this.nino.numero_identificacion = datos.nino.numero_identificacion || '';
      this.nino.fecha_nacimiento = datos.nino.fecha_nacimiento || '';
      // Tipo de identificación del niño: NUIP (por nombre).
      this.nino.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('nuip');
      // Género por nombre (sexo del registro civil).
      this.nino.id_genero = this.idGeneroPorNombre(datos.nino.sexo);
    }

    // Padre -> representante 0
    this.prellenarRepresentanteDesdeIA(0, datos.padre, 'padre');
    // Madre -> representante 1
    this.prellenarRepresentanteDesdeIA(1, datos.madre, 'madre');
  }

  private prellenarRepresentanteDesdeIA(indice: number, datosAcud: any, tipoNombre: string) {
    if (!datosAcud) {
      // Sin datos: se deja el representante desmarcado para no obligar a registrarlo.
      this.representantes[indice].incluir = false;
      return;
    }
    const tienesDatos =
      datosAcud.primer_nombre ||
      datosAcud.primer_apellido ||
      datosAcud.numero_identificacion;

    const ac = this.representantes[indice];
    ac.primer_nombre = datosAcud.primer_nombre || '';
    ac.segundo_nombre = datosAcud.segundo_nombre || '';
    ac.primer_apellido = datosAcud.primer_apellido || '';
    ac.segundo_apellido = datosAcud.segundo_apellido || '';
    ac.numero_identificacion = datosAcud.numero_identificacion || '';
    // Documento del representante: por defecto cédula (por nombre); el usuario puede cambiarlo.
    ac.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('cedula');
    // Tipo de representante (padre/madre) por nombre; el usuario confirma.
    ac.id_tipo_representante = this.idTipoRepresentantePorNombre(tipoNombre);
    ac.incluir = !!tienesDatos;
  }

  // Resuelve el id del tipo de identificación buscando por nombre (case-insensitive,
  // ignorando tildes). Si no lo encuentra, devuelve '' para que el usuario elija.
  private idTipoIdentificacionPorNombre(nombre: string): any {
    return this.buscarIdPorNombre(this.listas.tiposIdentificacion, nombre);
  }

  private idGeneroPorNombre(nombre: string | null): any {
    if (!nombre) {
      return '';
    }
    return this.buscarIdPorNombre(this.listas.generos, nombre);
  }

  private idTipoRepresentantePorNombre(nombre: string): any {
    return this.buscarIdPorNombre(this.listas.tiposRepresentante, nombre);
  }

  private buscarIdPorNombre(lista: any[], nombre: string): any {
    if (!lista || !nombre) {
      return '';
    }
    const objetivo = this.normalizar(nombre);
    const encontrado = lista.find((x) => this.normalizar(x.nombre) === objetivo);
    return encontrado ? encontrado.id : '';
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // ============================================================
  // GUARDADO
  // ============================================================

  private representantesIncluidos(): RepresentanteForm[] {
    return this.representantes.filter((a) => a.incluir);
  }

  private validar(): boolean {
    if (!this.nino.primer_nombre || !this.nino.primer_apellido) {
      Swal.fire('Campos incompletos', 'El niño debe tener al menos primer nombre y primer apellido', 'warning');
      return false;
    }
    if (!this.nino.id_tipo_identificacion || !this.nino.numero_identificacion) {
      Swal.fire('Campos incompletos', 'El niño debe tener tipo y número de identificación', 'warning');
      return false;
    }
    if (!this.id_plan) {
      Swal.fire('Campos incompletos', 'Selecciona el plan del cliente', 'warning');
      return false;
    }
    const incluidos = this.representantesIncluidos();
    if (incluidos.length === 0) {
      Swal.fire('Campos incompletos', 'Debe registrar al menos un representante', 'warning');
      return false;
    }
    for (const ac of incluidos) {
      if (!ac.primer_nombre || !ac.primer_apellido) {
        Swal.fire('Campos incompletos', 'Cada representante debe tener al menos primer nombre y primer apellido', 'warning');
        return false;
      }
      if (!ac.id_tipo_identificacion || !ac.numero_identificacion) {
        Swal.fire('Campos incompletos', 'Cada representante debe tener tipo y número de identificación', 'warning');
        return false;
      }
      if (!ac.id_tipo_representante) {
        Swal.fire('Campos incompletos', 'Selecciona el tipo de representante (padre, madre, etc.)', 'warning');
        return false;
      }
    }
    return true;
  }

  guardar() {
    if (!this.validar()) {
      return;
    }

    this.guardando = true;

    const incluidos = this.representantesIncluidos();
    const payload = {
      nino: {
        id_tipo_identificacion: this.nino.id_tipo_identificacion,
        numero_identificacion: this.nino.numero_identificacion,
        primer_nombre: this.nino.primer_nombre,
        segundo_nombre: this.nino.segundo_nombre || null,
        primer_apellido: this.nino.primer_apellido,
        segundo_apellido: this.nino.segundo_apellido || null,
        fecha_nacimiento: this.nino.fecha_nacimiento || null,
        id_genero: this.nino.id_genero || null,
        fecha_ingreso: this.nino.fecha_ingreso || new Date().toISOString().substring(0, 10),
      },
      id_plan: this.id_plan,
      anno: this.anno || new Date().getFullYear(),
      horarios: this.dias
        .filter((d) => d.seleccionado)
        .map((d) => ({
          id_dia_semana: d.id_dia_semana,
          hora_entrada: this.horaEntrada + ':00',
          hora_salida: this.horaSalida + ':00',
        })),
      representantes: incluidos.map((a) => ({
        id_tipo_identificacion: a.id_tipo_identificacion,
        numero_identificacion: a.numero_identificacion,
        primer_nombre: a.primer_nombre,
        segundo_nombre: a.segundo_nombre || null,
        primer_apellido: a.primer_apellido,
        segundo_apellido: a.segundo_apellido || null,
        telefono: a.telefono || null,
        correo_electronico: a.correo_electronico || null,
        id_tipo_representante: a.id_tipo_representante,
        es_responsable_pago: a.es_responsable_pago ? 1 : 0,
        autorizado_recoger: a.autorizado_recoger ? 1 : 0,
        autorizado_sistema: a.autorizado_sistema ? 1 : 0,
      })),
    };

    this.clientesService.registroRapidoCompleto(payload).subscribe({
      next: (respuesta: any) => {
        // 1) Crear usuarios de los representantes (usuario y clave = número de identificación).
        this.crearUsuariosRepresentantes(respuesta.representantes || []);
        // 2) Subir la foto del registro civil como documento del niño.
        this.subirFotoRegistroCivil(respuesta.id_persona_nino);
      },
      error: (error: any) => {
        this.guardando = false;
        console.error('Error al registrar el cliente:', error);
        Swal.fire('Error', 'No se pudo registrar el cliente', 'error');
      },
    });
  }

  // Crea el usuario del portal de padres por cada representante devuelto por el back.
  // Best-effort: si un usuario falla, no se revierte el cliente ya creado.
  private crearUsuariosRepresentantes(representantes: any[]) {
    representantes.forEach((ac) => {
      const usuario = {
        id_persona: ac.id_persona,
        clave: ac.numero_identificacion,
        correo_electronico: ac.correo_electronico || null,
        activo: 1,
        acceso_institucional: 0,
        acceso_chat_wa: 1,
        acceso_portal_padres: 1,
      };
      this.usuariosService.crear(usuario).subscribe({
        next: () => {},
        error: (error: any) => {
          // El "Ya existe un usuario para esta persona" es esperable si el papá ya
          // tenía cuenta (otro hijo). No es un error que deba frenar el flujo.
          console.warn('No se creó usuario para el representante (puede que ya exista):', error);
        },
      });
    });
  }

  // Sube el archivo del registro civil como documento del niño, resolviendo el
  // tipo de documento "registro civil" por nombre. Cierra el flujo al terminar.
  private subirFotoRegistroCivil(idPersonaNino: string) {
    if (!this.archivoRegistroCivil || !idPersonaNino) {
      this.finalizar();
      return;
    }

    this.tiposDocumentosService.obtenerPorTipoPersona('cliente').subscribe({
      next: (response: any) => {
        const tipos = response.body || response || [];
        const tipoRC = tipos.find(
          (t: any) => this.normalizar(t.nombre).includes('registro civil') ||
                      this.normalizar(t.codigo || '').includes('registro_civil'),
        );

        if (!tipoRC) {
          // No hay tipo de documento "registro civil": el cliente quedó creado,
          // solo no se adjunta el archivo. Se informa sin bloquear.
          console.warn('No se encontró el tipo de documento "registro civil"; no se adjunta el archivo.');
          this.finalizar();
          return;
        }

        const formData = new FormData();
        formData.append('archivo', this.archivoRegistroCivil as File);
        formData.append('id_persona', idPersonaNino);
        formData.append('id_tipo_documento', tipoRC.id.toString());
        const idUsuario = this.utilService.obtenerIdUsuarioActual();
        if (idUsuario) {
          formData.append('id_usuario_subio', idUsuario.toString());
        }

        this.documentosService.subirDocumento(formData).subscribe({
          next: () => this.finalizar(),
          error: (error: any) => {
            console.error('Error al subir el registro civil como documento:', error);
            // El cliente ya está creado; se cierra igual informando.
            this.finalizar();
          },
        });
      },
      error: (error: any) => {
        console.error('Error al cargar tipos de documento:', error);
        this.finalizar();
      },
    });
  }

  private finalizar() {
    this.guardando = false;
    Swal.fire({
      title: 'Cliente registrado',
      text: 'El cliente y sus representantes se crearon correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      this.router.navigate([this.regresar]);
    });
  }

  // ============================================================
  // UTILIDADES DE UI
  // ============================================================

  volver() {
    this.router.navigate([this.regresar]);
  }

  volverAlPaso1() {
    this.paso = 1;
  }

  private ninoVacio(): NinoForm {
    return {
      id_tipo_identificacion: '',
      numero_identificacion: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      fecha_nacimiento: '',
      id_genero: '',
      fecha_ingreso: new Date().toISOString().substring(0, 10),
    };
  }

  private representanteVacio(): RepresentanteForm {
    return {
      id_tipo_identificacion: '',
      numero_identificacion: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      telefono: '',
      correo_electronico: '',
      id_tipo_representante: '',
      es_responsable_pago: true,
      autorizado_recoger: true,
      autorizado_sistema: true,
      incluir: true,
    };
  }

  agregarRepresentante() {
    this.representantes.push(this.representanteVacio());
  }

  quitarRepresentante(indice: number) {
    if (this.representantes.length <= 1) {
      return;
    }
    this.representantes.splice(indice, 1);
  }
}
