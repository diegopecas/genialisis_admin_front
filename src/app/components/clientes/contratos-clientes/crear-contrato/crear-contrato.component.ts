import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilService } from '../../../../common/constantes/util.service';
import { HeaderComponent } from '../../../../common/header/header.component';
import { DocumentosPersonaComponent } from '../../../../common/documentos-persona/documentos-persona.component';
import { RepresentantesService } from '../../../../services/representantes.service';
import {
  ContratoImplementacion,
  ContratosClienteService,
} from '../../../../services/contratos-cliente.service';
import { ClientesService } from '../../../../services/clientes.service';
import { ExportarPdfContratoService } from '../../../../services/exportar-pdf-contrato.service';
import { TarifasPlanesService } from '../../../../services/tarifas-planes.service';
import { DocumentosPersonasService } from '../../../../services/documentos-personas.service';
import { TiposDocumentosService } from '../../../../services/tipos-documentos.service';
import { CuentasPorCobrarService } from '../../../../services/cuentas-por-cobrar.service';
import { ConfiguracionGlobalService } from '../../../../services/configuracion-global.service';
import { PlantillasCamposService, PlantillaCampo } from '../../../../services/plantillas-campos.service';
import { ContratosCamposService } from '../../../../services/contratos-campos.service';
import { 
  ContratosClienteValoresService, 
  ContratoValor,
  ResumenValores 
} from '../../../../services/contratos-cliente-valores.service';

// Interfaz para agrupar valores por mes
interface ValorMensual {
  fecha: string;
  fechaFormateada: string;
  mes: number;
  anio: number;
  implementacion: ContratoValor | null;
  suscripcion: ContratoValor | null;
  totalMes: number;
}

@Component({
  selector: 'app-crear-contrato',
  templateUrl: './crear-contrato.component.html',
  styleUrl: './crear-contrato.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, RouterModule, DocumentosPersonaComponent],
})
export class CrearContratoComponent implements OnInit {
  public id = '0';
  public idCliente = '0';
  public accion = '';
  public editable = false;
  public submitted = false;
  public guardando = false;
  public tieneDocumentoFirmado = false;
  public cliente: any;
  public nombre_cliente = '';
  public titulo = 'Contrato de implementación';
  public regresar = '/clientes/contratos/';

  public representantesDisponibles = [] as any[];
  public tarifaPlan: any = null;
  public emailsFirmantes: string[] = [];

  // Campos que la minuta deja en blanco. Salen de plantillas_campos, asi que
  // agregar uno nuevo no obliga a tocar este componente.
  public camposPlantilla: PlantillaCampo[] = [];

  // Nuevas propiedades para valores detallados
  public valores: ContratoValor[] = [];
  public valoresMensuales: ValorMensual[] = [];
  public resumenValores: ResumenValores = {
    total_implementacion: 0,
    total_suscripcion: 0,
    numero_cuotas: 0,
    valor_total: 0
  };
  public cuotasImplementacion: number = 1;
  public valoresGenerados: boolean = false;

  public valorImplementacionFormateado: string = '';
  public valorSuscripcionFormateado: string = '';

  // Propiedades para descuentos y recargos
  public implementacionBase: number = 0;
  public suscripcionBase: number = 0;
  public descuento_implementacion: number = 0;
  public recargo_implementacion: number = 0;
  public descuento_suscripcion: number = 0;
  public recargo_suscripcion: number = 0;
  public razon_descuento: string = '';
  public razon_recargo: string = '';
  public implementacionFinal: number = 0;
  public suscripcionFinal: number = 0;
  public formateados = {
    descuentoImplementacion: '',
    recargoImplementacion: '',
    descuentoSuscripcion: '',
    recargoSuscripcion: '',
    implementacionFinal: '',
    suscripcionFinal: ''
  };

  // Propiedad para controlar estado de generación de cuentas por cobrar
  public generandoCuentas: boolean = false;

  public model: ContratoImplementacion = {
    id_cliente: '',
    anio: new Date().getFullYear(),
    id_plan: '',
    valor_implementacion: 0,
    valor_suscripcion: 0,
    numero_cuotas: 0,
    valor_total: 0,
    fecha_firma: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar_firma: 'Chía',
    autoriza_imagenes: 1,
    autoriza_pagare: 1,
    observaciones: '',
    representantes: [],
    firmado: 0,
    ruta_documento_firmado: undefined,
  };

  // Nombres de meses en español
  private nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private representantesService: RepresentantesService,
    private contratosImplementacionService: ContratosClienteService,
    private tarifasPlanesService: TarifasPlanesService,
    private exportarPdfContratoService: ExportarPdfContratoService,
    private utilService: UtilService,
    private documentosPersonasService: DocumentosPersonasService,
    private tiposDocumentosService: TiposDocumentosService,
    private configuracionGlobalService: ConfiguracionGlobalService,
    private plantillasCamposService: PlantillasCamposService,
    private contratosCamposService: ContratosCamposService,
    private contratosImplementacionValoresService: ContratosClienteValoresService,
    private cuentasPorCobrarService: CuentasPorCobrarService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.accion = params['accion'];
      this.id = params['id'];
      this.idCliente = params['idCliente'];
      this.regresar = this.regresar + this.idCliente;

      const hoy = new Date();
      this.model.fecha_firma = hoy.toISOString().split('T')[0];

      this.calcularFechaInicioPorDefecto();
      this.calcularFechaFinPorDefecto();

      this.obtenerCliente(this.idCliente);
      this.obtenerRepresentantes(this.idCliente);
      this.cargarCamposPlantilla();

