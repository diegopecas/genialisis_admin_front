import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../common/header/header.component';
import Swal from 'sweetalert2';
import { MigracionSesionesService } from '../../../services/migracion-sesiones.service';
import { MigracionConexionesService } from '../../../services/migracion-conexiones.service';
import { MigracionBloquesService } from '../../../services/migracion-bloques.service';
import { MigracionArchivosService } from '../../../services/migracion-archivos.service';
import { MigracionMensajesService } from '../../../services/migracion-mensajes.service';
import { MigracionScriptsService } from '../../../services/migracion-scripts.service';
import { MigracionEjecucionesService } from '../../../services/migracion-ejecuciones.service';
import { MigracionPreguntasService } from '../../../services/migracion-preguntas.service';
import { MigracionEsquemaCacheService } from '../../../services/migracion-esquema-cache.service';

@Component({
  selector: 'app-migracion-sesion-detalle',
  templateUrl: './sesion-detalle.component.html',
  styleUrl: './sesion-detalle.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
})
export class MigracionSesionDetalleComponent implements OnInit, AfterViewChecked {

  @ViewChild('hiloChat') hiloChat!: ElementRef;

  public titulo: string = 'Sesión de migración';
  public idSesion: string = '';
  public sesion: any = null;
  public mensajes: any[] = [];
  public archivos: any[] = [];
  public scripts: any[] = [];
  public bitacora: any[] = [];
  public conexiones: any[] = [];
  public consumo: any = null;

  public codigoBloqueActivo: string = '';
  public pestana: string = 'chat';

  public textoMensaje: string = '';
  public enviando: boolean = false;
  public cargando: boolean = false;
  public subiendo: boolean = false;

  public previsualizacion: any = null;
  public scriptSeleccionado: any = null;

  public tiposArchivo: string[] = ['matricula', 'pagos', 'contrato', 'nomina', 'pei', 'otro', 'descartable'];

  private debeBajar: boolean = false;

  constructor(
    private migracionSesionesService: MigracionSesionesService,
    private migracionConexionesService: MigracionConexionesService,
    private migracionBloquesService: MigracionBloquesService,
    private migracionArchivosService: MigracionArchivosService,
    private migracionMensajesService: MigracionMensajesService,
    private migracionScriptsService: MigracionScriptsService,
    private migracionEjecucionesService: MigracionEjecucionesService,
    private migracionPreguntasService: MigracionPreguntasService,
    private migracionEsquemaCacheService: MigracionEsquemaCacheService,
    private ruta: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.idSesion = this.ruta.snapshot.params['id'];
    this.cargarTodo();
  }

  ngAfterViewChecked(): void {
    if (this.debeBajar && this.hiloChat) {
      this.hiloChat.nativeElement.scrollTop = this.hiloChat.nativeElement.scrollHeight;
      this.debeBajar = false;
    }
  }

  cargarTodo(): void {
    this.cargando = true;

    this.migracionSesionesService.obtenerDetalle(this.idSesion).subscribe({
      next: (respuesta: any) => {
        this.sesion = respuesta;
        this.titulo = 'Migración: ' + this.sesion.nombre_cliente;
        this.cargando = false;

        // El bloque activo arranca en el primero que no esté listo: el
        // orden de dependencias manda.
        const pendiente = (this.sesion.bloques || [])
          .find((b: any) => b.estado !== 'ejecutado' && b.estado !== 'validado');
        this.codigoBloqueActivo = pendiente ? pendiente.codigo
          : (this.sesion.bloques && this.sesion.bloques.length ? this.sesion.bloques[0].codigo : '');
      },
      error: (error) => {
        this.cargando = false;
        Swal.fire('Error', error.message, 'error');
      }
    });

    this.cargarMensajes();
    this.cargarArchivos();
    this.cargarScripts();
    this.cargarBitacora();

    this.migracionConexionesService.obtenerTodos().subscribe({
      next: (respuesta: any) => { this.conexiones = respuesta.body || []; },
      error: () => { this.conexiones = []; }
    });

    this.migracionMensajesService.obtenerConsumo(this.idSesion).subscribe({
      next: (respuesta: any) => { this.consumo = respuesta; },
      error: () => { this.consumo = null; }
    });
  }

  cargarMensajes(): void {
    this.migracionMensajesService.obtenerTodos(this.idSesion).subscribe({
      next: (respuesta: any) => {
        this.mensajes = respuesta.body || [];
        this.debeBajar = true;
      },
      error: () => { this.mensajes = []; }
    });
  }

  cargarArchivos(): void {
    this.migracionArchivosService.obtenerTodos(this.idSesion).subscribe({
      next: (respuesta: any) => { this.archivos = respuesta.body || []; },
      error: () => { this.archivos = []; }
    });
  }

  cargarScripts(): void {
    this.migracionScriptsService.obtenerTodos(this.idSesion).subscribe({
      next: (respuesta: any) => { this.scripts = respuesta.body || []; },
      error: () => { this.scripts = []; }
    });
  }

