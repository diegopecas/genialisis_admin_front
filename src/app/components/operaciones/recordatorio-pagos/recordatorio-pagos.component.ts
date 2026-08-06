import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../../common/header/header.component';
import { CuentasPorCobrarService } from '../../../services/cuentas-por-cobrar.service';
import { PlanesService } from '../../../services/planes.service';
import { ExportarPdfCuentasService, DatosCuentasPDF } from '../../../services/exportar-pdf-cuentas.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';
import { PlantillasService } from '../../../services/plantillas.service';
import { HistorialRecordatoriosPagoService } from '../../../services/historial-recordatorios-pago.service';
import { TareasColaboradoresService } from '../../../services/tareas-colaboradores.service';
import { UtilService } from '../../../common/constantes/util.service';

interface ClienteCartera {
  id_persona: string;
  id_cliente: string;
  nombre_cliente: string;
  numero_identificacion: string;
  plan_cliente: string;
  activo: number;
  totalCobrado: number;
  totalPagado: number;
  saldoTotal: number;
  saldoVencido: number;
  saldoPendiente: number;
  valoresMensuales: { [key: string]: any };
  totalSaldoPendiente: number;
  representantes: RepresentantePago[];
  ultimo_recordatorio: string | null;
}

interface RepresentantePago {
  id_persona: string;
  id_cliente: string;
  nombre_cliente: string;
  id_representante: string;
  id_tipo_representante: number;
  nombre_tipo_representante: string;
  id_persona_representante: string;
  nombre_representante: string;
  telefono: string;
  correo_electronico: string;
}

@Component({
  selector: 'app-recordatorio-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './recordatorio-pagos.component.html',
  styleUrl: './recordatorio-pagos.component.scss'
})
export class RecordatorioPagosComponent implements OnInit, OnDestroy {
  titulo = "Recordatorio de Pagos";

  public cargando: boolean = false;
  public datosDisponibles: boolean = false;
  private subscriptions: Subscription[] = [];

  // Filtros
  public anioSeleccionado: number = new Date().getFullYear();
  public aniosDisponibles: number[] = [];
  public planSeleccionado: string = '';
  public busquedaCliente: string = '';
  public mostrarSoloConSaldo: boolean = true;

  // Datos
  public planes: any[] = [];
  public clientes: ClienteCartera[] = [];
  public clientesFiltrados: ClienteCartera[] = [];
  public representantesPago: RepresentantePago[] = [];

  // Ordenamiento
  public columnaOrdenamiento: string = 'totalSaldoPendiente';
  public ordenAscendente: boolean = false;

  // Meses
  public mesesDisponibles = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // Modal detalle
  public clienteSeleccionado: ClienteCartera | null = null;

  // Tipo de mensaje: 'vencido' | 'seleccion' | 'todos'
  public tipoMensajeSeleccionado: string = 'vencido';
  public mesesSeleccionados: { [key: string]: boolean } = {};
  public telefonosEditables: string[] = [];
  public telefonoAdicional: string = '';
  public nombreAdicional: string = '';
  public correoAdicional: string = '';
  public mostrarDetalleMeses: boolean = false;

  // Mensaje editable
  public mensajeEditable: string = '';

  // Opciones de mensaje
  public tratoCercano: boolean = false;
  public solicitarReunionPresencial: boolean = false;
  public solicitarReunionVirtual: boolean = false;
  public solicitarFechaCompromiso: boolean = false;

  // Nombre del colegio dinámico
  private get nombreColegio(): string {
    return this.institucionConfigService.getNombreInstitucion() || 'La institución';
  }