      switch (this.accion) {
        case 'crear':
          this.editable = true;
          this.titulo = 'Nuevo contrato de implementación';
          break;
        case 'editar':
          this.editable = true;
          this.titulo = 'Editar contrato de implementación';
          this.obtenerContrato(this.id);
          break;
        case 'consultar':
          this.editable = false;
          this.titulo = 'Consultar contrato de implementación';
          this.obtenerContrato(this.id);
          break;
      }
    });
  }

  calcularFechaInicioPorDefecto() {
    const mes = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    const anioServicio = mes >= 11 ? anioActual + 1 : anioActual;
    this.model.fecha_inicio = `${anioServicio}-02-01`;
  }

  calcularFechaFinPorDefecto() {
    if (!this.model.fecha_inicio) return;
    const inicio = new Date(this.model.fecha_inicio + 'T00:00:00');
    const anioFin = inicio.getFullYear();
    this.model.fecha_fin = `${anioFin}-11-30`;
  }

  obtenerCliente(id_cliente: any) {
    this.clientesService
      .obtenerById(id_cliente)
      .subscribe((response: any) => {
        const body = response.body as any[];
        this.cliente = body[0];
        this.model.id_cliente = this.idCliente;
        this.model.id_plan = this.cliente.id_plan;

        this.nombre_cliente = [
          this.cliente.primer_nombre,
          this.cliente.segundo_nombre,
          this.cliente.primer_apellido,
          this.cliente.segundo_apellido,
        ]
          .filter(Boolean)
          .join(' ');

        this.titulo = this.titulo + ' - ' + this.nombre_cliente;

        // Cargar tarifas en cualquier acción (crear, editar, consultar)
        this.cargarTarifasPlan();
      });
  }

  obtenerRepresentantes(id_cliente: any) {
    this.representantesService
      .obtenerPorCliente(id_cliente)
      .subscribe((response: any) => {
        const body = response.body as any[];
        console.log('=== REPRESENTANTES RAW ===', body);
        
        // Solo los responsables de pago participan del contrato: son los que
        // aparecen en el listado, firman y reciben la solicitud de firma.
        this.representantesDisponibles = body
          .filter((a: any) => a.activo == 1 && a.es_responsable_pago == 1)
          .map((a: any) => ({
            ...a,
            nombre_completo: a.nombre_persona?.trim() || 'Sin nombre',
          }));

        console.log('=== REPRESENTANTES PROCESADOS ===', this.representantesDisponibles);

        this.emailsFirmantes = this.representantesDisponibles
          .map((a: any) => a.correo_electronico)
          .filter((email: string) => email && email.trim().length > 0);

        // El representante legal de la institucion tambien firma el contrato.
        // Su correo no esta en los representantes: sale de configuracion_global.
        this.agregarRepresentanteAFirmantes();

        if (this.accion === 'crear') {
          this.representantesDisponibles.forEach((a) => {
            this.model.representantes?.push(a.id);
          });
        }
      });
  }

  /**
   * Agrega el correo del representante legal de la institucion a la lista de
   * firmantes. Sin esto, el contrato solo se enviaba a firmar al cliente.
   */
  agregarRepresentanteAFirmantes() {
    this.configuracionGlobalService
      .obtenerMultiples(['representante_legal_email'])
      .subscribe({
        next: (respuesta: any) => {
          // El endpoint devuelve { clave: { valor_texto, valor_numero, ... } }
          const config = respuesta?.body || respuesta || {};
          const registro = config['representante_legal_email'];
          const email = (registro?.valor_texto || registro || '').toString().trim();

          if (!email) {
            return;
          }

          const yaEsta = this.emailsFirmantes.some(
            (e: string) => e.toLowerCase() === email.toLowerCase()
          );

          if (!yaEsta) {
            this.emailsFirmantes = [...this.emailsFirmantes, email];
          }
        },
        error: (error: any) => {
          console.error('No se pudo obtener el correo del representante legal:', error);
        },
      });
  }

  /**
   * Trae los campos configurados para la minuta del contrato y los inicializa
   * con su valor por defecto.
   */
  cargarCamposPlantilla() {
    this.plantillasCamposService.obtenerPorClave('contrato_completo').subscribe({
      next: (response: any) => {
        this.camposPlantilla = (response.body || []).map((campo: PlantillaCampo) => ({
          ...campo,
          valor: campo.valor_defecto || '',
          opcionesLista: this.opcionesDe(campo),
        }));
        console.log('=== CAMPOS DE LA MINUTA ===', this.camposPlantilla);

        // Se usa el id de la ruta y no model.id: cuando esto corre, la consulta
        // del contrato todavia puede no haber respondido.
        if (this.accion !== 'crear' && this.id) {
          this.cargarValoresCampos(this.id);
        }
      },
      error: (error: any) => {
        console.error('No se pudieron cargar los campos de la plantilla:', error);
        this.camposPlantilla = [];
      },
    });
  }

  /**
   * Trae lo diligenciado en un contrato existente.
   */
  cargarValoresCampos(idContrato: string) {
    this.contratosCamposService.obtenerPorContrato(idContrato).subscribe({
      next: (response: any) => {
        const filas = response.body || [];
        filas.forEach((fila: any) => {
          const campo = this.camposPlantilla.find((c: PlantillaCampo) => c.llave === fila.llave);
          if (campo) {
            campo.valor = fila.valor || '';
          }
        });
        console.log('=== VALORES DILIGENCIADOS ===', this.camposPlantilla);
      },
      error: (error: any) => {
        console.error('No se pudieron cargar los valores del contrato:', error);
      },
    });
  }

  /**
   * Guarda los campos diligenciados. Se llama despues de crear o actualizar el
   * contrato, cuando ya existe el id.
   */
  async guardarCamposContrato(idContrato: string) {
    if (!idContrato || this.camposPlantilla.length === 0) {
      return;
    }

    const campos = this.camposPlantilla.map((campo: PlantillaCampo) => ({
      llave: campo.llave,
      valor: campo.valor || '',
    }));
    console.log('=== GUARDANDO CAMPOS ===', idContrato, campos);

    try {
      await this.contratosCamposService.guardar(idContrato, campos).toPromise();
    } catch (error) {
      console.error('No se pudieron guardar los campos del contrato:', error);
    }
  }

  /**
   * Identidad estable de cada campo dentro del *ngFor.
   */
  trackByLlave(indice: number, campo: PlantillaCampo): string {
    return campo.llave;
  }

  /**
   * Opciones de un campo de tipo lista. Se guardan separadas por |, y cada una
   * puede traer una etiqueta legible despues de un =, por ejemplo:
   *   A=Cuenta propia del cliente|B=Cuenta gestionada por Genialisis
   * Lo que se almacena en el contrato es el valor (A o B); lo que ve el usuario
   * es la etiqueta.
   */
  opcionesDe(campo: PlantillaCampo): { valor: string; etiqueta: string }[] {
    if (!campo.opciones) {
      return [];
    }

    return campo.opciones
      .split('|')
      .map((o: string) => o.trim())
      .filter((o: string) => o.length > 0)
      .map((o: string) => {
        const posicion = o.indexOf('=');
        if (posicion === -1) {
          return { valor: o, etiqueta: o };
        }
        return {
          valor: o.substring(0, posicion).trim(),
          etiqueta: o.substring(posicion + 1).trim(),
        };
      });
  }

  obtenerContrato(id: any) {
    this.contratosImplementacionService
      .obtenerById(id)
      .subscribe((response: any) => {
        const body = response.body;
        if (body && body.length > 0) {
          const contrato = body[0];
          console.log('=== CONTRATO RAW ===', contrato);
          console.log('=== DESCUENTOS EN CONTRATO ===', {
            descuento_implementacion: contrato.descuento_implementacion,
            recargo_implementacion: contrato.recargo_implementacion,
            descuento_suscripcion: contrato.descuento_suscripcion,
            recargo_suscripcion: contrato.recargo_suscripcion,
            razon_descuento: contrato.razon_descuento,
            razon_recargo: contrato.razon_recargo
          });
          
          this.model = {
            ...contrato,
            representantes: [],
          };

          const estaFirmado = contrato.firmado == 1 || contrato.firmado === '1';
          
          if (estaFirmado && this.accion === 'editar') {
            this.editable = false;
            Swal.fire(
              'Información',
              'Este contrato ya está firmado y no puede ser editado.',
              'info'
            );
          }

          // Cargar representantes
          this.contratosImplementacionService
            .obtenerRepresentantesByContrato(id)
            .subscribe((respRepresentantes: any) => {
              const representantes = respRepresentantes.body as any[];
              this.model.representantes = representantes.map(
                (a: any) => a.id_representante
              );
            });

          // Cargar valores detallados
          this.cargarValoresContrato(id);

          // Cargar cuotas implementación del contrato
          if (contrato.cuotas_implementacion) {
            this.cuotasImplementacion = parseInt(contrato.cuotas_implementacion);
          }

          // Cargar descuentos y recargos del contrato
          this.descuento_implementacion = parseFloat(contrato.descuento_implementacion) || 0;
          this.recargo_implementacion = parseFloat(contrato.recargo_implementacion) || 0;
          this.descuento_suscripcion = parseFloat(contrato.descuento_suscripcion) || 0;
          this.recargo_suscripcion = parseFloat(contrato.recargo_suscripcion) || 0;
          this.razon_descuento = contrato.razon_descuento || '';
          this.razon_recargo = contrato.razon_recargo || '';
          
          console.log('=== DESCUENTOS CARGADOS ===', {
            descuento_implementacion: this.descuento_implementacion,
            recargo_implementacion: this.recargo_implementacion,
            descuento_suscripcion: this.descuento_suscripcion,
            recargo_suscripcion: this.recargo_suscripcion
          });
          
          // Los valores finales del contrato
          this.implementacionFinal = parseFloat(contrato.valor_implementacion) || 0;
          this.suscripcionFinal = parseFloat(contrato.valor_suscripcion) || 0;
          
          // Actualizar formatos para mostrar en los inputs
          this.actualizarFormatos();
          
          console.log('=== FORMATOS ACTUALIZADOS ===', this.formateados);

          this.verificarDocumentoFirmado();
        }
      });
  }

  // Cargar tarifas después de tener el cliente cargado (para edición)
  cargarTarifasParaEdicion() {
    if (!this.cliente?.id_plan || !this.model.anio) return;

    this.tarifasPlanesService
      .obtenerByPlanAnio(this.cliente.id_plan, this.model.anio)
      .subscribe({
        next: (response: any) => {
          this.tarifaPlan = response.body;
          if (this.tarifaPlan) {
            this.implementacionBase = parseFloat(this.tarifaPlan.valor_implementacion) || 0;
            this.suscripcionBase = parseFloat(this.tarifaPlan.valor_suscripcion) || 0;
            // Actualizar formatos
            this.calcularValoresFinales();
            this.actualizarFormatos();
          }
        },
        error: (error) => {
          console.log('No se encontraron tarifas para el plan');
          this.tarifaPlan = null;
        }
      });
  }

  cargarValoresContrato(idContrato: string) {
    this.contratosImplementacionValoresService
      .obtenerByContrato(idContrato)
      .subscribe({
        next: (response: any) => {
          this.valores = response.body || [];
          if (this.valores.length > 0) {
            this.valoresGenerados = true;
            this.agruparValoresPorMes();
            this.calcularResumen();
          }
        },
        error: (error) => {
          console.log('No se encontraron valores detallados:', error);
        }
      });
  }

  cargarTarifasPlan() {
    if (!this.cliente?.id_plan || !this.model.anio) return;

    this.tarifasPlanesService
      .obtenerByPlanAnio(this.cliente.id_plan, this.model.anio)
      .subscribe({
        next: (response: any) => {
          this.tarifaPlan = response.body;
          if (this.tarifaPlan) {
            // Inicializar valores base desde tarifas
            this.implementacionBase = parseFloat(this.tarifaPlan.valor_implementacion) || 0;
            this.suscripcionBase = parseFloat(this.tarifaPlan.valor_suscripcion) || 0;
            
            // Si es crear, inicializar valores finales = base
            if (this.accion === 'crear') {
              this.implementacionFinal = this.implementacionBase;
              this.suscripcionFinal = this.suscripcionBase;
              this.descuento_implementacion = 0;
              this.recargo_implementacion = 0;
              this.descuento_suscripcion = 0;
              this.recargo_suscripcion = 0;
            }
            // Calcular valores finales y actualizar formatos
            this.calcularValoresFinales();
            this.actualizarFormatos();
          }
        },
        error: (error) => {
          console.log('No se encontraron tarifas para el plan');
          this.tarifaPlan = null;
        },
      });
  }

  // ==================== GESTIÓN DE DESCUENTOS Y RECARGOS ====================

  calcularValoresFinales() {
    this.implementacionFinal = this.implementacionBase - this.descuento_implementacion + this.recargo_implementacion;
    this.suscripcionFinal = this.suscripcionBase - this.descuento_suscripcion + this.recargo_suscripcion;
    if (this.implementacionFinal < 0) this.implementacionFinal = 0;
    if (this.suscripcionFinal < 0) this.suscripcionFinal = 0;
  }

  actualizarFormatos() {
    this.formateados.descuentoImplementacion = this.formatearNumeroInput(this.descuento_implementacion);
    this.formateados.recargoImplementacion = this.formatearNumeroInput(this.recargo_implementacion);
    this.formateados.descuentoSuscripcion = this.formatearNumeroInput(this.descuento_suscripcion);
    this.formateados.recargoSuscripcion = this.formatearNumeroInput(this.recargo_suscripcion);
    this.formateados.implementacionFinal = this.formatearNumeroInput(this.implementacionFinal);
    this.formateados.suscripcionFinal = this.formatearNumeroInput(this.suscripcionFinal);
  }

  formatearNumeroInput(valor: number): string {
    if (!valor || valor === 0) return '';
    return valor.toLocaleString('es-CO');
  }

  onDescuentoImplementacionInput(event: any) {
    let valorStr = event.target.value.replace(/\./g, '').replace(/\D/g, '');
    this.descuento_implementacion = valorStr ? parseInt(valorStr) : 0;
    this.calcularValoresFinales();
    this.actualizarFormatos();
    event.target.value = this.formatearNumeroInput(this.descuento_implementacion);
  }

  onRecargoImplementacionInput(event: any) {
    let valorStr = event.target.value.replace(/\./g, '').replace(/\D/g, '');
    this.recargo_implementacion = valorStr ? parseInt(valorStr) : 0;
    this.calcularValoresFinales();
    this.actualizarFormatos();
    event.target.value = this.formatearNumeroInput(this.recargo_implementacion);
  }

  onDescuentoSuscripcionInput(event: any) {
    let valorStr = event.target.value.replace(/\./g, '').replace(/\D/g, '');
    this.descuento_suscripcion = valorStr ? parseInt(valorStr) : 0;
    this.calcularValoresFinales();
    this.actualizarFormatos();
    event.target.value = this.formatearNumeroInput(this.descuento_suscripcion);
  }

  onRecargoSuscripcionInput(event: any) {
    let valorStr = event.target.value.replace(/\./g, '').replace(/\D/g, '');
    this.recargo_suscripcion = valorStr ? parseInt(valorStr) : 0;
    this.calcularValoresFinales();
    this.actualizarFormatos();
    event.target.value = this.formatearNumeroInput(this.recargo_suscripcion);
  }

  hayDescuentos(): boolean {
    return this.descuento_implementacion > 0 || this.descuento_suscripcion > 0;
  }

  hayRecargos(): boolean {
    return this.recargo_implementacion > 0 || this.recargo_suscripcion > 0;
  }

  // Métodos para la tabla de valores mensuales
  formatearNumeroTabla(valor: number): string {
    if (!valor || valor === 0) return '';
    return valor.toLocaleString('es-CO');
  }

  onInputValorTabla(event: any, vm: any, tipo: string) {
    // Obtener solo dígitos
    let valorStr = event.target.value.replace(/\./g, '').replace(/\D/g, '');
    const nuevoValor = valorStr ? parseInt(valorStr) : 0;
    
    // Actualizar el valor en el objeto
    if (tipo === 'implementacion' && vm.implementacion) {
      vm.implementacion.valor = nuevoValor;
    } else if (tipo === 'suscripcion' && vm.suscripcion) {
      vm.suscripcion.valor = nuevoValor;
    }
    
    // Actualizar el total del mes
    vm.totalMes = (vm.implementacion?.valor || 0) + (vm.suscripcion?.valor || 0);
    
    // Recalcular el resumen
    this.calcularResumen();
    
    // Formatear mientras escribe
    if (nuevoValor > 0) {
      const cursorPos = event.target.selectionStart;
      const valorFormateado = nuevoValor.toLocaleString('es-CO');
      const diffLength = valorFormateado.length - event.target.value.length;
      event.target.value = valorFormateado;
      // Intentar mantener posición del cursor
      const newPos = cursorPos + diffLength;
      event.target.setSelectionRange(newPos, newPos);
    }
  }

  onBlurValorTabla(event: any, vm: any, tipo: string) {
    // Al salir, asegurar formato correcto
    let valor = 0;
    if (tipo === 'implementacion' && vm.implementacion) {
      valor = vm.implementacion.valor || 0;
    } else if (tipo === 'suscripcion' && vm.suscripcion) {
      valor = vm.suscripcion.valor || 0;
    }
    event.target.value = this.formatearNumeroTabla(valor);
  }

  // ==================== GESTIÓN DE VALORES ====================

  generarValores() {
    if (!this.model.fecha_inicio || !this.model.fecha_fin) {
      Swal.fire('Error', 'Debe seleccionar fecha de inicio y fin', 'error');
      return;
    }

    if (!this.cliente?.id_plan || !this.model.anio) {
      Swal.fire('Error', 'Faltan datos del cliente o año', 'error');
      return;
    }

    // Si ya hay valores, confirmar antes de regenerar
    if (this.valoresGenerados && this.valores.length > 0) {
      Swal.fire({
        title: '¿Regenerar valores?',
        text: 'Esto reemplazará los valores actuales. ¿Desea continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, regenerar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarGeneracionValores();
        }
      });
    } else {
      this.ejecutarGeneracionValores();
    }
  }

  private ejecutarGeneracionValores() {
    // Asegurar que los valores finales estén calculados
    this.calcularValoresFinales();
    
    this.contratosImplementacionValoresService
      .generarValoresPorDefecto({
        id_plan: this.cliente.id_plan,
        anio: this.model.anio,
        fecha_inicio: this.model.fecha_inicio!,
        fecha_fin: this.model.fecha_fin!,
        cuotas_implementacion: this.cuotasImplementacion,
        // Enviar valores finales (con descuentos/recargos aplicados)
        valor_implementacion: this.implementacionFinal,
        valor_suscripcion: this.suscripcionFinal
      })
      .subscribe({
        next: (response) => {
          this.valores = response.valores;
          // NO sobrescribir tarifaPlan para mantener los valores base
          // this.tarifaPlan = response.tarifa;
          this.resumenValores = response.resumen;
          this.valoresGenerados = true;
          this.agruparValoresPorMes();
          this.actualizarModeloDesdeResumen();
        },
        error: (error) => {
          console.error('Error al generar valores:', error);
          Swal.fire('Error', 'No se pudieron generar los valores. Verifique que existan tarifas configuradas.', 'error');
        }
      });
  }

  agruparValoresPorMes() {
    const planes: Map<string, ValorMensual> = new Map();

    this.valores.forEach(valor => {
      const fecha = valor.fecha;
      
      if (!planes.has(fecha)) {
        const fechaObj = new Date(fecha + 'T00:00:00');
        planes.set(fecha, {
          fecha: fecha,
          fechaFormateada: this.formatearMesAnio(fechaObj),
          mes: fechaObj.getMonth() + 1,
          anio: fechaObj.getFullYear(),
          implementacion: null,
          suscripcion: null,
          totalMes: 0
        });
      }

      const plan = planes.get(fecha)!;
      
      // Periodicidad 1 = Anual (Implementación), 2 = Mensual (Suscripción)
      if (valor.id_periodicidad_cobro === 1 || valor.es_implementacion) {
        plan.implementacion = valor;
      } else {
        plan.suscripcion = valor;
      }
      
      plan.totalMes = (plan.implementacion?.valor || 0) + (plan.suscripcion?.valor || 0);
    });

    this.valoresMensuales = Array.from(planes.values()).sort((a, b) => 
      a.fecha.localeCompare(b.fecha)
    );
  }

  formatearMesAnio(fecha: Date): string {
    const mes = this.nombresMeses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${mes} ${anio}`;
  }

  onValorChange(valorMensual: ValorMensual, tipo: 'implementacion' | 'suscripcion', event: any) {
    const inputValue = event.target.value.replace(/[^\d]/g, '');
    const nuevoValor = inputValue === '' ? 0 : parseFloat(inputValue);

    if (tipo === 'implementacion' && valorMensual.implementacion) {
      valorMensual.implementacion.valor = nuevoValor;
    } else if (tipo === 'suscripcion' && valorMensual.suscripcion) {
      valorMensual.suscripcion.valor = nuevoValor;
    }

    valorMensual.totalMes = (valorMensual.implementacion?.valor || 0) + (valorMensual.suscripcion?.valor || 0);
    
    // Formatear el input
    event.target.value = nuevoValor > 0 ? nuevoValor.toLocaleString('es-CO') : '';
    
    this.calcularResumen();
    this.actualizarModeloDesdeResumen();
  }

  formatearValorInput(valor: number | undefined): string {
    if (!valor || valor === 0) return '';
    return valor.toLocaleString('es-CO');
  }

  calcularResumen() {
    let totalImplementacion = 0;
    let totalSuscripcion = 0;
    let numeroCuotas = 0;

    this.valoresMensuales.forEach(vm => {
      if (vm.implementacion) {
        totalImplementacion += vm.implementacion.valor;
      }
      if (vm.suscripcion) {
        totalSuscripcion += vm.suscripcion.valor;
        numeroCuotas++;
      }
    });

    this.resumenValores = {
      total_implementacion: totalImplementacion,
      total_suscripcion: totalSuscripcion,
      numero_cuotas: numeroCuotas,
      valor_total: totalImplementacion + totalSuscripcion
    };
  }

  actualizarModeloDesdeResumen() {
    this.model.valor_implementacion = this.resumenValores.total_implementacion;
    this.model.valor_suscripcion = this.resumenValores.total_suscripcion;
    this.model.numero_cuotas = this.resumenValores.numero_cuotas;
    this.model.valor_total = this.resumenValores.valor_total;
  }

  /**
   * Una fecha se considera completa solo si el navegador entrego el formato
   * aaaa-mm-dd con un anio de cuatro digitos plausible. Mientras el usuario
   * teclea, el input de tipo date va entregando valores parciales como
   * 0002-12-30, y validar esos valores hacia saltar la alerta a mitad de
   * escritura y borraba lo que la persona estaba digitando.
   */
  private fechaCompleta(valor: string | undefined | null): valor is string {
    if (!valor || typeof valor !== 'string') {
      return false;
    }
    const partes = valor.split('-');
    if (partes.length !== 3) {
      return false;
    }
    const anio = parseInt(partes[0], 10);
    return !isNaN(anio) && anio >= 1900 && anio <= 2999;
  }

  onFechaInicioChange() {
    // Ajustar fecha fin si es necesario
    const fechaInicio = this.model.fecha_inicio;
    const fechaFin = this.model.fecha_fin;

    if (this.fechaCompleta(fechaInicio) && this.fechaCompleta(fechaFin)) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (fin < inicio) {
        this.calcularFechaFinPorDefecto();
      }
    }
  }

  onFechaFinChange() {
    // Validar que fecha fin sea mayor que fecha inicio
    const fechaInicio = this.model.fecha_inicio;
    const fechaFin = this.model.fecha_fin;

    if (this.fechaCompleta(fechaInicio) && this.fechaCompleta(fechaFin)) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (fin < inicio) {
        Swal.fire('Error', 'La fecha fin debe ser mayor que la fecha inicio', 'error');
        this.calcularFechaFinPorDefecto();
      }
    }
  }

  onAnioCambiado() {
    this.cargarTarifasPlan();
    this.verificarContratoExistente();
    
    // Limpiar valores si cambia el año
    if (this.valoresGenerados) {
      Swal.fire({
        title: 'Año modificado',
        text: '¿Desea regenerar los valores con las nuevas tarifas?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, regenerar',
        cancelButtonText: 'No, mantener'
      }).then((result) => {
        if (result.isConfirmed) {
          this.valores = [];
          this.valoresMensuales = [];
          this.valoresGenerados = false;
        }
      });
    }
  }

  onCuotasImplementacionChange() {
    // Si ya hay valores generados, ofrecer regenerar
    if (this.valoresGenerados && this.valores.length > 0) {
      Swal.fire({
        title: 'Cuotas de implementación modificadas',
        text: '¿Desea redistribuir el valor de la implementación?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, redistribuir',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.isConfirmed) {
          this.redistribuirImplementacion();
        }
      });
    }
  }

  redistribuirImplementacion() {
    if (!this.tarifaPlan || this.cuotasImplementacion < 1) return;

    const valorCuotaImplementacion = Math.round(this.tarifaPlan.valor_implementacion / this.cuotasImplementacion);
    let cuotasAsignadas = 0;

    this.valoresMensuales.forEach((vm, index) => {
      if (cuotasAsignadas < this.cuotasImplementacion) {
        // Agregar o actualizar cuota de implementación
        if (!vm.implementacion) {
          vm.implementacion = {
            id_producto_servicio: this.tarifaPlan.id_producto_implementacion,
            nombre_producto: this.tarifaPlan.nombre_implementacion,
            fecha: vm.fecha,
            valor: valorCuotaImplementacion,
            id_periodicidad_cobro: 1,
            es_implementacion: true
          };
          this.valores.push(vm.implementacion);
        } else {
          vm.implementacion.valor = valorCuotaImplementacion;
        }
        cuotasAsignadas++;
      } else if (vm.implementacion) {
        // Quitar implementación de este mes
        const idx = this.valores.indexOf(vm.implementacion);
        if (idx > -1) {
          this.valores.splice(idx, 1);
        }
        vm.implementacion = null;
      }
      
      vm.totalMes = (vm.implementacion?.valor || 0) + (vm.suscripcion?.valor || 0);
    });

    this.calcularResumen();
    this.actualizarModeloDesdeResumen();
  }

  // ==================== GENERACIÓN DE CUENTAS POR COBRAR ====================

  generarCuentasPorCobrar() {
    if (!this.model.id || !this.valoresGenerados || this.valores.length === 0) {
      Swal.fire('Error', 'No hay valores generados para crear cuentas por cobrar', 'error');
      return;
    }

    const totalCuentas = this.valores.length;
    const totalValor = this.resumenValores.valor_total;

    Swal.fire({
      title: 'Generar Cuentas por Cobrar',
      html: `Se generarán <strong>${totalCuentas}</strong> cuentas por cobrar por un total de <strong>${this.formatearMoneda(totalValor)}</strong>.<br><br>¿Desea continuar?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#26a69a'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGeneracionCuentas();
      }
    });
  }

  private ejecutarGeneracionCuentas() {
    this.generandoCuentas = true;

    Swal.fire({
      title: 'Generando cuentas...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const idUsuario = this.utilService.obtenerIdUsuarioActual();

    this.cuentasPorCobrarService
      .generarDesdeContrato(this.model.id!, idUsuario)
      .subscribe({
        next: (response: any) => {
          this.generandoCuentas = false;
          Swal.close();

          if (response.error) {
            Swal.fire('Error', response.error, 'error');
            return;
          }

          if (response.duplicados && response.duplicados.length > 0) {
            let tablaHTML = '<table class="table table-sm table-bordered" style="font-size: 0.85rem;">';
            tablaHTML += '<thead><tr><th>Producto</th><th>Fecha</th></tr></thead><tbody>';
            response.duplicados.forEach((dup: any) => {
              tablaHTML += `<tr><td>${dup.nombre_producto}</td><td>${dup.fecha}</td></tr>`;
            });
            tablaHTML += '</tbody></table>';

            Swal.fire({
              title: 'No se pudieron generar las cuentas',
              html: `Ya existen cuentas por cobrar para los siguientes conceptos:<br><br>${tablaHTML}<br>Debe generar las cuentas de forma manual desde el módulo de Productos y Servicios.`,
              icon: 'warning',
              width: 600
            });
            return;
          }

          Swal.fire({
            title: 'Cuentas generadas exitosamente',
            html: `Se crearon <strong>${response.cuentas_creadas}</strong> cuentas por cobrar:<br><br>
                   Implementación: <strong>${this.formatearMoneda(response.total_implementacion)}</strong><br>
                   Suscripciones: <strong>${this.formatearMoneda(response.total_suscripcion)}</strong><br>
                   <hr>
                   <strong>Total: ${this.formatearMoneda(response.total_general)}</strong>`,
            icon: 'success',
            confirmButtonColor: '#26a69a'
          });
        },
        error: (error: any) => {
          this.generandoCuentas = false;
          Swal.close();
          console.error('Error al generar cuentas por cobrar:', error);
          Swal.fire('Error', 'No se pudieron generar las cuentas por cobrar', 'error');
        }
      });
  }

  // ==================== RESTO DE MÉTODOS EXISTENTES ====================

  verificarContratoExistente() {
    if (!this.model.id_cliente || !this.model.anio) return;

    this.contratosImplementacionService
      .verificarExistente(this.model.id_cliente, this.model.anio)
      .subscribe({
        next: (response: any) => {
          if (response.existe && this.accion === 'crear') {
            Swal.fire({
              title: 'Contrato existente',
              html: `Ya existe un contrato activo para el año ${this.model.anio}.<br>
                     ¿Desea ver el contrato existente?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sí, ver contrato',
              cancelButtonText: 'Continuar de todas formas',
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate([
                  '/clientes/contratos/consultar/' +
                    response.id_contrato +
                    '/' +
                    this.idCliente,
                ]);
              }
            });
          }
        },
        error: (error) => {
          console.log('Error verificando contrato:', error);
        },
      });
  }

  toggleRepresentante(idRepresentante: string) {
    if (!this.model.representantes) {
      this.model.representantes = [];
    }
    const index = this.model.representantes.indexOf(idRepresentante);
    if (index > -1) {
      this.model.representantes.splice(index, 1);
    } else {
      this.model.representantes.push(idRepresentante);
    }
  }

  isRepresentanteSeleccionado(idRepresentante: string): boolean {
    return this.model.representantes?.includes(idRepresentante) || false;
  }

  formularioValido(): boolean {
    return !!(
      this.model.anio &&
      this.model.fecha_firma &&
      this.model.fecha_inicio &&
      this.model.fecha_fin &&
      this.model.lugar_firma &&
      this.valoresGenerados &&
      this.valores.length > 0 &&
      this.model.representantes &&
      this.model.representantes.length > 0
    );
  }

  validarSumaCuotasImplementacion(): boolean {
    // Sumar todos los valores de implementación en los valores detallados
    const sumaImplementacion = this.valores
      .filter(v => v.id_periodicidad_cobro === 1) // Solo implementación
      .reduce((sum, v) => sum + (v.valor || 0), 0);
    
    // Comparar con el valor final de implementación (con tolerancia de 1 peso por redondeo)
    const diferencia = Math.abs(sumaImplementacion - this.implementacionFinal);
    
    if (diferencia > 1) {
      Swal.fire({
        title: 'Error en valores de implementación',
        html: `La suma de las cuotas de implementación (<strong>${this.formatearMoneda(sumaImplementacion)}</strong>) 
               no coincide con el valor de implementación (<strong>${this.formatearMoneda(this.implementacionFinal)}</strong>).
               <br><br>Diferencia: ${this.formatearMoneda(diferencia)}
               <br><br>Por favor regenere los valores o ajuste manualmente.`,
        icon: 'error'
      });
      return false;
    }
    return true;
  }

  async grabar() {
    this.submitted = true;
    if (!this.formularioValido()) {
      Swal.fire(
        'Error',
        'Por favor complete todos los campos requeridos y genere los valores del contrato',
        'error'
      );
      return;
    }

    // Validar suma de cuotas de implementación
    if (!this.validarSumaCuotasImplementacion()) {
      return;
    }

    this.guardando = true;
    this.model.id_usuario_genera =
      this.utilService.obtenerIdUsuarioActual() ?? undefined;
    
    // Agregar campos adicionales al modelo
    (this.model as any).cuotas_implementacion = this.cuotasImplementacion;
    (this.model as any).descuento_implementacion = this.descuento_implementacion;
    (this.model as any).recargo_implementacion = this.recargo_implementacion;
    (this.model as any).descuento_suscripcion = this.descuento_suscripcion;
    (this.model as any).recargo_suscripcion = this.recargo_suscripcion;
    (this.model as any).razon_descuento = this.razon_descuento;
    (this.model as any).razon_recargo = this.razon_recargo;
    
    // Actualizar valores del modelo con los finales
    this.model.valor_implementacion = this.implementacionFinal;
    this.model.valor_suscripcion = this.suscripcionFinal;

    try {
      if (this.accion === 'crear') {
        // Crear contrato
        const responseContrato: any = await this.contratosImplementacionService
          .crear(this.model)
          .toPromise();
        
        const idContrato = responseContrato.id;

        // Guardar valores detallados
        await this.contratosImplementacionValoresService
          .guardarValores(idContrato, this.valores)
          .toPromise();

        await this.guardarCamposContrato(idContrato);

        this.guardando = false;
        Swal.fire({
          title: 'Contrato creado',
          text: 'El contrato se ha guardado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.volver();
        });
      } else {
        // Actualizar contrato
        await this.contratosImplementacionService.actualizar(this.model).toPromise();

        // Guardar valores detallados
        await this.contratosImplementacionValoresService
          .guardarValores(this.model.id!, this.valores)
          .toPromise();

        await this.guardarCamposContrato(this.model.id!);

        this.guardando = false;
        Swal.fire({
          title: 'Contrato actualizado',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          this.volver();
        });
      }
    } catch (error) {
      this.guardando = false;
      console.error('Error al guardar contrato:', error);
      Swal.fire('Error', 'No se pudo guardar el contrato', 'error');
    }
  }

  async grabarYGenerarPDF() {
    this.submitted = true;
    if (!this.formularioValido()) {
      Swal.fire(
        'Error',
        'Por favor complete todos los campos requeridos y genere los valores del contrato',
        'error'
      );
      return;
    }

    // Validar suma de cuotas de implementación
    if (!this.validarSumaCuotasImplementacion()) {
      return;
    }

    this.guardando = true;
    this.model.id_usuario_genera =
      this.utilService.obtenerIdUsuarioActual() ?? undefined;
    
    // Agregar campos adicionales al modelo
    (this.model as any).cuotas_implementacion = this.cuotasImplementacion;
    (this.model as any).descuento_implementacion = this.descuento_implementacion;
    (this.model as any).recargo_implementacion = this.recargo_implementacion;
    (this.model as any).descuento_suscripcion = this.descuento_suscripcion;
    (this.model as any).recargo_suscripcion = this.recargo_suscripcion;
    (this.model as any).razon_descuento = this.razon_descuento;
    (this.model as any).razon_recargo = this.razon_recargo;
    
    // Actualizar valores del modelo con los finales
    this.model.valor_implementacion = this.implementacionFinal;
    this.model.valor_suscripcion = this.suscripcionFinal;

    try {
      // Crear contrato
      const responseContrato: any = await this.contratosImplementacionService
        .crear(this.model)
        .toPromise();
      
      const idContrato = responseContrato.id;

      // Guardar valores detallados
      await this.contratosImplementacionValoresService
        .guardarValores(idContrato, this.valores)
        .toPromise();

      await this.guardarCamposContrato(idContrato);

      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.contratosImplementacionService
        .obtenerDatosContrato(idContrato)
        .subscribe({
          next: async (datos: any) => {
            await this.exportarPdfContratoService.generarPDF(datos);
            this.guardando = false;
            Swal.close();

            Swal.fire({
              title: 'Contrato creado y PDF generado',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            }).then(() => {
              this.volver();
            });
          },
          error: (error: any) => {
            this.guardando = false;
            Swal.close();
            console.error('Error al generar PDF:', error);
            Swal.fire({
              title: 'Contrato guardado',
              text: 'El contrato se guardó pero hubo un error al generar el PDF',
              icon: 'warning',
            }).then(() => {
              this.volver();
            });
          },
        });
    } catch (error) {
      this.guardando = false;
      console.error('Error:', error);
      Swal.fire('Error', 'No se pudo crear el contrato', 'error');
    }
  }

  marcarComoFirmado() {
    Swal.fire({
      title: '¿Marcar como firmado?',
      text: 'Una vez marcado como firmado, el contrato no podrá ser editado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como firmado',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.tiposDocumentosService.obtenerPorTipoPersona('cliente').subscribe({
          next: (responseTipos: any) => {
            const tiposDocumentos = responseTipos.body;
            const tipoContratoFirmado = tiposDocumentos.find(
              (td: any) => td.codigo === 'contrato_implementacion_firmado'
            );

            if (!tipoContratoFirmado) {
              console.error('No se encontró el tipo de documento contrato_implementacion_firmado');
              this.marcarSinDocumento();
              return;
            }

            this.documentosPersonasService
              .obtenerPorPersona(this.cliente.id_persona, this.model.id, tipoContratoFirmado.id)
              .subscribe({
                next: (responseDoc: any) => {
                  const documentos = responseDoc.body;
                  let rutaDocumento: string | undefined = undefined;

                  if (documentos && documentos.length > 0) {
                    rutaDocumento = documentos[0].ruta_archivo;
                  }

                  this.contratosImplementacionService
                    .marcarFirmado(this.model.id!, rutaDocumento)
                    .subscribe({
                      next: () => {
                        this.model.firmado = 1;
                        if (rutaDocumento) {
                          this.model.ruta_documento_firmado = rutaDocumento;
                        }
                        Swal.fire(
                          'Éxito',
                          'El contrato ha sido marcado como firmado',
                          'success'
                        );
                        this.editable = false;
                      },
                      error: (error: any) => {
                        console.error('Error:', error);
                        Swal.fire(
                          'Error',
                          'No se pudo actualizar el estado del contrato',
                          'error'
                        );
                      },
                    });
                },
                error: (error: any) => {
                  console.error('Error al buscar documentos:', error);
                  this.marcarSinDocumento();
                },
              });
          },
          error: (error: any) => {
            console.error('Error al obtener tipos de documentos:', error);
            this.marcarSinDocumento();
          },
        });
      }
    });
  }

  private marcarSinDocumento() {
    this.contratosImplementacionService
      .marcarFirmado(this.model.id!)
      .subscribe({
        next: () => {
          this.model.firmado = 1;
          Swal.fire(
            'Éxito',
            'El contrato ha sido marcado como firmado',
            'success'
          );
          this.editable = false;
        },
        error: (error: any) => {
          console.error('Error:', error);
          Swal.fire(
            'Error',
            'No se pudo actualizar el estado del contrato',
            'error'
          );
        },
      });
  }

  volver() {
    this.router.navigate(['/clientes/contratos/' + this.idCliente]);
  }

  formatearMoneda(valor: number): string {
    return (
      valor?.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }) || '$0'
    );
  }

  formatearFecha(fechaStr: string | undefined): string {
    if (!fechaStr) return '';
    const [fecha] = fechaStr.split('T');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  verificarDocumentoFirmado() {
    if (!this.cliente?.id_persona || !this.model.id) return;

    this.tiposDocumentosService.obtenerPorTipoPersona('cliente').subscribe({
      next: (responseTipos: any) => {
        const tiposDocumentos = responseTipos.body;
        const tipoContratoFirmado = tiposDocumentos.find(
          (td: any) => td.codigo === 'contrato_implementacion_firmado'
        );

        if (!tipoContratoFirmado) return;

        this.documentosPersonasService
          .obtenerPorPersona(this.cliente.id_persona, this.model.id, tipoContratoFirmado.id)
          .subscribe({
            next: (responseDoc: any) => {
              const documentos = responseDoc.body;
              this.tieneDocumentoFirmado = documentos && documentos.length > 0;
            },
            error: () => {
              this.tieneDocumentoFirmado = false;
            }
          });
      }
    });
  }

  onDocumentoSubido(evento: any) {
    if (evento.codigo_tipo === 'contrato_implementacion_firmado') {
      if (evento.eliminado) {
        this.verificarDocumentoFirmado();
      } else {
        this.tieneDocumentoFirmado = true;
      }
    }
  }

  async generarPDF() {
    if (!this.model.id) {
      Swal.fire('Error', 'No hay contrato para generar PDF', 'error');
      return;
    }

    this.submitted = true;
    if (!this.formularioValido()) {
      Swal.fire(
        'Error',
        'Por favor complete todos los campos requeridos antes de generar el PDF',
        'error'
      );
      return;
    }

    this.guardando = true;

    try {
      await this.contratosImplementacionService.actualizar(this.model).toPromise();

      await this.contratosImplementacionValoresService
        .guardarValores(this.model.id, this.valores)
        .toPromise();

      await this.guardarCamposContrato(this.model.id);

      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.contratosImplementacionService
        .obtenerDatosContrato(this.model.id)
        .subscribe({
          next: async (datos: any) => {
            await this.exportarPdfContratoService.generarPDF(datos);
            this.guardando = false;
            Swal.close();

            Swal.fire({
              title: 'PDF generado',
              text: 'Los cambios se guardaron y el PDF fue generado correctamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error: any) => {
            this.guardando = false;
            Swal.close();
            console.error('Error al generar PDF:', error);
            Swal.fire('Error', 'No se pudo generar el PDF', 'error');
          },
        });
    } catch (error) {
      this.guardando = false;
      console.error('Error al guardar contrato:', error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  }
}