  cargarBitacora(): void {
    this.migracionEjecucionesService.obtenerTodos(this.idSesion).subscribe({
      next: (respuesta: any) => { this.bitacora = respuesta.body || []; },
      error: () => { this.bitacora = []; }
    });
  }

  // =====================================================
  // ASISTENTE
  // =====================================================

  enviar(): void {
    const texto = this.textoMensaje.trim();
    if (texto === '' || this.enviando) {
      return;
    }

    this.enviando = true;
    this.mensajes.push({ rol: 'user', mensaje: texto, fecha: new Date().toISOString() });
    this.textoMensaje = '';
    this.debeBajar = true;

    this.migracionMensajesService.enviar(this.idSesion, texto, this.codigoBloqueActivo).subscribe({
      next: (respuesta: any) => {
        this.enviando = false;
        this.cargarMensajes();

        if (respuesta.script) {
          this.cargarScripts();
          if (respuesta.script.validacion && !respuesta.script.validacion.valido) {
            Swal.fire({
              icon: 'warning',
              title: 'El script propuesto no pasó la validación',
              html: '<div style="text-align:left">' + respuesta.script.validacion.errores.join('<br>') + '</div>'
            });
          }
        }
        if (respuesta.preguntas_nuevas > 0) {
          this.cargarTodo();
        }
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', error.message, 'error');
      }
    });
  }