  /* Bloques del mensaje. Son el respaldo: si el organizacion tiene la plantilla
     sembrada en base, estos valores se reemplazan al iniciar. El detalle de
     meses y los totales los sigue armando el codigo, porque dependen de lo
     que se marque en pantalla. */
  public bloquesMensaje: any = {
    saludo_tu: 'Hola {NOMBRE_DESTINATARIO},',
    saludo_usted: 'Cordial saludo {NOMBRE_DESTINATARIO},',
    encabezado_tu: 'Te escribimos desde *{nombre_colegio}* con relación al estado de cuenta del cliente *{nombre_cliente}*.',
    encabezado_usted: 'Le escribimos desde *{nombre_colegio}* con relación al estado de cuenta del cliente *{nombre_cliente}*.',
    titulo_detalle: '*Detalle de saldos pendientes:*',
    linea_total: '*Total pendiente: {total}*',
    linea_vencido: '*Saldo vencido: {vencido}*',
    invitacion_tu: 'Te invitamos a ponerte al día con este compromiso. Si ya realizaste el pago, haz caso omiso de este mensaje.',
    invitacion_usted: 'Le invitamos a ponerse al día con este compromiso. Si ya realizó el pago, haga caso omiso de este mensaje.',
    reunion_ambas_tu: 'Nos gustaría agendar una reunión (presencial o virtual) para tratar este tema. Por favor indícanos tu disponibilidad.',
    reunion_ambas_usted: 'Nos gustaría agendar una reunión (presencial o virtual) para tratar este tema. Por favor indíquenos su disponibilidad.',
    reunion_presencial_tu: 'Nos gustaría agendar una reunión presencial. Por favor indícanos tu disponibilidad.',
    reunion_presencial_usted: 'Nos gustaría agendar una reunión presencial. Por favor indíquenos su disponibilidad.',
    reunion_virtual_tu: 'Nos gustaría agendar una reunión virtual. Por favor indícanos tu disponibilidad.',
    reunion_virtual_usted: 'Nos gustaría agendar una reunión virtual. Por favor indíquenos su disponibilidad.',
    compromiso_tu: 'Te agradecemos indicarnos una fecha en la que puedas cumplir con este compromiso.',
    compromiso_usted: 'Le agradecemos indicarnos una fecha en la que pueda cumplir con este compromiso.',
    cierre_tu: 'Quedamos atentos. Gracias por tu confianza.',
    cierre_usted: 'Quedamos atentos. Gracias por su confianza.',
    firma: '{nombre_colegio}',
    asunto_correo: 'Recordatorio de pago - {nombre_cliente} - {nombre_colegio}'
  };

  /**
   * Trae los bloques del mensaje desde la tabla plantillas.
   * Si no existe la fila o falla la consulta, se conservan los de arriba.
   */
  cargarPlantilla(): void {
    this.plantillasService.obtenerByTipoClave('mensaje', 'recordatorio_pago').subscribe({
      next: (response: any) => {
        const contenido = response.body?.contenido;
        if (!contenido) return;

        Object.keys(this.bloquesMensaje).forEach(clave => {
          if (typeof contenido[clave] === 'string' && contenido[clave].trim()) {
            this.bloquesMensaje[clave] = contenido[clave];
          }
        });
      },
      error: () => {
        console.warn('No se pudo cargar la plantilla de recordatorio de pago, se usan los textos por defecto.');
      }
    });
  }

  /**
   * Reemplaza las variables del bloque. {NOMBRE_DESTINATARIO} no se toca aqui:
   * se resuelve al enviar, cuando ya se sabe a que representante va el mensaje.
   */
  private resolverBloque(clave: string, valores: { [k: string]: string } = {}): string {
    let texto = this.bloquesMensaje[clave] || '';
    texto = texto.replace(/\{nombre_colegio\}/g, this.nombreColegio);
    Object.keys(valores).forEach(k => {
      texto = texto.replace(new RegExp('\\{' + k + '\\}', 'g'), valores[k]);
    });
    return texto;
  }

  // PDF
  public descargandoPDF: boolean = false;

  // Modal historial con compromisos
  public clienteHistorial: ClienteCartera | null = null;
  public historialPago: any[] = [];
  public cargandoHistorial: boolean = false;

  constructor(
    private cuentasPorCobrarService: CuentasPorCobrarService,
    private planesService: PlanesService,
    private exportarPdfCuentasService: ExportarPdfCuentasService,
    private institucionConfigService: InstitucionConfigService,
    private historialRecordatoriosService: HistorialRecordatoriosPagoService,
    private plantillasService: PlantillasService,
    private tareasColaboradoresService: TareasColaboradoresService,
    private utilService: UtilService
  ) { }

