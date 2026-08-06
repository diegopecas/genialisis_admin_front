import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../../common/header/header.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import { ClientesService } from '../../../services/clientes.service';
import { HistorialRecordatoriosGeneralesService } from '../../../services/historial-recordatorios-generales.service';
import { TareasColaboradoresService } from '../../../services/tareas-colaboradores.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';
import { UtilService } from '../../../common/constantes/util.service';

interface RepresentanteRecordatorio {
  id_representante: string;
  id_cliente: string;
  id_persona: string;
  nombre_cliente: string;
  id_tipo_representante: number;
  nombre_tipo_representante: string;
  id_persona_representante: string;
  nombre_representante: string;
  telefono: string;
  correo_electronico: string;
}

interface HistorialRecordatorio {
  id: string;
  id_cliente: string;
  id_persona_representante: string | null;
  telefono_usado: string;
  nombre_destinatario: string;
  tipo_recordatorio: string;
  medio_envio: string;
  compromiso: string | null;
  fecha_compromiso: string | null;
  id_usuario: string | null;
  fecha_envio: string;
  editando?: boolean;
  compromiso_editado?: string;
  fecha_compromiso_editada?: string;
}

@Component({
  selector: 'app-recordatorios-generales',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, TablasComponent],
  templateUrl: './recordatorios-generales.component.html',
  styleUrl: './recordatorios-generales.component.scss'
})
export class RecordatoriosGeneralesComponent implements OnInit, OnDestroy {
  @ViewChild(TablasComponent) tablasComponent!: TablasComponent;

  titulo = "Recordatorios Generales";

  public cargando: boolean = false;
  public titulos: any[] = [];
  public datos: any[] = [];
  public columnasFiltro: (string | { columna: string, tipoFiltro?: 'fecha' | 'normal' | 'rango' })[] = [
    'Plan',
    'Estado',
    'Mes Cumpleaños',
    'Estado Contrato',
    'Año',
    'Alimentación',
    'Docs. Pendientes',
    'Saldo Cartera',
    'Saldo Vencido',
  ];
  public acciones: any[] = [];

  private subscriptions: Subscription[] = [];
  private representantesData: RepresentanteRecordatorio[] = [];

  // Conceptos de cartera para el modal de desglose
  conceptosCartera = [
    { key: 'implementacion', label: 'Implementación', campo: 'implementacion' },
    { key: 'suscripcion', label: 'Suscripción', campo: 'suscripcion' },
    { key: 'almuerzo', label: 'Almuerzo', campo: 'almuerzo' },
    { key: 'onces', label: 'Onces', campo: 'onces' },
    { key: 'horasExtras', label: 'Horas Extras', campo: 'horas_extras' },
    { key: 'vestuario', label: 'Vestuario', campo: 'vestuario' },
  ];

  private camposCartera = [
    'implementacion_cobrado_actual', 'implementacion_pagado_actual', 'implementacion_saldo_actual',
    'implementacion_cobrado_anterior', 'implementacion_pagado_anterior', 'implementacion_saldo_anterior',
    'implementacion_vencido',
    'suscripcion_cobrado_actual', 'suscripcion_pagado_actual', 'suscripcion_saldo_actual',
    'suscripcion_cobrado_anterior', 'suscripcion_pagado_anterior', 'suscripcion_saldo_anterior',
    'suscripcion_vencido',
    'almuerzo_cobrado_actual', 'almuerzo_pagado_actual', 'almuerzo_saldo_actual',
    'almuerzo_cobrado_anterior', 'almuerzo_pagado_anterior', 'almuerzo_saldo_anterior',
    'almuerzo_vencido',
    'onces_cobrado_actual', 'onces_pagado_actual', 'onces_saldo_actual',
    'onces_cobrado_anterior', 'onces_pagado_anterior', 'onces_saldo_anterior',
    'onces_vencido',
    'horas_extras_cobrado_actual', 'horas_extras_pagado_actual', 'horas_extras_saldo_actual',
    'horas_extras_cobrado_anterior', 'horas_extras_pagado_anterior', 'horas_extras_saldo_anterior',
    'horas_extras_vencido',
    'vestuario_cobrado_actual', 'vestuario_pagado_actual', 'vestuario_saldo_actual',
    'vestuario_cobrado_anterior', 'vestuario_pagado_anterior', 'vestuario_saldo_anterior',
    'vestuario_vencido',
  ];

