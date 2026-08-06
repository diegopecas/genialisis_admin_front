import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponentAnidado } from '../../../common/header-anidado/header-anidado.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import { ContratosClienteService } from '../../../services/contratos-cliente.service';
import { ClientesService } from '../../../services/clientes.service';
import { ExportarPdfContratoService } from '../../../services/exportar-pdf-contrato.service';
import { DocumentosPersonasService } from '../../../services/documentos-personas.service';
import { TiposDocumentosService } from '../../../services/tipos-documentos.service';
import { PermisosService } from '../../../services/permisos.service';

@Component({
  selector: 'app-contratos-clientes',
  standalone: true,
  imports: [CommonModule, TablasComponent, HeaderComponentAnidado],
  templateUrl: './contratos-clientes.component.html',
  styleUrl: './contratos-clientes.component.scss'
})
export class ContratosClientesComponent {
  public titulo = "Contratos de implementación";
  public idCliente = "0";
  public accion = "";
  public path = "/clientes/contratos/crear/0/"
  public cliente: any;
  public nombre_cliente = "";
  public titulos = [] as any[];
  public datos = [] as any[];
  public columnasFiltro = ['Año', 'Plan', 'Estado'];

  public acciones = [
    { id: 'descargar_pdf', label: 'Descargar PDF', icono: 'fas fa-file-pdf', condicion: 'mostrar_descargar', valor: true },
    { id: 'desmarcar_firmado', label: 'Desmarcar Firmado', icono: 'fas fa-signature', condicion: 'mostrar_desmarcar_firmado', valor: true },
  ] as any[];