  responderPregunta(pregunta: any): void {
    Swal.fire({
      title: 'Responder',
      text: pregunta.pregunta,
      input: 'textarea',
      showCancelButton: true,
      confirmButtonText: 'Responder',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (!resultado.isConfirmed || !resultado.value) {
        return;
      }
      this.migracionPreguntasService.responder(pregunta.id, resultado.value).subscribe({
        next: () => this.cargarTodo(),
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  // =====================================================
  // ARCHIVOS
  // =====================================================

  seleccionarArchivos(evento: any): void {
    const archivos: File[] = Array.from(evento.target.files || []);
    if (archivos.length === 0) {
      return;
    }

    this.subiendo = true;
    this.migracionArchivosService.crear(this.idSesion, archivos).subscribe({
      next: (respuesta: any) => {
        this.subiendo = false;
        evento.target.value = '';
        this.cargarArchivos();

        const sinTexto = (respuesta.archivos || []).filter((a: any) => a.estado === 'sin_texto');
        if (sinTexto.length > 0) {
          Swal.fire({
            icon: 'info',
            title: 'Algunos archivos no se pudieron leer',
            html: 'Estos no tienen capa de texto (probablemente escaneados) y hay que capturarlos a mano:<br><br>'
              + sinTexto.map((a: any) => a.archivo).join('<br>')
          });
        }
      },
      error: (error) => {
        this.subiendo = false;
        Swal.fire('Error', error.message, 'error');
      }
    });
  }

  cambiarTipo(archivo: any): void {
    this.migracionArchivosService.actualizar({ id: archivo.id, tipo_detectado: archivo.tipo_detectado }).subscribe({
      next: () => {},
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  borrarArchivo(archivo: any): void {
    Swal.fire({
      title: '¿Borrar el archivo?',
      text: archivo.nombre_original,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.migracionArchivosService.eliminar({ id: archivo.id }).subscribe({
        next: () => this.cargarArchivos(),
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  // =====================================================
  // SCRIPTS
  // =====================================================

  previsualizar(script: any): void {
    this.scriptSeleccionado = script;
    this.previsualizacion = null;

    this.migracionScriptsService.previsualizar(script.id).subscribe({
      next: (respuesta: any) => { this.previsualizacion = respuesta; },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  aprobar(script: any): void {
    this.migracionScriptsService.aprobar(script.id).subscribe({
      next: () => {
        this.cargarScripts();
        Swal.fire('Listo', 'Script aprobado. Ya se puede ejecutar.', 'success');
      },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  ejecutar(script: any): void {
    const ambiente = this.sesion && this.sesion.ambiente ? this.sesion.ambiente : 'desconocido';
    const esProduccion = ambiente === 'produccion';

    Swal.fire({
      title: esProduccion ? '¡Ojo, esto es PRODUCCIÓN!' : '¿Ejecutar el script?',
      html: `Se va a escribir en <strong>${this.sesion.base_datos}</strong> (${ambiente}), `
        + `tenant <strong>${this.sesion.codigo_tenant_destino}</strong>.`
        + `<br><br>Todo va dentro de una transacción: si algo falla, la base queda como estaba.`,
      icon: esProduccion ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Ejecutar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: esProduccion ? '#dc2626' : '#2563eb'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }

      this.migracionScriptsService.ejecutar(script.id).subscribe({
        next: (respuesta: any) => {
          this.cargarTodo();
          Swal.fire({
            icon: 'success',
            title: 'Ejecutado',
            html: `${respuesta.filas_afectadas} filas en ${respuesta.sentencias} sentencias.<br>`
              + `Tablas: ${(respuesta.tablas_tocadas || []).join(', ')}`
              + (respuesta.aviso_globales ? `<br><br><strong>${respuesta.aviso_globales}</strong>` : '')
              + `<br><br>Ahora entra a Genialisis y revisa que haya quedado bien.`
          });
        },
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  // =====================================================
  // BLOQUES Y BITACORA
  // =====================================================

  validarBloque(bloque: any, evento: Event): void {
    evento.stopPropagation();

    this.migracionBloquesService.validar(bloque.id).subscribe({
      next: () => {
        this.cargarTodo();
        Swal.fire('Listo', 'Bloque marcado como validado.', 'success');
      },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  deshacer(ejecucion: any): void {
    Swal.fire({
      title: '¿Deshacer este bloque?',
      html: `Se borra todo lo que escribió el bloque <strong>${ejecucion.codigo_bloque}</strong> `
        + `en el tenant ${ejecucion.id_tenant_destino}.`
        + `<br><br>Los bloques anteriores no se tocan. Después se corrige y se vuelve a correr.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, deshacer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }

      this.migracionEjecucionesService.deshacer(ejecucion.id).subscribe({
        next: (respuesta: any) => {
          this.cargarTodo();
          Swal.fire({
            icon: 'success',
            title: 'Deshecho',
            html: `${respuesta.filas_borradas} filas borradas.`
              + (respuesta.aviso_globales ? `<br><br><strong>${respuesta.aviso_globales}</strong>` : '')
          });
        },
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  // =====================================================
  // DESTINO Y CIERRE
  // =====================================================

  get conexionesDestino(): any[] {
    return this.conexiones.filter(c => c.ambiente !== 'semilla');
  }

  cambiarDestino(): void {
    const opciones: any = {};
    this.conexionesDestino.forEach(c => {
      opciones[c.id] = `${c.nombre} (${c.ambiente} · ${c.base_datos})`;
    });

    Swal.fire({
      title: 'Cambiar base destino',
      text: 'Los scripts ya ejecutados vuelven a quedar como aprobados, listos para correrse en la nueva base. Los UUID son los mismos, así que los datos quedan idénticos.',
      input: 'select',
      inputOptions: opciones,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (!resultado.isConfirmed || !resultado.value) {
        return;
      }
      this.migracionSesionesService.cambiarDestino(this.idSesion, resultado.value).subscribe({
        next: (respuesta: any) => {
          this.cargarTodo();
          Swal.fire('Listo', respuesta.mensaje, 'success');
        },
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  purgar(): void {
    Swal.fire({
      title: '¿Validar y purgar la sesión?',
      html: 'Se borran los archivos del cliente, el expediente y el hilo del chat.'
        + '<br><br>Queda la bitácora de qué se cargó y cuándo, sin los datos personales.'
        + '<br><br><strong>Esto no se puede deshacer.</strong>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, purgar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.migracionSesionesService.purgar(this.idSesion).subscribe({
        next: (respuesta: any) => {
          Swal.fire('Listo', respuesta.mensaje, 'success');
          this.router.navigate(['/migracion/sesiones']);
        },
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  verificarEsquema(): void {
    this.migracionEsquemaCacheService.verificar(this.idSesion).subscribe({
      next: (respuesta: any) => {
        if (respuesta.coincide) {
          Swal.fire('Todo en orden', 'El esquema de la base destino es el mismo con el que se abrió la sesión.', 'success');
        } else {
          Swal.fire('El esquema cambió', respuesta.mensaje, 'warning');
        }
      },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  // =====================================================
  // AYUDAS DE PANTALLA
  // =====================================================

  claseBloque(bloque: any): string {
    switch (bloque.estado) {
      case 'ejecutado': return 'bloque-ejecutado';
      case 'validado': return 'bloque-validado';
      case 'propuesto': return 'bloque-propuesto';
      case 'error': return 'bloque-error';
      case 'deshecho': return 'bloque-deshecho';
      default: return 'bloque-pendiente';
    }
  }

  /** Quita los marcadores del formato para que el chat se lea limpio. */
  limpiarMensaje(texto: string): string {
    if (!texto) {
      return '';
    }
    return texto
      .replace(/\[SQL\][\s\S]*?\[\/SQL\]/g, '\n[ script propuesto → pestaña Scripts ]\n')
      .replace(/\[RESUMEN\][\s\S]*?\[\/RESUMEN\]/g, '')
      .replace(/\[PREGUNTA\]/g, '❓')
      .trim();
  }

  /**
   * El join va acá y no en la plantilla: los escapes de salto de línea no
   * se resuelven bien dentro de una expresión de Angular.
   */
  get muestraSql(): string {
    if (!this.previsualizacion || !this.previsualizacion.muestra) {
      return '';
    }
    return this.previsualizacion.muestra.join(';\n\n');
  }
}