  // Modal recordatorio
  public clienteSeleccionado: any = null;
  public representantesCliente: RepresentanteRecordatorio[] = [];
  public telefonosEditables: string[] = [];
  public telefonoAdicional: string = '';
  public nombreAdicional: string = '';
  public correoAdicional: string = '';
  public tipoRecordatorioSeleccionado: string = 'general';

  // Mensaje editable (se genera automáticamente y el usuario puede modificar)
  public mensajeEditable: string = '';

  // Opciones adicionales del mensaje
  public solicitarReunionPresencial: boolean = false;
  public solicitarReunionVirtual: boolean = false;
  public solicitarFechaCompromiso: boolean = false;
  public tratoCercano: boolean = false;

  // Modal desglose financiero
  public clienteFinanciero: any = null;

  // Modal historial con compromisos
  public clienteHistorial: any = null;
  public historialCliente: HistorialRecordatorio[] = [];
  public cargandoHistorial: boolean = false;

  private get nombreColegio(): string {
    return this.institucionConfigService.getNombreInstitucion() || 'La institución';
  }

  constructor(
    private clientesService: ClientesService,
    private historialRecordatoriosService: HistorialRecordatoriosGeneralesService,
    private tareasColaboradoresService: TareasColaboradoresService,
    private institucionConfigService: InstitucionConfigService,
    private utilService: UtilService
  ) { }