  // Variables de permisos
  public puedeAdministrar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private contratosImplementacionService: ContratosClienteService,
    private exportarPdfContratoService: ExportarPdfContratoService,
    private documentosPersonasService: DocumentosPersonasService,
    private tiposDocumentosService: TiposDocumentosService,
    private permisosService: PermisosService
  ) { }

  ngOnInit() {
    this.configurarPermisos();
    this.route.params.subscribe(params => {
      this.accion = params['accion'];
      this.idCliente = params['id'];
      this.path = this.path + this.idCliente;
      this.obtenerCliente(this.idCliente);
    });

    this.crearTitulos();
  }

  configurarPermisos(): void {
    this.puedeAdministrar = this.permisosService.tienePermiso('clientes.contratos.administrar');
  }

  obtenerTodos(id_cliente: any): void {
    this.contratosImplementacionService.obtenerByCliente(id_cliente).subscribe((response: any) => {
      const body = response.body as any[];
      
      this.datos = body.map((c: any) => ({
        ...c,
        estado: c.activo === 1 ? 'Activo' : 'Anulado',
        estado_firma: c.firmado === 1 ? 'Firmado' : 'Sin firmar',
        puede_editar: c.firmado === 0,
        mostrar_desmarcar_firmado: c.firmado === 1,
        mostrar_descargar: c.firmado === 1,
        color: c.activo === 0 ? '#f8d7da' : '',
        valor_total_formato: this.formatearMoneda(c.valor_total),
        fecha_firma_formato: this.formatearFecha(c.fecha_firma)
      }));
    });
  }

  crearTitulos() {
    this.titulos = [
      {
        clave: 'id',
        alias: 'ID',
        alinear: 'centrado',
      },
      {
        clave: 'anio',
        alias: 'Año',
        alinear: 'centrado',
      },
      {
        clave: 'nombre_plan',
        alias: 'Plan',
        alinear: 'izquierda',
      },
      {
        clave: 'valor_total_formato',
        alias: 'Valor Total',
        alinear: 'derecha',
      },
      {
        clave: 'fecha_firma_formato',
        alias: 'Fecha Firma',
        alinear: 'centrado',
      },
      {
        clave: 'estado',
        alias: 'Estado',
      },
      {
        clave: 'estado_firma',
        alias: 'Firma',
        alinear: 'centrado',
      },
    ];
  }

  obtenerCliente(id_cliente: any) {
    this.clientesService.obtenerById(id_cliente).subscribe((response: any) => {
      const body = response.body as any[];
      this.cliente = body[0];
      this.nombre_cliente = [
        this.cliente.primer_nombre,
        this.cliente.segundo_nombre,
        this.cliente.primer_apellido,
        this.cliente.segundo_apellido
      ].filter(Boolean).join(' ');
      this.obtenerTodos(this.idCliente);
      this.titulo = this.titulo + " de " + this.nombre_cliente;
    });
  }

  seleccionar(event: any) {
    switch (event.accion) {
      case 'consultar':
        this.router.navigate(['clientes/contratos/consultar/' + event.id + '/' + this.idCliente]);
        break;
      case 'editar':
        this.router.navigate(['clientes/contratos/editar/' + event.id + '/' + this.idCliente]);
        break;
      case 'eliminar':
        this.anularContrato(event.id, event.registro);
        break;
      case 'descargar_pdf':
        this.descargarPDF(event.id);
        break;
      case 'desmarcar_firmado':
        if (event.registro.firmado === 1) {
          this.desmarcarFirmado(event.id, event.registro);
        }
        break;
    }
  }

  anularContrato(id: any, registro: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se anulará el contrato del año ${registro.anio}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.contratosImplementacionService.anular(id).subscribe({
          next: (response: any) => {
            Swal.fire({
              title: 'Contrato anulado',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.obtenerTodos(this.idCliente);
          },
          error: (error) => {
            console.error('Error al anular contrato:', error);
            Swal.fire('Error', 'No se pudo anular el contrato', 'error');
          }
        });
      }
    });
  }

  async descargarPDF(idContrato: string) {
    // Obtener el contrato para acceder al id_persona
    this.contratosImplementacionService.obtenerById(idContrato).subscribe({
      next: (contratoResponse: any) => {
        const contrato = contratoResponse.body?.[0];
        
        if (!contrato) {
          Swal.fire('Error', 'No se encontró el contrato', 'error');
          return;
        }

        // Obtener el cliente para tener id_persona
        this.clientesService.obtenerById(contrato.id_cliente).subscribe({
          next: (clienteResponse: any) => {
            const cliente = clienteResponse.body?.[0];
            
            if (!cliente?.id_persona) {
              Swal.fire('Error', 'No se encontró información del cliente', 'error');
              return;
            }

            // Primero buscar el ID del tipo de documento 'contrato_implementacion_firmado'
            this.tiposDocumentosService.obtenerPorTipoPersona('cliente').subscribe({
              next: (tiposResponse: any) => {
                const tipos = tiposResponse.body || [];
                const tipoContratoFirmado = tipos.find((t: any) => t.codigo === 'contrato_implementacion_firmado');

                if (!tipoContratoFirmado) {
                  Swal.fire('Error', 'No se encontró el tipo de documento', 'error');
                  return;
                }

                // Ahora buscar el documento con ese tipo
                this.documentosPersonasService.obtenerPorPersona(cliente.id_persona, idContrato, tipoContratoFirmado.id).subscribe({
                  next: (docResponse: any) => {
                    const documentos = docResponse.body || [];
                    
                    if (documentos.length > 0 && documentos[0].id) {
                      // Descarga blob centralizada en el servicio (token en header)
                      this.documentosPersonasService.descargarDocumentoArchivo(documentos[0].id);
                    } else {
                      Swal.fire('Error', 'No se encontró el documento firmado', 'error');
                    }
                  },
                  error: (error) => {
                    console.error('Error al buscar documentos:', error);
                    Swal.fire('Error', 'No se pudo obtener el documento', 'error');
                  }
                });
              },
              error: (error) => {
                console.error('Error al obtener tipos de documento:', error);
                Swal.fire('Error', 'No se pudo obtener tipos de documento', 'error');
              }
            });
          },
          error: (error) => {
            console.error('Error al obtener cliente:', error);
            Swal.fire('Error', 'No se pudo obtener información del cliente', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo obtener el contrato', 'error');
      }
    });
  }

  desmarcarFirmado(id: any, registro: any) {
    Swal.fire({
      title: '¿Desmarcar como firmado?',
      text: `Se quitará la marca de firmado del contrato del año ${registro.anio}. El contrato podrá volver a ser editado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desmarcar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.contratosImplementacionService.desmarcarFirmado(id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Contrato desmarcado',
              text: 'El contrato ya no está marcado como firmado',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.obtenerTodos(this.idCliente);
          },
          error: (error) => {
            console.error('Error al desmarcar:', error);
            Swal.fire('Error', 'No se pudo desmarcar el contrato', 'error');
          }
        });
      }
    });
  }

  formatearMoneda(valor: number): string {
    return valor?.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }) || '$0';
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const [fecha] = fechaStr.split('T');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
}