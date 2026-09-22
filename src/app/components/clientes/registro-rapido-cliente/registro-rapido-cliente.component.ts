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
import { TiposIdentificacionService } from '../../../services/tipos-identificacion.service';
import { GenerosService } from '../../../services/generos.service';
import { CiudadesService } from '../../../services/ciudades.service';
import { TiposRepresentanteService } from '../../../services/tipos-representante.service';
import { UtilService } from '../../../common/constantes/util.service';

// Datos de una persona dentro del asistente (cliente o representante).
interface PersonaForm {
  id_tipo_identificacion: any;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
}

// Cliente: empresa (NIT + razón social) o persona natural (nombres).
interface ClienteForm extends PersonaForm {
  digito_verificacion: string;
  razon_social: string;
  fecha_nacimiento: string;
  id_genero: any;
  direccion: string;
  id_ciudad: any;
  telefono: string;
  correo_electronico: string;
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

  // Pasos del asistente: 1=captura del RUT + IA, 2=revisión de datos.
  public paso = 1;
  public analizando = false;
  public guardando = false;

  // Archivo del RUT: sirve tanto para la IA como para subirlo luego como documento.
  public archivoRut?: File;
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
    ciudades: [] as any[],
  };

  // Modelo del cliente.
  public cliente: ClienteForm = this.clienteVacio();

  // Plan / año.
  public id_plan: any = '';
  public anno: number = new Date().getFullYear();

  // Representantes: se arranca con uno (el representante legal que trae el RUT);
  // el usuario puede agregar más.
  public representantes: RepresentanteForm[] = [this.representanteVacio()];

  constructor(
    private router: Router,
    private clientesService: ClientesService,
    private usuariosService: UsuariosService,
    private documentosService: DocumentosPersonasService,
    private tiposDocumentosService: TiposDocumentosService,
    private planesService: PlanesService,
    private tiposIdentificacionService: TiposIdentificacionService,
    private generosService: GenerosService,
    private ciudadesService: CiudadesService,
    private tiposRepresentanteService: TiposRepresentanteService,
    private utilService: UtilService,
  ) {
    this.camaraDisponible = !!(navigator.mediaDevices?.getUserMedia);
  }

  ngOnInit(): void {
    this.cargarListas();
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

    this.ciudadesService.obtenerTodos().subscribe({
      next: (r: any) => (this.listas.ciudades = r.body || r),
      error: (e) => console.error('Error cargando ciudades:', e),
    });
  }

  // ============================================================
  // CÁMARA / ARCHIVO
  // ============================================================

  activarCamara() {
    this.modoCamara = true;
    this.archivoRut = undefined;
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
    this.archivoRut = new File([blob], `rut_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    this.detenerCamara();
    this.modoCamara = false;
  }

  // Descartar la foto tomada y volver a abrir la cámara.
  repetirToma() {
    this.archivoRut = undefined;
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
    this.archivoRut = file;
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

  analizarRut() {
    if (!this.archivoRut) {
      Swal.fire('Atención', 'Toma o selecciona la foto del RUT primero', 'warning');
      return;
    }

    this.analizando = true;
    this.clientesService.analizarRut(this.archivoRut).subscribe({
      next: (respuesta: any) => {
        this.analizando = false;
        if (respuesta && respuesta.datos) {
          this.prellenarDesdeIA(respuesta.datos);
          this.paso = 2;
          this.avisarDiferenciaDv(respuesta.datos);
        } else {
          Swal.fire('Atención', 'No se pudieron leer datos del documento. Continúa llenando manualmente.', 'info');
          this.prepararManual();
          this.paso = 2;
        }
      },
      error: (error: any) => {
        this.analizando = false;
        console.error('Error al analizar el RUT:', error);
        Swal.fire({
          title: 'No se pudo leer el documento',
          text: 'Puedes continuar y llenar los datos manualmente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continuar manual',
          cancelButtonText: 'Reintentar',
        }).then((result) => {
          if (result.isConfirmed) {
            this.prepararManual();
            this.paso = 2;
          }
        });
      },
    });
  }

  // Continuar al paso 2 sin usar IA (llenado 100% manual).
  continuarManual() {
    this.prepararManual();
    this.paso = 2;
  }

  // En llenado manual el cliente arranca como empresa (NIT) y el representante
  // como representante legal con cédula; el usuario puede cambiarlos.
  private prepararManual() {
    if (!this.cliente.id_tipo_identificacion) {
      this.cliente.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('nit');
    }
    const rep = this.representantes[0];
    if (rep && !rep.id_tipo_representante) {
      rep.id_tipo_representante = this.idTipoRepresentantePorNombre('representante legal');
    }
    if (rep && !rep.id_tipo_identificacion) {
      rep.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('cedula');
    }
  }

  private prellenarDesdeIA(datos: any) {
    // Cliente: el RUT siempre trae NIT (también en persona natural).
    this.cliente.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('nit');
    this.cliente.numero_identificacion = (datos.nit || '').toString().replace(/\D/g, '');
    // Se toma el DV del RUT; si no viene, el calculado.
    this.cliente.digito_verificacion =
      datos.digito_verificacion != null && /^\d$/.test(String(datos.digito_verificacion).trim())
        ? String(datos.digito_verificacion).trim()
        : this.utilService.calcularDigitoVerificacion(this.cliente.numero_identificacion);

    // Todo cliente con NIT se identifica por razón social; en persona natural
    // se arma con sus nombres.
    const nombresNatural = [datos.primer_nombre, datos.segundo_nombre, datos.primer_apellido, datos.segundo_apellido]
      .filter(Boolean)
      .join(' ');
    this.cliente.razon_social = datos.razon_social || nombresNatural || '';

    this.cliente.direccion = datos.direccion || '';
    this.cliente.id_ciudad = this.buscarIdPorNombre(this.listas.ciudades, datos.ciudad);
    this.cliente.telefono = datos.telefono || '';
    this.cliente.correo_electronico = datos.correo_electronico || '';

    // Representante legal principal -> representante 0
    this.prellenarRepresentanteDesdeIA(0, datos.representante_legal);
  }

  private prellenarRepresentanteDesdeIA(indice: number, datosRep: any) {
    const rep = this.representantes[indice];
    // Tipo de representante: representante legal (por nombre); el usuario confirma.
    rep.id_tipo_representante = this.idTipoRepresentantePorNombre('representante legal');
    if (!datosRep) {
      rep.id_tipo_identificacion = this.idTipoIdentificacionPorNombre('cedula');
      return;
    }
    rep.primer_nombre = datosRep.primer_nombre || '';
    rep.segundo_nombre = datosRep.segundo_nombre || '';
    rep.primer_apellido = datosRep.primer_apellido || '';
    rep.segundo_apellido = datosRep.segundo_apellido || '';
    rep.numero_identificacion = (datosRep.numero_identificacion || '').toString().replace(/\D/g, '');
    // Documento del representante: el que trae el RUT si existe en la lista, si no cédula.
    rep.id_tipo_identificacion =
      this.idTipoIdentificacionPorNombre(datosRep.tipo_documento || '') ||
      this.idTipoIdentificacionPorNombre('cedula');
  }

  // Se toma el DV del RUT, pero si no coincide con el calculado casi siempre es
  // porque la IA leyó mal un dígito del NIT: se avisa para que lo revisen.
  private avisarDiferenciaDv(datos: any) {
    const leido = (datos.digito_verificacion ?? '').toString().trim();
    const calculado = (datos.digito_verificacion_calculado ?? '').toString().trim();
    if (leido && calculado && leido !== calculado) {
      Swal.fire({
        title: 'Revisa el NIT',
        text: `El DV del RUT (${leido}) no coincide con el calculado para el NIT leído (${calculado}). Verifica que el número del NIT esté bien.`,
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
    }
  }

  // Indica si el tipo de identificación seleccionado para el cliente es NIT.
  get clienteEsNit(): boolean {
    const tipo = (this.listas.tiposIdentificacion || []).find(
      (t: any) => String(t.id) === String(this.cliente.id_tipo_identificacion),
    );
    return !!tipo && this.normalizar(tipo.nombre) === 'nit';
  }

  // Si el usuario corrige el NIT a mano, el DV se recalcula.
  onNumeroClienteChange(valor: string) {
    this.cliente.numero_identificacion = valor;
    if (this.clienteEsNit) {
      this.cliente.digito_verificacion = this.utilService.calcularDigitoVerificacion(valor);
    }
  }

  onTipoClienteChange() {
    this.cliente.digito_verificacion = this.clienteEsNit
      ? this.utilService.calcularDigitoVerificacion(this.cliente.numero_identificacion)
      : '';
  }

  // Resuelve el id del tipo de identificación buscando por nombre (case-insensitive,
  // ignorando tildes). Si no lo encuentra, devuelve '' para que el usuario elija.
  private idTipoIdentificacionPorNombre(nombre: string): any {
    return this.buscarIdPorNombre(this.listas.tiposIdentificacion, nombre);
  }

  private idTipoRepresentantePorNombre(nombre: string): any {
    return this.buscarIdPorNombre(this.listas.tiposRepresentante, nombre);
  }

  private buscarIdPorNombre(lista: any[], nombre: string | null | undefined): any {
    if (!lista || !nombre) {
      return '';
    }
    const objetivo = this.normalizar(nombre);
    const encontrado = lista.find((x) => this.normalizar(x.nombre) === objetivo);
    return encontrado ? encontrado.id : '';
  }

  private normalizar(texto: string | null | undefined): string {
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
    if (!this.cliente.id_tipo_identificacion || !this.cliente.numero_identificacion) {
      Swal.fire('Campos incompletos', 'El cliente debe tener tipo y número de identificación', 'warning');
      return false;
    }
    if (this.clienteEsNit) {
      if (!this.cliente.razon_social || !this.cliente.razon_social.trim()) {
        Swal.fire('Campos incompletos', 'El cliente debe tener razón social', 'warning');
        return false;
      }
    } else if (!this.cliente.primer_nombre || !this.cliente.primer_apellido) {
      Swal.fire('Campos incompletos', 'El cliente debe tener al menos primer nombre y primer apellido', 'warning');
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
        Swal.fire('Campos incompletos', 'Selecciona el tipo de representante', 'warning');
        return false;
      }
      // Con acceso al portal se le crea usuario, y usuarios.correo_electronico es obligatorio.
      if (ac.autorizado_sistema) {
        const correo = (ac.correo_electronico || '').trim();
        if (!correo) {
          Swal.fire('Campos incompletos', 'El representante con acceso al portal debe tener correo electrónico', 'warning');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
          Swal.fire('Correo inválido', `El correo ${correo} no es válido`, 'warning');
          return false;
        }
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
    const esNit = this.clienteEsNit;
    // El back conserva la llave 'nino' del payload por compatibilidad.
    const payload = {
      nino: {
        id_tipo_identificacion: this.cliente.id_tipo_identificacion,
        numero_identificacion: this.cliente.numero_identificacion,
        digito_verificacion: esNit ? this.cliente.digito_verificacion || null : null,
        razon_social: esNit ? this.cliente.razon_social.trim() : null,
        primer_nombre: esNit ? null : this.cliente.primer_nombre,
        segundo_nombre: esNit ? null : this.cliente.segundo_nombre || null,
        primer_apellido: esNit ? null : this.cliente.primer_apellido,
        segundo_apellido: esNit ? null : this.cliente.segundo_apellido || null,
        fecha_nacimiento: esNit ? null : this.cliente.fecha_nacimiento || null,
        id_genero: esNit ? null : this.cliente.id_genero || null,
        direccion: this.cliente.direccion || null,
        id_ciudad: this.cliente.id_ciudad || null,
        telefono: this.cliente.telefono || null,
        correo_electronico: this.cliente.correo_electronico || null,
        fecha_ingreso: this.cliente.fecha_ingreso || new Date().toISOString().substring(0, 10),
      },
      id_plan: this.id_plan,
      anno: this.anno || new Date().getFullYear(),
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
        // 1) Crear usuarios de los representantes con acceso al portal (usuario y
        //    clave = número de identificación). El back devuelve los representantes
        //    en el mismo orden en que se enviaron.
        const conAcceso = (respuesta.representantes || []).filter(
          (_: any, i: number) => incluidos[i] && incluidos[i].autorizado_sistema,
        );
        this.crearUsuariosRepresentantes(conAcceso);
        // 2) Subir el RUT como documento del cliente.
        this.subirRut(respuesta.id_persona_nino);
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

  // Sube el archivo del RUT como documento del cliente, resolviendo el tipo de
  // documento "RUT" por código o nombre. Cierra el flujo al terminar.
  private subirRut(idPersonaCliente: string) {
    if (!this.archivoRut || !idPersonaCliente) {
      this.finalizar();
      return;
    }

    this.tiposDocumentosService.obtenerPorTipoPersona('cliente').subscribe({
      next: (response: any) => {
        const tipos = response.body || response || [];
        const tipoRut = tipos.find(
          (t: any) => this.normalizar(t.codigo || '') === 'rut' || this.normalizar(t.nombre) === 'rut',
        );

        if (!tipoRut) {
          // No hay tipo de documento "RUT" para clientes: el cliente quedó creado,
          // solo no se adjunta el archivo. Se informa sin bloquear.
          console.warn('No se encontró el tipo de documento "RUT"; no se adjunta el archivo.');
          this.finalizar();
          return;
        }

        const formData = new FormData();
        formData.append('archivo', this.archivoRut as File);
        formData.append('id_persona', idPersonaCliente);
        formData.append('id_tipo_documento', tipoRut.id.toString());
        const idUsuario = this.utilService.obtenerIdUsuarioActual();
        if (idUsuario) {
          formData.append('id_usuario_subio', idUsuario.toString());
        }

        this.documentosService.subirDocumento(formData).subscribe({
          next: () => this.finalizar(),
          error: (error: any) => {
            console.error('Error al subir el RUT como documento:', error);
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

  private clienteVacio(): ClienteForm {
    return {
      id_tipo_identificacion: '',
      numero_identificacion: '',
      digito_verificacion: '',
      razon_social: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      fecha_nacimiento: '',
      id_genero: '',
      direccion: '',
      id_ciudad: '',
      telefono: '',
      correo_electronico: '',
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