  ngOnInit(): void {
    this.crearTitulos();
    this.crearAcciones();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  crearTitulos(): void {
    this.titulos = [
      { clave: 'ultimo_recordatorio_texto', alias: 'Último Recordatorio', alinear: 'centrado' },
      { clave: 'nombre_completo', alias: 'Nombre Completo', alinear: 'izquierda' },
      { clave: 'tipo_identificacion', alias: 'Tipo Doc.', alinear: 'centrado' },
      { clave: 'numero_identificacion', alias: 'Número Doc.', alinear: 'centrado' },
      { clave: 'fecha_nacimiento', alias: 'F. Nacimiento', alinear: 'centrado', tipo: 'date' },
      { clave: 'edad', alias: 'Edad', alinear: 'centrado' },
      { clave: 'edad_a_cumplir', alias: 'Edad a Cumplir', alinear: 'centrado' },
      { clave: 'mes_cumpleanos', alias: 'Mes Cumpleaños', alinear: 'centrado' },
      { clave: 'nombre_plan', alias: 'Plan', alinear: 'centrado' },
      { clave: 'fecha_ingreso', alias: 'F. Ingreso', alinear: 'centrado', tipo: 'date' },
      { clave: 'anno', alias: 'Año', alinear: 'centrado' },
      { clave: 'alimentacion_texto', alias: 'Alimentación', alinear: 'centrado' },
      { clave: 'estado', alias: 'Estado', alinear: 'centrado' },
      { clave: 'estado_contrato', alias: 'Estado Contrato', alinear: 'centrado' },
      { clave: 'representantes', alias: 'Representantes', alinear: 'izquierda' },
      { clave: 'docs_pendientes_texto', alias: 'Docs. Pendientes', alinear: 'izquierda' },
      { clave: 'valor_implementacion', alias: 'Implementación', alinear: 'centrado', tipo: 'money' },
      { clave: 'valor_suscripcion', alias: 'Suscripción', alinear: 'centrado', tipo: 'money' },
      { clave: 'saldo_cartera', alias: 'Saldo Cartera', alinear: 'centrado', tipo: 'money' },
      { clave: 'saldo_vencido', alias: 'Saldo Vencido', alinear: 'centrado', tipo: 'money' },
    ];
  }

  crearAcciones(): void {
    this.acciones = [
      { id: 'recordatorio', label: 'Enviar Recordatorio', icono: '/assets/images/recordatorio-general.png' },
      { id: 'ver_cartera', label: 'Ver Cartera', icono: '/assets/images/finanzas.png' },
      { id: 'ver_historial', label: 'Historial', icono: '/assets/images/seguimiento-asistencia.png' },
    ];
  }

  cargarDatos(): void {
    this.cargando = true;
    const sub = this.clientesService.obtenerReporteRecordatorios().subscribe({
      next: (response: any) => {
        const data = response.body;
        if (data && data.clientes) {
          this.representantesData = data.representantes || [];
          this.procesarDatos(data.clientes);
        } else { this.datos = []; }
        this.cargando = false;
      },
      error: (error) => { console.error('Error al cargar datos:', error); this.datos = []; this.cargando = false; }
    });
    this.subscriptions.push(sub);
  }

  procesarDatos(clientesRaw: any[]): void {
    this.datos = clientesRaw.map((est: any) => {
      const cantPendientes = parseInt(est.docs_pendientes_cantidad) || 0;
      const detallePendientes = est.docs_pendientes_detalle || '';
      const mapped: any = {
        ...est,
        valor_implementacion: parseFloat(est.valor_implementacion) || 0,
        valor_suscripcion: parseFloat(est.valor_suscripcion) || 0,
        implementacion_mes_actual: parseFloat(est.implementacion_mes_actual) || 0,
        suscripcion_mes_actual: parseFloat(est.suscripcion_mes_actual) || 0,
        mes_cumpleanos: this.obtenerNombreMes(est.fecha_nacimiento),
        edad_a_cumplir: this.calcularEdadACumplir(est.fecha_nacimiento, est.edad),
        docs_pendientes_cantidad: cantPendientes,
        docs_pendientes_detalle: detallePendientes,
        docs_pendientes_texto: cantPendientes > 0
          ? cantPendientes + ' pendiente' + (cantPendientes > 1 ? 's' : '') + ': ' + detallePendientes
          : 'Completo',
        ultimo_recordatorio_texto: est.ultimo_recordatorio ? this.formatearFecha(est.ultimo_recordatorio) : '-',
        saldo_vencido: 0,
        color: est.activo === 0 ? '#e2e9f3' : '',
      };
      this.camposCartera.forEach(campo => { mapped[campo] = parseFloat(est[campo]) || 0; });
      let saldoTotal = 0;
      this.conceptosCartera.forEach(c => {
        saldoTotal += mapped[c.campo + '_saldo_actual'] || 0;
        saldoTotal += mapped[c.campo + '_saldo_anterior'] || 0;
      });
      mapped.saldo_cartera = saldoTotal;
      let saldoVencido = 0;
      this.conceptosCartera.forEach(c => { saldoVencido += mapped[c.campo + '_vencido'] || 0; });
      mapped.saldo_vencido = saldoVencido;
      return mapped;
    });
  }

  private obtenerNombreMes(fecha: string): string {
    if (!fecha) return '';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    try { const partes = fecha.split('-'); return partes.length >= 2 ? (meses[parseInt(partes[1], 10) - 1] || '') : ''; } catch { return ''; }
  }

  private calcularEdadACumplir(fechaNacimiento: string, edadActual: number): number {
    if (!fechaNacimiento) return 0;
    return edadActual === 0 ? 1 : edadActual + 1;
  }

  private formatearFecha(fecha: string): string {
    try {
      const d = new Date(fecha);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch { return fecha; }
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor);
  }

  // Helper de género
  private getGeneroTexto(cliente: any): { articulo: string, querido: string } {
    const esFemenino = cliente.nombre_genero === 'Femenino';
    return {
      articulo: esFemenino ? 'nuestra' : 'nuestro',
      querido: esFemenino ? 'querida' : 'querido'
    };
  }

  // ==================== ACCIONES DESDE TABLA ====================

  onClicAccion(evento: any): void {
    if (evento.accion === 'recordatorio') { this.verDetalle(evento.registro); }
    else if (evento.accion === 'ver_cartera') { this.verCartera(evento.registro); }
    else if (evento.accion === 'ver_historial') { this.verHistorial(evento.registro); }
  }

  // ==================== MODAL RECORDATORIO ====================

  verDetalle(cliente: any): void {
    this.clienteSeleccionado = cliente;
    this.representantesCliente = this.representantesData.filter(a => a.id_cliente === cliente.id);
    this.tipoRecordatorioSeleccionado = 'general';
    this.telefonoAdicional = '';
    this.nombreAdicional = '';
    this.correoAdicional = '';
    this.solicitarReunionPresencial = false;
    this.solicitarReunionVirtual = false;
    this.solicitarFechaCompromiso = false;
    this.tratoCercano = false;
    this.telefonosEditables = this.representantesCliente.map(a => a.telefono || '');
    this.regenerarMensaje();
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalRecordatorioGeneral'));
    modal.show();
  }

  // Se llama cada vez que cambia el tipo, los checks o cualquier opción
  regenerarMensaje(): void {
    if (!this.clienteSeleccionado) return;
    this.mensajeEditable = this.construirMensaje(this.clienteSeleccionado);
  }

  // ==================== MODAL DESGLOSE FINANCIERO ====================

  verCartera(cliente: any): void {
    this.clienteFinanciero = cliente;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalDesgloseFinanciero'));
    modal.show();
  }

  getCarteraConcepto(cliente: any, campo: string, periodo: string, tipo: string): number {
    return cliente[campo + '_' + tipo + '_' + periodo] || 0;
  }

  getTotalCartera(cliente: any, periodo: string, tipo: string): number {
    let total = 0;
    this.conceptosCartera.forEach(c => { total += this.getCarteraConcepto(cliente, c.campo, periodo, tipo); });
    return total;
  }

  // ==================== MODAL HISTORIAL CON COMPROMISOS ====================

  verHistorial(cliente: any): void {
    this.clienteHistorial = cliente;
    this.historialCliente = [];
    this.cargarHistorial(cliente.id);
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalHistorial'));
    modal.show();
  }

  cargarHistorial(idCliente: string): void {
    this.cargandoHistorial = true;
    const sub = this.historialRecordatoriosService.obtenerPorCliente(idCliente).subscribe({
      next: (response: any) => {
        this.historialCliente = (response.body || []).map((h: any) => ({
          ...h,
          editando: false,
          compromiso_editado: h.compromiso || '',
          fecha_compromiso_editada: h.fecha_compromiso || ''
        }));
        this.cargandoHistorial = false;
      },
      error: (error) => { console.error('Error al cargar historial:', error); this.cargandoHistorial = false; }
    });
    this.subscriptions.push(sub);
  }

  editarCompromiso(registro: HistorialRecordatorio): void {
    registro.editando = true;
    registro.compromiso_editado = registro.compromiso || '';
    registro.fecha_compromiso_editada = registro.fecha_compromiso || '';
  }

  cancelarEdicion(registro: HistorialRecordatorio): void {
    registro.editando = false;
  }

  guardarCompromiso(registro: HistorialRecordatorio): void {
    const datos = {
      id: registro.id,
      compromiso: registro.compromiso_editado?.trim() || null,
      fecha_compromiso: registro.fecha_compromiso_editada || null
    };

    this.historialRecordatoriosService.actualizar(datos).subscribe({
      next: () => {
        registro.compromiso = datos.compromiso;
        registro.fecha_compromiso = datos.fecha_compromiso;
        registro.editando = false;
      },
      error: (error) => { console.error('Error al guardar compromiso:', error); alert('Error al guardar el compromiso.'); }
    });
  }

  getTipoRecordatorioLabel(tipo: string): string {
    switch (tipo) {
      case 'general': return 'General';
      case 'contrato': return 'Contrato';
      case 'documentos': return 'Documentos';
      default: return tipo;
    }
  }

  // ==================== CONSTRUCCIÓN DE MENSAJE ====================

  private construirMensaje(cliente: any): string {
    const g = this.getGeneroTexto(cliente);
    const tu = this.tratoCercano;
    let msg = '';

    // Saludo
    msg += tu
      ? `Hola {NOMBRE_DESTINATARIO},\n\n`
      : `Cordial saludo {NOMBRE_DESTINATARIO},\n\n`;

    msg += tu
      ? `Te escribimos desde *${this.nombreColegio}* con relación a ${g.articulo} cliente *${cliente.nombre_completo}*.\n\n`
      : `Le escribimos desde *${this.nombreColegio}* con relación a ${g.articulo} cliente *${cliente.nombre_completo}*.\n\n`;

    // Cuerpo según tipo
    if (this.tipoRecordatorioSeleccionado === 'contrato') {
      if (cliente.estado_contrato === 'Sin contrato') {
        msg += tu
          ? `Te recordamos que aún no se ha formalizado el contrato de implementación para este año. Te invitamos a acercarte a la organización para completar este proceso.\n\n`
          : `Le recordamos que aún no se ha formalizado el contrato de implementación para este año. Le invitamos a acercarse a la organización para completar este proceso.\n\n`;
      } else {
        msg += tu
          ? `Te recordamos que el contrato de implementación está listo y pendiente de firma. Te invitamos a acercarte a la organización para firmarlo.\n\n`
          : `Le recordamos que el contrato de implementación está listo y pendiente de firma. Le invitamos a acercarse a la organización para firmarlo.\n\n`;
      }
    } else if (this.tipoRecordatorioSeleccionado === 'documentos') {
      const tieneContratoPendiente = cliente.estado_contrato === 'Pendiente' || cliente.estado_contrato === 'Sin contrato';

      if (tieneContratoPendiente) {
        if (cliente.estado_contrato === 'Sin contrato') {
          msg += tu
            ? `Te recordamos que el contrato de implementación aún no se ha formalizado.\n\n`
            : `Le recordamos que el contrato de implementación aún no se ha formalizado.\n\n`;
        } else {
          msg += tu
            ? `Te recordamos que el contrato de implementación está pendiente de firma.\n\n`
            : `Le recordamos que el contrato de implementación está pendiente de firma.\n\n`;
        }
      }

      if (cliente.docs_pendientes_detalle) {
        msg += `Tenemos pendiente la entrega de los siguientes documentos:\n`;
        cliente.docs_pendientes_detalle.split(', ').forEach((doc: string) => {
          msg += `- ${doc}\n`;
        });
        msg += tu
          ? `\nTe agradecemos colaborarnos con ellos a la mayor brevedad.\n\n`
          : `\nLe agradecemos colaborarnos con ellos a la mayor brevedad.\n\n`;
      }
    } else {
      msg += `[Escriba aquí su mensaje]\n\n`;
    }

    // Reunión
    if (this.solicitarReunionPresencial && this.solicitarReunionVirtual) {
      msg += tu
        ? `Nos gustaría agendar una reunión (presencial o virtual) para tratar este tema. Por favor indícanos tu disponibilidad.\n\n`
        : `Nos gustaría agendar una reunión (presencial o virtual) para tratar este tema. Por favor indíquenos su disponibilidad.\n\n`;
    } else if (this.solicitarReunionPresencial) {
      msg += tu
        ? `Nos gustaría agendar una reunión presencial para tratar este tema. Por favor indícanos tu disponibilidad.\n\n`
        : `Nos gustaría agendar una reunión presencial para tratar este tema. Por favor indíquenos su disponibilidad.\n\n`;
    } else if (this.solicitarReunionVirtual) {
      msg += tu
        ? `Nos gustaría agendar una reunión virtual para tratar este tema. Por favor indícanos tu disponibilidad.\n\n`
        : `Nos gustaría agendar una reunión virtual para tratar este tema. Por favor indíquenos su disponibilidad.\n\n`;
    }

    // Fecha compromiso
    if (this.solicitarFechaCompromiso) {
      msg += tu
        ? `Te agradecemos indicarnos una fecha en la que puedas cumplir con este compromiso.\n\n`
        : `Le agradecemos indicarnos una fecha en la que pueda cumplir con este compromiso.\n\n`;
    }

    // Despedida
    msg += tu
      ? `Quedamos atentos. Gracias por tu confianza.\n`
      : `Quedamos atentos. Gracias por su confianza.\n`;
    msg += `${this.nombreColegio}`;

    return msg;
  }

  // Para WA: reemplaza el placeholder con el nombre real del destinatario
  private getMensajeParaEnvio(nombreDestinatario: string): string {
    return this.mensajeEditable.replace('{NOMBRE_DESTINATARIO}', nombreDestinatario);
  }

  // Para correo: quita los asteriscos de WA
  private getMensajeCorreo(nombreDestinatario: string): string {
    return this.getMensajeParaEnvio(nombreDestinatario).replace(/\*/g, '');
  }

  // ==================== ENVÍO ====================

  enviarWhatsApp(representante: RepresentanteRecordatorio, indice: number): void {
    const telefono = this.telefonosEditables[indice];
    if (!telefono) { alert('Ingrese un número de teléfono.'); return; }
    const telefonoLimpio = this.limpiarTelefono(telefono);
    const mensaje = this.getMensajeParaEnvio(representante.nombre_representante);
    this.guardarHistorialSilencioso(representante.id_persona_representante, telefonoLimpio, representante.nombre_representante, 'whatsapp');
    window.open(`https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  enviarWhatsAppAdicional(): void {
    if (!this.telefonoAdicional) { alert('Ingrese un número de teléfono.'); return; }
    const nombre = this.nombreAdicional.trim() || 'Señor(a) representante';
    const telefonoLimpio = this.limpiarTelefono(this.telefonoAdicional);
    const mensaje = this.getMensajeParaEnvio(nombre);
    this.guardarHistorialSilencioso(null, telefonoLimpio, nombre, 'whatsapp');
    window.open(`https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  enviarCorreo(representante: RepresentanteRecordatorio): void {
    if (!representante.correo_electronico) { alert('El representante no tiene correo electrónico registrado.'); return; }
    const asunto = `Recordatorio - ${this.clienteSeleccionado.nombre_completo} - ${this.nombreColegio}`;
    const cuerpo = this.getMensajeCorreo(representante.nombre_representante);
    this.guardarHistorialSilencioso(representante.id_persona_representante, representante.correo_electronico, representante.nombre_representante, 'correo');
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(representante.correo_electronico)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
  }

  enviarCorreoAdicional(): void {
    if (!this.correoAdicional) { alert('Ingrese un correo electrónico.'); return; }
    const nombre = this.nombreAdicional.trim() || 'Señor(a) representante';
    const asunto = `Recordatorio - ${this.clienteSeleccionado.nombre_completo} - ${this.nombreColegio}`;
    const cuerpo = this.getMensajeCorreo(nombre);
    this.guardarHistorialSilencioso(null, this.correoAdicional, nombre, 'correo');
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(this.correoAdicional)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
  }

  // ==================== GUARDADO ====================

  private guardarHistorialSilencioso(
    idPersonaRepresentante: string | null, contactoUsado: string,
    nombreDestinatario: string, medioEnvio: string
  ): void {
    const idUsuario = this.utilService.obtenerIdUsuarioActual();
    const idColaborador = this.utilService.obtenerIdColaboradorActual();
    const registro: any = {
      id_cliente: this.clienteSeleccionado.id,
      id_persona_representante: idPersonaRepresentante,
      telefono_usado: contactoUsado,
      nombre_destinatario: nombreDestinatario,
      tipo_recordatorio: this.tipoRecordatorioSeleccionado,
      medio_envio: medioEnvio,
      id_usuario: idUsuario
    };

    this.historialRecordatoriosService.crear(registro).subscribe({
      next: (response: any) => {
        this.clienteSeleccionado.ultimo_recordatorio = new Date().toISOString();
        this.clienteSeleccionado.ultimo_recordatorio_texto = this.formatearFecha(new Date().toISOString());

        // Crear tarea automáticamente
        if (idColaborador) {
          const descripcion = `Seguimiento recordatorio (${this.tipoRecordatorioSeleccionado}) - ${this.clienteSeleccionado.nombre_completo} - Enviado a: ${nombreDestinatario}`;
          const tarea: any = {
            id_colaborador: idColaborador,
            id_cliente: this.clienteSeleccionado.id,
            descripcion: descripcion,
            origen: 'recordatorio_general',
            id_historial_origen: response.id || null,
            id_usuario_registro: idUsuario
          };
          this.tareasColaboradoresService.crear(tarea).subscribe({
            error: (err) => { console.error('Error al crear tarea:', err); }
          });
        }
      },
      error: (error) => { console.error('Error al guardar historial:', error); }
    });
  }

  limpiarTelefono(telefono: string): string {
    return telefono.replace(/[\s\-\(\)\+]/g, '').replace(/^57/, '');
  }

  getEstadoContratoBadge(estado: string): string {
    switch (estado) {
      case 'Firmado': return 'badge bg-success';
      case 'Pendiente': return 'badge bg-warning text-dark';
      case 'Sin contrato': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}