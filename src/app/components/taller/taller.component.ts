import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { TallerPublicoService } from '../../services/taller-publico.service';
import { InstitucionConfigService } from '../../services/institucion-config.service';

/**
 * Pantalla pública del taller. La abre el equipo del jardín desde el celular
 * con el enlace de la visita; no hay login.
 *
 * Todo el flujo vive en un solo componente con vistas internas a propósito:
 * es un único enlace en un celular, y separarlo en rutas obligaría a recargar
 * y a revalidar el token entre un cuestionario y el siguiente.
 *
 * La identidad es el numero de documento dentro de la visita: con el se vuelve
 * a entrar desde cualquier dispositivo y se recupera lo ya respondido.
 *
 * El id del participante queda en sessionStorage contra el token de la visita:
 * no tiene que volver a identificarse mientras siga en la misma pestaña, pero
 * una pestaña nueva arranca limpia. Antes esto vivía en el almacenamiento
 * persistente del navegador y el primero que se registraba dejaba marcado el
 * navegador entero: los demás entraban como él.
 */
@Component({
  selector: 'app-taller',
  templateUrl: './taller.component.html',
  styleUrl: './taller.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TallerComponent implements OnInit {
  public vista:
    | 'cargando'
    | 'error'
    | 'documento'
    | 'presentacion'
    | 'menu'
    | 'encuesta'
    | 'ideas'
    | 'caracter'
    | 'calificacion' = 'cargando';

  public mensajeError = '';

  public tenant = '';
  public token = '';

  public visita: any = null;
  public idParticipante: string | null = null;
  public participante: any = null;
  public estado = { encuesta: false, ideas: false, caracter: false };

  // Documento con el que se identifica. Es la identidad dentro de la visita.
  public numeroDocumento = '';

  // ---- Hoja de presentación ----
  public presentacion: any = {
    numero_documento: '',
    nombre: '',
    sobrenombre: '',
    cargo: '',
    rol_encuesta: 'docente',
  };
  public grupos: any[] = [{ grupo: '', cantidad_ninos: null }];

  // ---- Encuesta de trabajo ----
  public itemsEncuesta: any[] = [];
  public seccionesEncuesta: any[] = [];
  public respuestasEncuesta: any = {};
  public extrasEncuesta: any = {};
  public comentarioFinal = '';

  // ---- Ideas ----
  public ideas: any = {
    idea_directora: '',
    idea_docentes: '',
    idea_estudiantes: '',
    idea_padres: '',
  };

  // ---- Carácter ----
  public itemsCaracter: any[] = [];
  public respuestasCaracter: any = {};

  // ---- Calificación ----
  public itemsCalificacion: any[] = [];
  public bloquesCalificacion: any[] = [];
  public colaboradores: any[] = [];
  public respuestasCalificacion: any = {};
  public puntajesColaboradores: any = {};

  public escala = [1, 2, 3, 4, 5];

  constructor(
    private tallerService: TallerPublicoService,
    private institucionConfigService: InstitucionConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.tenant = params['tenant'];
      this.token = params['token'];

      if (!this.tenant || !this.token) {
        this.fallar('Enlace incompleto.');
        return;
      }

      // Sin sesión no hay tenant configurado: se toma del enlace antes de
      // cualquier petición, porque el interceptor lo exige.
      this.institucionConfigService.setTenantManual(this.tenant, '');

      this.cargarVisita();
    });
  }

  fallar(mensaje: string) {
    this.mensajeError = mensaje;
    this.vista = 'error';
  }

  claveAlmacenamiento(): string {
    return `taller_participante_${this.token}`;
  }

  cargarVisita() {
    this.tallerService.obtenerVisita(this.token).subscribe({
      next: (response: any) => {
        this.visita = response.body;

        const guardado = sessionStorage.getItem(this.claveAlmacenamiento());
        if (guardado) {
          this.idParticipante = guardado;
          this.cargarParticipante();
        } else {
          this.vista = 'documento';
        }
      },
      error: () => {
        this.fallar('Este enlace no está disponible o ya venció. Pídele uno nuevo al equipo de Genialisis.');
      },
    });
  }

  cargarParticipante() {
    if (!this.idParticipante) {
      this.vista = 'documento';
      return;
    }

    this.tallerService.obtenerParticipante(this.token, this.idParticipante).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.participante = body.participante;
        this.estado = body.estado;

        if (this.participante) {
          this.numeroDocumento = this.participante.numero_documento;
          this.presentacion = {
            numero_documento: this.participante.numero_documento,
            nombre: this.participante.nombre,
            sobrenombre: this.participante.sobrenombre,
            cargo: this.participante.cargo,
            rol_encuesta: this.participante.rol_encuesta,
          };
          this.grupos = (this.participante.grupos || []).length
            ? this.participante.grupos.map((g: any) => ({ ...g }))
            : [{ grupo: '', cantidad_ninos: null }];
        }

        this.vista = 'menu';
      },
      error: () => {
        // El participante guardado ya no existe (visita borrada y rehecha):
        // se limpia y se vuelve a pedir la presentación.
        sessionStorage.removeItem(this.claveAlmacenamiento());
        this.idParticipante = null;
        this.vista = 'documento';
      },
    });
  }

  // ==================================================================
  // IDENTIFICACIÓN POR DOCUMENTO
  // ==================================================================

  /**
   * Busca a la persona por documento dentro de la visita. Si ya existe entra
   * directo al menú con lo que lleva respondido; si no, abre la hoja de
   * presentación con el documento ya escrito.
   */
  identificar() {
    const documento = (this.numeroDocumento || '').trim();

    if (!documento) {
      Swal.fire('Falta el documento', 'Escribe tu número de documento.', 'warning');
      return;
    }

    this.tallerService.identificar(this.token, documento).subscribe({
      next: (respuesta: any) => {
        if (respuesta.encontrado) {
          this.idParticipante = respuesta.participante.id;
          sessionStorage.setItem(this.claveAlmacenamiento(), respuesta.participante.id);
          this.participante = respuesta.participante;
          this.estado = respuesta.estado;

          this.presentacion = {
            numero_documento: this.participante.numero_documento,
            nombre: this.participante.nombre,
            sobrenombre: this.participante.sobrenombre,
            cargo: this.participante.cargo,
            rol_encuesta: this.participante.rol_encuesta,
          };
          this.grupos = (this.participante.grupos || []).length
            ? this.participante.grupos.map((g: any) => ({ ...g }))
            : [{ grupo: '', cantidad_ninos: null }];

          this.vista = 'menu';
          return;
        }

        // No está registrado: se abre la presentación en blanco, con el
        // documento que acaba de escribir.
        this.idParticipante = null;
        this.participante = null;
        this.estado = { encuesta: false, ideas: false, caracter: false };
        this.presentacion = {
          numero_documento: documento,
          nombre: '',
          sobrenombre: '',
          cargo: '',
          rol_encuesta: 'docente',
        };
        this.grupos = [{ grupo: '', cantidad_ninos: null }];
        this.vista = 'presentacion';
      },
      error: () => {
        Swal.fire('Error', 'No pudimos identificarte. Intenta otra vez.', 'error');
      },
    });
  }

  // ==================================================================
  // HOJA DE PRESENTACIÓN
  // ==================================================================

  agregarGrupo() {
    this.grupos.push({ grupo: '', cantidad_ninos: null });
  }

  quitarGrupo(indice: number) {
    this.grupos.splice(indice, 1);
    if (this.grupos.length === 0) {
      this.grupos.push({ grupo: '', cantidad_ninos: null });
    }
  }

  guardarPresentacion() {
    if (!this.presentacion.nombre || !this.presentacion.nombre.trim()) {
      Swal.fire('Falta tu nombre', 'Escribe tu nombre para continuar.', 'warning');
      return;
    }

    const data = {
      token: this.token,
      id_participante: this.idParticipante,
      numero_documento: this.presentacion.numero_documento,
      nombre: this.presentacion.nombre,
      sobrenombre: this.presentacion.sobrenombre,
      cargo: this.presentacion.cargo,
      rol_encuesta: this.presentacion.rol_encuesta,
      grupos: this.grupos.filter((g: any) => g.grupo && g.grupo.trim()),
    };

    this.tallerService.guardarParticipante(data).subscribe({
      next: (response: any) => {
        this.idParticipante = response.id;
        sessionStorage.setItem(this.claveAlmacenamiento(), response.id);
        this.cargarParticipante();
      },
      error: (error: any) => {
        // El backend devuelve el motivo cuando el documento ya está tomado.
        const mensaje = error?.error?.error || 'No pudimos guardar tus datos. Intenta otra vez.';
        Swal.fire('Error', mensaje, 'error');
      },
    });
  }

  editarPresentacion() {
    this.vista = 'presentacion';
  }

  /**
   * Suelta al participante guardado en este dispositivo y arranca de cero.
   * El enlace de la visita es uno solo y lo reciben varias personas: sin esto,
   * el primero que se registra en un celular deja a los demás atrapados en sus
   * datos.
   */
  async cambiarDePersona() {
    const resultado = await Swal.fire({
      title: '¿Eres otra persona?',
      text: 'Vamos a pedirte tu documento de nuevo. Lo que respondió la persona anterior no se borra.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, soy otra persona',
      cancelButtonText: 'Cancelar',
    });

    if (!resultado.isConfirmed) {
      return;
    }

    sessionStorage.removeItem(this.claveAlmacenamiento());
    this.idParticipante = null;
    this.participante = null;
    this.estado = { encuesta: false, ideas: false, caracter: false };
    this.numeroDocumento = '';
    this.presentacion = {
      numero_documento: '',
      nombre: '',
      sobrenombre: '',
      cargo: '',
      rol_encuesta: 'docente',
    };
    this.grupos = [{ grupo: '', cantidad_ninos: null }];
    this.vista = 'documento';
  }

  volverAlMenu() {
    this.cargarParticipante();
  }

  // ==================================================================
  // ENCUESTA DE TRABAJO
  // ==================================================================

  abrirEncuesta() {
    if (!this.idParticipante) {
      return;
    }

    this.tallerService.obtenerEncuesta(this.token, this.idParticipante).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.itemsEncuesta = body.items || [];
        this.agruparEncuesta();

        this.respuestasEncuesta = {};
        this.extrasEncuesta = {};
        this.comentarioFinal = '';

        for (const item of this.itemsEncuesta) {
          this.respuestasEncuesta[item.id] = { lo_hace: null, tiempo: null };
        }
        for (const seccion of this.seccionesEncuesta) {
          this.extrasEncuesta[seccion.seccion] = [];
        }

        // Repinta lo ya respondido si vuelve a entrar.
        if (body.respuesta) {
          this.comentarioFinal = body.respuesta.comentario_final || '';

          for (const fila of body.respuesta.respuestas || []) {
            if (this.respuestasEncuesta[fila.id_item]) {
              this.respuestasEncuesta[fila.id_item] = {
                lo_hace: fila.lo_hace === null ? null : Number(fila.lo_hace) === 1,
                tiempo: fila.tiempo,
              };
            }
          }

          for (const extra of body.respuesta.extras || []) {
            if (!this.extrasEncuesta[extra.seccion]) {
              this.extrasEncuesta[extra.seccion] = [];
            }
            this.extrasEncuesta[extra.seccion].push({
              texto: extra.texto,
              tiempo: extra.tiempo,
            });
          }
        }

        this.vista = 'encuesta';
      },
      error: () => {
        Swal.fire('Error', 'No pudimos cargar la encuesta.', 'error');
      },
    });
  }

  // Agrupa los ítems por sección conservando el orden del catálogo.
  agruparEncuesta() {
    this.seccionesEncuesta = [];
    for (const item of this.itemsEncuesta) {
      let seccion = this.seccionesEncuesta.find((s: any) => s.seccion === item.seccion);
      if (!seccion) {
        seccion = {
          seccion: item.seccion,
          titulo: item.titulo_seccion,
          unidad: item.unidad,
          items: [],
        };
        this.seccionesEncuesta.push(seccion);
      }
      seccion.items.push(item);
    }
  }

  /**
   * Marca el si/no. Si responde que no lo hace, se limpia el tiempo: dejar un
   * numero ahi sumaria minutos de algo que no hace.
   */
  marcarHace(item: any, valor: boolean) {
    const respuesta = this.respuestasEncuesta[item.id];
    if (!respuesta) {
      return;
    }
    respuesta.lo_hace = valor;
    if (!valor) {
      respuesta.tiempo = null;
    }
  }

  agregarExtra(seccion: string) {
    if (!this.extrasEncuesta[seccion]) {
      this.extrasEncuesta[seccion] = [];
    }
    this.extrasEncuesta[seccion].push({ texto: '', tiempo: null });
  }

  quitarExtra(seccion: string, indice: number) {
    this.extrasEncuesta[seccion].splice(indice, 1);
  }

  // Subtotal de una sección, sumando lo declarado y lo agregado a mano.
  subtotalSeccion(seccion: any): number {
    let total = 0;
    for (const item of seccion.items) {
      const respuesta = this.respuestasEncuesta[item.id];
      if (respuesta && respuesta.tiempo) {
        total += Number(respuesta.tiempo);
      }
    }
    for (const extra of this.extrasEncuesta[seccion.seccion] || []) {
      if (extra.tiempo) {
        total += Number(extra.tiempo);
      }
    }
    return total;
  }

  // Total del día: solo las secciones en minutos. La semana y el corte van en
  // horas y sumarlas aquí daría un número sin sentido.
  totalMinutos(): number {
    let total = 0;
    for (const seccion of this.seccionesEncuesta) {
      if (seccion.unidad === 'minutos') {
        total += this.subtotalSeccion(seccion);
      }
    }
    return total;
  }

  totalHoras(): number {
    let total = 0;
    for (const seccion of this.seccionesEncuesta) {
      if (seccion.unidad === 'horas') {
        total += this.subtotalSeccion(seccion);
      }
    }
    return total;
  }

  guardarEncuesta() {
    const respuestas = [];
    for (const item of this.itemsEncuesta) {
      const respuesta = this.respuestasEncuesta[item.id];
      if (!respuesta) {
        continue;
      }
      respuestas.push({
        id_item: item.id,
        lo_hace: respuesta.lo_hace === null ? null : respuesta.lo_hace ? 1 : 0,
        tiempo: respuesta.tiempo,
      });
    }

    const extras = [];
    for (const seccion of Object.keys(this.extrasEncuesta)) {
      for (const extra of this.extrasEncuesta[seccion]) {
        if (extra.texto && extra.texto.trim()) {
          extras.push({ seccion: seccion, texto: extra.texto, tiempo: extra.tiempo });
        }
      }
    }

    this.tallerService
      .guardarEncuesta({
        token: this.token,
        id_participante: this.idParticipante,
        respuestas: respuestas,
        extras: extras,
        comentario_final: this.comentarioFinal,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            text: 'Gracias, ya quedó registrado.',
            timer: 1800,
            showConfirmButton: false,
          });
          this.volverAlMenu();
        },
        error: () => {
          Swal.fire('Error', 'No pudimos guardar tus respuestas.', 'error');
        },
      });
  }

  // ==================================================================
  // IDEAS
  // ==================================================================

  abrirIdeas() {
    if (!this.idParticipante) {
      return;
    }

    this.tallerService.obtenerIdeas(this.token, this.idParticipante).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.ideas = body.respuesta
          ? { ...body.respuesta }
          : {
              idea_directora: '',
              idea_docentes: '',
              idea_estudiantes: '',
              idea_padres: '',
            };
        this.vista = 'ideas';
      },
      error: () => {
        Swal.fire('Error', 'No pudimos cargar esta actividad.', 'error');
      },
    });
  }

  guardarIdeas() {
    this.tallerService
      .guardarIdeas({
        token: this.token,
        id_participante: this.idParticipante,
        ...this.ideas,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            timer: 1500,
            showConfirmButton: false,
          });
          this.volverAlMenu();
        },
        error: () => {
          Swal.fire('Error', 'No pudimos guardar tus ideas.', 'error');
        },
      });
  }

  // ==================================================================
  // CARÁCTER
  // ==================================================================

  abrirCaracter() {
    if (!this.idParticipante) {
      return;
    }

    this.tallerService.obtenerCaracter(this.token, this.idParticipante).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.itemsCaracter = body.items || [];
        this.respuestasCaracter = {};

        for (const fila of body.respuestas || []) {
          this.respuestasCaracter[fila.id_item] = fila.id_opcion;
        }

        this.vista = 'caracter';
      },
      error: () => {
        Swal.fire('Error', 'No pudimos cargar las preguntas.', 'error');
      },
    });
  }

  guardarCaracter() {
    const respuestas = [];
    for (const item of this.itemsCaracter) {
      const idOpcion = this.respuestasCaracter[item.id];
      if (idOpcion) {
        respuestas.push({ id_item: item.id, id_opcion: idOpcion });
      }
    }

    this.tallerService
      .guardarCaracter({
        token: this.token,
        id_participante: this.idParticipante,
        respuestas: respuestas,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            timer: 1500,
            showConfirmButton: false,
          });
          this.volverAlMenu();
        },
        error: () => {
          Swal.fire('Error', 'No pudimos guardar tus respuestas.', 'error');
        },
      });
  }

  // ==================================================================
  // CALIFICACIÓN (anónima)
  // ==================================================================

  abrirCalificacion() {
    this.tallerService.obtenerCalificacion(this.token).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.itemsCalificacion = body.items || [];
        this.colaboradores = body.colaboradores || [];

        this.bloquesCalificacion = [];
        for (const item of this.itemsCalificacion) {
          let bloque = this.bloquesCalificacion.find((b: any) => b.bloque === item.bloque);
          if (!bloque) {
            bloque = { bloque: item.bloque, titulo: item.titulo_bloque, items: [] };
            this.bloquesCalificacion.push(bloque);
          }
          bloque.items.push(item);
        }

        this.respuestasCalificacion = {};
        this.puntajesColaboradores = {};

        this.vista = 'calificacion';
      },
      error: () => {
        Swal.fire('Error', 'No pudimos cargar la calificación.', 'error');
      },
    });
  }

  marcarPuntaje(idItem: string, puntaje: number) {
    this.respuestasCalificacion[idItem] = puntaje;
  }

  marcarPuntajeColaborador(idColaborador: string, puntaje: number) {
    this.puntajesColaboradores[idColaborador] = puntaje;
  }

  guardarCalificacion() {
    const detalle = [];
    for (const item of this.itemsCalificacion) {
      if (item.tipo === 'escala') {
        const puntaje = this.respuestasCalificacion[item.id];
        if (puntaje) {
          detalle.push({ id_item: item.id, puntaje: puntaje });
        }
      } else {
        const texto = this.respuestasCalificacion[item.id];
        if (texto && `${texto}`.trim()) {
          detalle.push({ id_item: item.id, texto: texto });
        }
      }
    }

    const colaboradores = [];
    for (const colaborador of this.colaboradores) {
      const puntaje = this.puntajesColaboradores[colaborador.id_colaborador];
      if (puntaje) {
        colaboradores.push({ id_colaborador: colaborador.id_colaborador, puntaje: puntaje });
      }
    }

    this.tallerService
      .guardarCalificacion({
        token: this.token,
        detalle: detalle,
        colaboradores: colaboradores,
      })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Gracias!',
            text: 'Tu calificación quedó registrada de forma anónima.',
          });
          this.volverAlMenu();
        },
        error: () => {
          Swal.fire('Error', 'No pudimos guardar tu calificación.', 'error');
        },
      });
  }
}