  ngOnInit(): void {
    this.inicializarAnios();
    this.cargarPlantilla();
    this.cargarPlanes();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  inicializarAnios(): void {
    const anioActual = new Date().getFullYear();
    const anioInicial = 2024;
    this.aniosDisponibles = [];
    for (let anio = anioInicial; anio <= anioActual; anio++) {
      this.aniosDisponibles.push(anio);
    }
    this.anioSeleccionado = anioActual;
  }

  cargarPlanes(): void {
    const sub = this.planesService.obtenerTodos().subscribe({
      next: (response: any) => {
        this.planes = response.body || [];
      },
      error: (error) => {
        console.error('Error al cargar planes:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  cargarDatos(): void {
    this.cargando = true;
    this.datosDisponibles = false;

    const sub = this.cuentasPorCobrarService.obtenerReporteCarteraClientes(this.anioSeleccionado).subscribe({
      next: (response: any) => {
        const data = response.body;
        if (data && data.reporte_clientes && data.reporte_valores) {
          this.procesarDatos(data);
          this.datosDisponibles = true;
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.cargando = false;
        this.datosDisponibles = false;
      }
    });
    this.subscriptions.push(sub);
  }

  procesarDatos(data: any): void {
    const clientesMap = new Map<string, ClienteCartera>();

    // Inicializar clientes
    data.reporte_clientes.forEach((est: any) => {
      clientesMap.set(est.id_persona, {
        id_persona: est.id_persona,
        id_cliente: est.id_cliente,
        nombre_cliente: est.nombre_cliente,
        numero_identificacion: est.numero_identificacion,
        plan_cliente: est.plan_cliente || 'Sin plan',
        activo: est.activo ?? 1,
        totalCobrado: 0,
        totalPagado: 0,
        saldoTotal: 0,
        saldoVencido: 0,
        saldoPendiente: 0,
        valoresMensuales: {},
        totalSaldoPendiente: 0,
        representantes: [],
        ultimo_recordatorio: est.ultimo_recordatorio || null
      });
    });

    // Procesar valores
    data.reporte_valores.forEach((valor: any) => {
      const cliente = clientesMap.get(valor.id_persona);
      if (!cliente) return;

      switch (valor.tipo_valor) {
        case 'Total Cobrado':
          cliente.totalCobrado = parseFloat(valor.valor) || 0;
          break;
        case 'Total Pagado':
          cliente.totalPagado = parseFloat(valor.valor) || 0;
          break;
        case 'Saldo Total':
          cliente.saldoTotal = parseFloat(valor.valor) || 0;
          break;
        case 'Saldo Vencido':
          cliente.saldoVencido = parseFloat(valor.valor) || 0;
          break;
        case 'Saldo Pendiente':
          cliente.saldoPendiente = parseFloat(valor.valor) || 0;
          break;
        default:
          // Valores mensuales
          if (valor.mes !== null) {
            if (!cliente.valoresMensuales[valor.mes]) {
              cliente.valoresMensuales[valor.mes] = {};
            }
            cliente.valoresMensuales[valor.mes][valor.tipo_valor] = parseFloat(valor.valor) || 0;
          }
          break;
      }
    });

    // Calcular totalSaldoPendiente por cliente
    clientesMap.forEach(est => {
      est.totalSaldoPendiente = this.calcularTotalSaldoPendiente(est);
    });

    // Procesar representantes
    this.representantesPago = data.representantes_pago || [];

    // Asignar representantes a clientes
    this.representantesPago.forEach(acu => {
      const cliente = clientesMap.get(acu.id_persona);
      if (cliente) {
        cliente.representantes.push(acu);
      }
    });

    this.clientes = Array.from(clientesMap.values());
    this.aplicarFiltros();
  }

  calcularTotalSaldoPendiente(cliente: ClienteCartera): number {
    let total = 0;
    for (let mes = 1; mes <= 12; mes++) {
      total += this.getSaldoPendienteMes(cliente, mes);
    }
    return total;
  }

  getSaldoPendienteMes(cliente: ClienteCartera, mes: number): number {
    const valoresMes = cliente.valoresMensuales[mes];
    if (!valoresMes) return 0;
    const nombreMes = this.mesesDisponibles[mes - 1].nombre;
    const saldo = valoresMes[`Saldo ${nombreMes}`] || 0;
    return saldo > 0 ? saldo : 0;
  }

  aplicarFiltros(): void {
    let filtrados = [...this.clientes];

    // Solo activos
    filtrados = filtrados.filter(est => est.activo === 1);

    // Filtrar por plan
    if (this.planSeleccionado) {
      const planSel = this.planes.find(g => g.id.toString() === this.planSeleccionado);
      if (planSel) {
        filtrados = filtrados.filter(est => est.plan_cliente === planSel.nombre);
      }
    }

    // Filtrar por búsqueda
    if (this.busquedaCliente) {
      const busqueda = this.busquedaCliente.toLowerCase();
      filtrados = filtrados.filter(est =>
        est.nombre_cliente.toLowerCase().includes(busqueda)
      );
    }

    // Solo con saldo
    if (this.mostrarSoloConSaldo) {
      filtrados = filtrados.filter(est => est.totalSaldoPendiente > 0);
    }

    this.clientesFiltrados = filtrados;
    this.aplicarOrdenamiento();
  }

  aplicarOrdenamiento(): void {
    const multiplicador = this.ordenAscendente ? 1 : -1;
    this.clientesFiltrados.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      if (this.columnaOrdenamiento === 'totalSaldoPendiente') {
        valorA = a.totalSaldoPendiente || 0;
        valorB = b.totalSaldoPendiente || 0;
      } else {
        valorA = a[this.columnaOrdenamiento as keyof ClienteCartera];
        valorB = b[this.columnaOrdenamiento as keyof ClienteCartera];
      }

      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = (valorB as string).toLowerCase();
      }

      if (valorA < valorB) return -1 * multiplicador;
      if (valorA > valorB) return 1 * multiplicador;
      return 0;
    });
  }

  ordenarPor(columna: string): void {
    if (this.columnaOrdenamiento === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrdenamiento = columna;
      this.ordenAscendente = columna === 'nombre_cliente' || columna === 'plan_cliente';
    }
    this.aplicarOrdenamiento();
  }

  cambiarAnio(): void {
    this.cargarDatos();
  }

  buscarCliente(): void {
    this.aplicarFiltros();
  }

  resetearFiltros(): void {
    this.planSeleccionado = '';
    this.busquedaCliente = '';
    this.mostrarSoloConSaldo = true;
    this.aplicarFiltros();
  }

  // Abrir modal de detalle con representantes
  verDetalle(cliente: ClienteCartera): void {
    this.clienteSeleccionado = cliente;
    this.tipoMensajeSeleccionado = 'vencido';
    this.telefonoAdicional = '';
    this.nombreAdicional = '';
    this.correoAdicional = '';
    this.mostrarDetalleMeses = false;
    this.tratoCercano = false;
    this.solicitarReunionPresencial = false;
    this.solicitarReunionVirtual = false;
    this.solicitarFechaCompromiso = false;

    this.telefonosEditables = cliente.representantes.map(a => a.telefono || '');

    this.mesesSeleccionados = {};
    this.mesesDisponibles.forEach(mes => {
      if (this.getSaldoPendienteMes(cliente, mes.valor) > 0) {
        this.mesesSeleccionados[mes.valor] = true;
      }
    });

    this.regenerarMensajePago();

    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalRecordatorio'));
    modal.show();
  }

  // Cambio de tipo de mensaje
  onTipoMensajeCambio(): void {
    if (this.tipoMensajeSeleccionado === 'todos' || this.tipoMensajeSeleccionado === 'seleccion') {
      this.mesesDisponibles.forEach(mes => {
        if (this.clienteSeleccionado && this.getSaldoPendienteMes(this.clienteSeleccionado, mes.valor) > 0) {
          this.mesesSeleccionados[mes.valor] = true;
        }
      });
    }
    this.regenerarMensajePago();
  }

  // Toggle un mes individual
  toggleMes(mes: number): void {
    this.mesesSeleccionados[mes] = !this.mesesSeleccionados[mes];
    this.regenerarMensajePago();
  }

  // Toggle todos los meses
  toggleTodosLosMeses(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.clienteSeleccionado) return;
    this.mesesDisponibles.forEach(mes => {
      if (this.getSaldoPendienteMes(this.clienteSeleccionado!, mes.valor) > 0) {
        this.mesesSeleccionados[mes.valor] = checked;
      }
    });
    this.regenerarMensajePago();
  }

  // Verificar si todos los meses están seleccionados
  todosLosMesesSeleccionados(): boolean {
    if (!this.clienteSeleccionado) return false;
    return this.mesesDisponibles
      .filter(mes => this.getSaldoPendienteMes(this.clienteSeleccionado!, mes.valor) > 0)
      .every(mes => this.mesesSeleccionados[mes.valor]);
  }

  // Total de meses seleccionados
  getTotalMesesSeleccionados(): number {
    if (!this.clienteSeleccionado) return 0;
    let total = 0;
    this.mesesDisponibles.forEach(mes => {
      if (this.mesesSeleccionados[mes.valor]) {
        total += this.getSaldoPendienteMes(this.clienteSeleccionado!, mes.valor);
      }
    });
    return total;
  }

  // ==================== CONSTRUCCIÓN DE MENSAJE ====================

  regenerarMensajePago(): void {
    if (!this.clienteSeleccionado) return;
    this.mensajeEditable = this.construirMensajePago(this.clienteSeleccionado);
  }

  private construirMensajePago(cliente: ClienteCartera): string {
    const tu = this.tratoCercano;
    const sufijo = tu ? '_tu' : '_usted';
    const datos = { nombre_cliente: cliente.nombre_cliente };
    let msg = '';

    msg += this.resolverBloque('saludo' + sufijo, datos) + `\n\n`;

    msg += this.resolverBloque('encabezado' + sufijo, datos) + `\n\n`;

    if (this.tipoMensajeSeleccionado === 'vencido') {
      msg += this.resolverBloque('linea_vencido', { vencido: this.formatearMoneda(cliente.saldoVencido) }) + `\n\n`;
    } else {
      let mesesIncluir: number[] = [];

      if (this.tipoMensajeSeleccionado === 'todos') {
        this.mesesDisponibles.forEach(mes => {
          if (this.getSaldoPendienteMes(cliente, mes.valor) > 0) {
            mesesIncluir.push(mes.valor);
          }
        });
      } else {
        this.mesesDisponibles.forEach(mes => {
          if (this.mesesSeleccionados[mes.valor] && this.getSaldoPendienteMes(cliente, mes.valor) > 0) {
            mesesIncluir.push(mes.valor);
          }
        });
      }

      if (mesesIncluir.length > 0) {
        msg += this.resolverBloque('titulo_detalle') + `\n`;
        let totalIncluido = 0;
        mesesIncluir.forEach(mesValor => {
          const mes = this.mesesDisponibles.find(m => m.valor === mesValor);
          if (mes) {
            const saldo = this.getSaldoPendienteMes(cliente, mesValor);
            msg += `- ${mes.nombre}: ${this.formatearMoneda(saldo)}\n`;
            totalIncluido += saldo;
          }
        });
        msg += `\n` + this.resolverBloque('linea_total', { total: this.formatearMoneda(totalIncluido) }) + `\n`;
      }

      if (cliente.saldoVencido > 0) {
        msg += this.resolverBloque('linea_vencido', { vencido: this.formatearMoneda(cliente.saldoVencido) }) + `\n`;
      }
      msg += '\n';
    }

    msg += this.resolverBloque('invitacion' + sufijo, datos) + `\n\n`;

    // Reunión
    if (this.solicitarReunionPresencial && this.solicitarReunionVirtual) {
      msg += this.resolverBloque('reunion_ambas' + sufijo, datos) + `\n\n`;
    } else if (this.solicitarReunionPresencial) {
      msg += this.resolverBloque('reunion_presencial' + sufijo, datos) + `\n\n`;
    } else if (this.solicitarReunionVirtual) {
      msg += this.resolverBloque('reunion_virtual' + sufijo, datos) + `\n\n`;
    }

    // Fecha compromiso
    if (this.solicitarFechaCompromiso) {
      msg += this.resolverBloque('compromiso' + sufijo, datos) + `\n\n`;
    }

    msg += this.resolverBloque('cierre' + sufijo, datos) + `\n`;
    msg += this.resolverBloque('firma', datos);

    return msg;
  }

  private getMensajeParaEnvio(nombreDestinatario: string): string {
    return this.mensajeEditable.replace(/\{NOMBRE_DESTINATARIO\}/g, nombreDestinatario);
  }

  private getMensajeCorreo(nombreDestinatario: string): string {
    return this.getMensajeParaEnvio(nombreDestinatario).replace(/\*/g, '');
  }
  // Abrir WhatsApp con mensaje (representante registrado)
  enviarWhatsApp(cliente: ClienteCartera, representante: RepresentantePago, indice: number): void {
    const telefono = this.telefonosEditables[indice];
    if (!telefono) { alert('Ingrese un número de teléfono para enviar el recordatorio.'); return; }

    const mensaje = this.getMensajeParaEnvio(representante.nombre_representante);
    const telefonoLimpio = this.limpiarTelefono(telefono);
    const monto = this.calcularMontoNotificado(cliente);

    this.guardarHistorialSilencioso(cliente, representante.id_persona_representante, telefonoLimpio, representante.nombre_representante, monto);
    window.open(`https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  // Enviar a teléfono adicional
  enviarWhatsAppTelefonoAdicional(cliente: ClienteCartera): void {
    if (!this.telefonoAdicional) { alert('Ingrese un número de teléfono.'); return; }

    const nombre = this.nombreAdicional.trim() || 'Señor(a) representante';
    const mensaje = this.getMensajeParaEnvio(nombre);
    const telefonoLimpio = this.limpiarTelefono(this.telefonoAdicional);
    const monto = this.calcularMontoNotificado(cliente);

    this.guardarHistorialSilencioso(cliente, null, telefonoLimpio, nombre, monto);
    window.open(`https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  // Enviar correo a representante registrado
  enviarCorreo(cliente: ClienteCartera, representante: RepresentantePago): void {
    if (!representante.correo_electronico) { alert('El representante no tiene correo electrónico registrado.'); return; }

    const asunto = this.resolverBloque('asunto_correo', { nombre_cliente: cliente.nombre_cliente });
    const cuerpo = this.getMensajeCorreo(representante.nombre_representante);
    const monto = this.calcularMontoNotificado(cliente);

    this.guardarHistorialSilencioso(cliente, representante.id_persona_representante, representante.correo_electronico, representante.nombre_representante, monto);
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(representante.correo_electronico)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
  }

  // Enviar correo a contacto adicional
  enviarCorreoAdicional(cliente: ClienteCartera): void {
    if (!this.correoAdicional) { alert('Ingrese un correo electrónico.'); return; }

    const nombre = this.nombreAdicional.trim() || 'Señor(a) representante';
    const asunto = this.resolverBloque('asunto_correo', { nombre_cliente: cliente.nombre_cliente });
    const cuerpo = this.getMensajeCorreo(nombre);
    const monto = this.calcularMontoNotificado(cliente);

    this.guardarHistorialSilencioso(cliente, null, this.correoAdicional, nombre, monto);
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(this.correoAdicional)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank');
  }

  // Calcular monto notificado según tipo de mensaje
  private calcularMontoNotificado(cliente: ClienteCartera): number {
    if (this.tipoMensajeSeleccionado === 'vencido') {
      return cliente.saldoVencido;
    } else if (this.tipoMensajeSeleccionado === 'seleccion') {
      return this.getTotalMesesSeleccionados();
    }
    return cliente.totalSaldoPendiente;
  }

  // Guardar historial de forma silenciosa (sin spinner)
  private guardarHistorialSilencioso(
    cliente: ClienteCartera,
    idPersonaRepresentante: string | null,
    telefono: string,
    nombreDestinatario: string,
    monto: number
  ): void {
    const idUsuario = this.utilService.obtenerIdUsuarioActual();
    const idColaborador = this.utilService.obtenerIdColaboradorActual();

    const registro = {
      id_cliente: cliente.id_cliente,
      id_persona_representante: idPersonaRepresentante,
      telefono_usado: telefono,
      nombre_destinatario: nombreDestinatario,
      tipo_recordatorio: this.tipoMensajeSeleccionado,
      monto_notificado: monto,
      id_usuario: idUsuario
    };

    this.historialRecordatoriosService.crear(registro).subscribe({
      next: (response: any) => {
        cliente.ultimo_recordatorio = new Date().toISOString();

        // Crear tarea automáticamente
        if (idColaborador) {
          const descripcion = `Seguimiento cobro (${this.tipoMensajeSeleccionado}) - ${cliente.nombre_cliente} - ${this.formatearMoneda(monto)} - Enviado a: ${nombreDestinatario}`;
          const tarea: any = {
            id_colaborador: idColaborador,
            id_cliente: cliente.id_cliente,
            descripcion: descripcion,
            origen: 'recordatorio_pago',
            id_historial_origen: response.id || null,
            id_usuario_registro: idUsuario
          };
          this.tareasColaboradoresService.crear(tarea).subscribe({
            error: (err) => { console.error('Error al crear tarea:', err); }
          });
        }
      },
      error: (error) => {
        console.error('Error al guardar historial de recordatorio:', error);
      }
    });
  }

  // ==================== MODAL HISTORIAL CON COMPROMISOS ====================

  verHistorialPago(cliente: ClienteCartera): void {
    this.clienteHistorial = cliente;
    this.historialPago = [];
    this.cargandoHistorial = true;

    const sub = this.historialRecordatoriosService.obtenerPorCliente(cliente.id_cliente).subscribe({
      next: (response: any) => {
        this.historialPago = (response.body || []).map((h: any) => ({
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

    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalHistorialPago'));
    modal.show();
  }

  editarCompromisoPago(registro: any): void {
    registro.editando = true;
    registro.compromiso_editado = registro.compromiso || '';
    registro.fecha_compromiso_editada = registro.fecha_compromiso || '';
  }

  cancelarEdicionPago(registro: any): void {
    registro.editando = false;
  }

  guardarCompromisoPago(registro: any): void {
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
      case 'vencido': return 'Vencido';
      case 'seleccion': return 'Meses';
      case 'todos': return 'Todos';
      default: return tipo;
    }
  }

  // Limpiar teléfono (quitar espacios, guiones, etc.)
  limpiarTelefono(telefono: string): string {
    return telefono.replace(/[\s\-\(\)\+]/g, '').replace(/^57/, '');
  }

  // Formatear moneda
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(valor);
  }

  // Totales para el resumen
  getTotalSaldoPendiente(): number {
    return this.clientesFiltrados.reduce((total, est) => total + (est.totalSaldoPendiente || 0), 0);
  }

  getTotalSaldoVencido(): number {
    return this.clientesFiltrados.reduce((total, est) => total + (est.saldoVencido || 0), 0);
  }

  getClientesConSaldo(): number {
    return this.clientesFiltrados.filter(est => est.totalSaldoPendiente > 0).length;
  }

  getClientesSinTelefono(): number {
    return this.clientesFiltrados.filter(est =>
      est.totalSaldoPendiente > 0 && est.representantes.every(a => !a.telefono)
    ).length;
  }

  getTotalSaldoPendienteMes(mes: number): number {
    return this.clientesFiltrados.reduce((total, est) => {
      return total + this.getSaldoPendienteMes(est, mes);
    }, 0);
  }

  tieneTelefono(cliente: ClienteCartera): boolean {
    return cliente.representantes.length > 0 && cliente.representantes.some(a => !!a.telefono);
  }

  sinTelefono(cliente: ClienteCartera): boolean {
    return cliente.representantes.length > 0 && cliente.representantes.every(a => !a.telefono);
  }

  getBadgeClass(cliente: ClienteCartera): string {
    if (cliente.representantes.length === 0) return 'bg-danger';
    if (this.tieneTelefono(cliente)) return 'bg-success';
    return 'bg-warning text-dark';
  }

  getIconoClass(cliente: ClienteCartera): string {
    if (cliente.representantes.length === 0) return 'fa-times';
    if (this.tieneTelefono(cliente)) return 'fa-check';
    return 'fa-exclamation-triangle';
  }

  async descargarEstadoCuenta(cliente: ClienteCartera): Promise<void> {
    this.descargandoPDF = true;

    try {
      const logoBase64 = await this.cargarLogoBase64();
      const anioAcademico = this.institucionConfigService.getAnioAcademicoActual();

      this.cuentasPorCobrarService.obtenerTodosXPersona(cliente.id_persona).subscribe({
        next: (response: any) => {
          const body = response.body as any[];
          const fechaActual = new Date();

          let totalCobrado = 0;
          let totalPagado = 0;
          let totalSaldo = 0;
          let totalSaldoVencido = 0;

          // Procesar todos los movimientos
          const todosMovimientos = body.map((item: any) => {
            const fechaItem = new Date(item.fecha);
            const vencido = fechaActual > fechaItem && item.saldo > 0;
            const mesMovimiento = fechaItem.getMonth() + 1;
            const anioMovimiento = fechaItem.getFullYear();

            totalCobrado += Number(item.valor) || 0;
            totalPagado += Number(item.valor_pagado) || 0;
            totalSaldo += Number(item.saldo) || 0;
            if (vencido) {
              totalSaldoVencido += Number(item.saldo) || 0;
            }

            return {
              ...item,
              vencido: vencido,
              mesMovimiento: mesMovimiento,
              anioMovimiento: anioMovimiento,
              saldoNumerico: Number(item.saldo) || 0,
              valorNumerico: Number(item.valor) || 0,
              valorPagadoNumerico: Number(item.valor_pagado) || 0
            };
          });

          // Filtrar según el tipo de recordatorio seleccionado
          let movimientosFiltrados: any[];

          if (this.tipoMensajeSeleccionado === 'vencido') {
            // Solo movimientos vencidos (fecha pasada y con saldo > 0)
            movimientosFiltrados = todosMovimientos.filter((item: any) => item.vencido && item.saldoNumerico > 0);
          } else if (this.tipoMensajeSeleccionado === 'seleccion') {
            // Solo meses seleccionados del año del reporte
            const mesesActivos = Object.keys(this.mesesSeleccionados)
              .filter(k => this.mesesSeleccionados[Number(k)])
              .map(Number);
            movimientosFiltrados = todosMovimientos.filter((item: any) =>
              mesesActivos.includes(item.mesMovimiento) && item.anioMovimiento === this.anioSeleccionado
            );
          } else {
            // Todos los movimientos
            movimientosFiltrados = todosMovimientos;
          }

          // Separar por año
          const movimientosAnioActual = movimientosFiltrados
            .filter((item: any) => item.anioMovimiento === anioAcademico)
            .map((item: any, i: number) => ({
              id: String(i + 1),
              fecha: this.formatearFechaPDF(item.fecha),
              concepto: item.nombre_producto_servicio || '-',
              valorTotal: item.valorNumerico,
              valorPagado: item.valorPagadoNumerico,
              saldo: item.saldoNumerico,
              estado: item.saldoNumerico <= 0 ? 'Pagado' : (item.vencido ? 'Vencido' : 'Pendiente')
            }));

          const movimientosHistoricosPendientes = movimientosFiltrados
            .filter((item: any) => item.anioMovimiento < anioAcademico && item.saldoNumerico > 0)
            .map((item: any, i: number) => ({
              id: String(i + 1),
              fecha: this.formatearFechaPDF(item.fecha),
              concepto: item.nombre_producto_servicio || '-',
              valorTotal: item.valorNumerico,
              valorPagado: item.valorPagadoNumerico,
              saldo: item.saldoNumerico,
              estado: item.saldoNumerico <= 0 ? 'Pagado' : (item.vencido ? 'Vencido' : 'Pendiente')
            }));

          // Recalcular totales según filtro
          const totalSaldoFiltrado = movimientosFiltrados.reduce((sum: number, item: any) => sum + item.saldoNumerico, 0);
          const totalPagadoFiltrado = movimientosFiltrados.reduce((sum: number, item: any) => sum + item.valorPagadoNumerico, 0);
          const totalVencidoFiltrado = movimientosFiltrados.filter((item: any) => item.vencido).reduce((sum: number, item: any) => sum + item.saldoNumerico, 0);

          const datosPDF: DatosCuentasPDF = {
            nombreCliente: cliente.nombre_cliente,
            numeroIdentificacion: cliente.numero_identificacion,
            nombrePlan: cliente.plan_cliente,
            logoBase64: logoBase64,
            anioAcademico: anioAcademico,
            resumenFinanciero: {
              saldoPendiente: this.tipoMensajeSeleccionado === 'todos' ? totalSaldo : totalSaldoFiltrado,
              valorPagado: this.tipoMensajeSeleccionado === 'todos' ? totalPagado : totalPagadoFiltrado,
              saldoVencido: this.tipoMensajeSeleccionado === 'todos' ? totalSaldoVencido : totalVencidoFiltrado,
              estado: (this.tipoMensajeSeleccionado === 'todos' ? totalSaldo : totalSaldoFiltrado) <= 0 ? 'AL DÍA' : 'PENDIENTE'
            },
            tabActiva: 'movimientos',
            movimientos: movimientosAnioActual.length > 0 ? movimientosAnioActual : undefined,
            movimientosHistoricosPendientes: movimientosHistoricosPendientes.length > 0 ? movimientosHistoricosPendientes : undefined,
            filtrosAplicados: {
              descripciones: this.generarDescripcionesFiltrosPDF()
            }
          };

          this.exportarPdfCuentasService.generarPDF(datosPDF);
          this.descargandoPDF = false;
        },
        error: (error: any) => {
          console.error('Error al obtener datos para PDF:', error);
          alert('Error al generar el estado de cuenta. Intente nuevamente.');
          this.descargandoPDF = false;
        }
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el estado de cuenta. Intente nuevamente.');
      this.descargandoPDF = false;
    }
  }

  // Genera descripciones legibles del filtro aplicado para el PDF
  private generarDescripcionesFiltrosPDF(): string[] {
    const descripciones: string[] = [];

    if (this.tipoMensajeSeleccionado === 'vencido') {
      descripciones.push('Solo movimientos vencidos');
    } else if (this.tipoMensajeSeleccionado === 'seleccion') {
      const mesesActivos = this.mesesDisponibles
        .filter(mes => this.mesesSeleccionados[mes.valor])
        .map(mes => mes.nombre);
      if (mesesActivos.length > 0) {
        descripciones.push(`Meses seleccionados: ${mesesActivos.join(', ')}`);
      }
    } else {
      descripciones.push('Todos los movimientos');
    }

    return descripciones;
  }

  private async cargarLogoBase64(): Promise<string> {
    try {
      const logoUrl = this.institucionConfigService.getLogoUrl();
      const response = await fetch(logoUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error al cargar el logo:', error);
      return '';
    }
  }

  private formatearFechaPDF(fecha: string): string {
    try {
      const [year, month, day] = fecha.substring(0, 10).split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return fecha;
    }
  }
}