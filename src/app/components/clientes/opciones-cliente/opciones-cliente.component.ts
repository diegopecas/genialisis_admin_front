import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { ClientesService } from '../../../services/clientes.service';
import { PlanesService } from '../../../services/planes.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';
import { PermisosService } from '../../../services/permisos.service';

interface OpcionCliente {
  id: string;
  label: string;
  icono: string;
  categoria: string;
  permiso: string | null; // null => visible para todos
  ruta: string | null;    // null => acción en sitio (ej. cambio de plan)
}

interface CategoriaOpciones {
  nombre: string;
  opciones: OpcionCliente[];
}

@Component({
  selector: 'app-opciones-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './opciones-cliente.component.html',
  styleUrl: './opciones-cliente.component.scss',
})
export class OpcionesClienteComponent implements OnInit {
  public titulo = 'Opciones del cliente';
  public idCliente = '';

  // Registro del plan activo del cliente (necesario para el cambio de plan)
  public registro: any = null;
  public nombreCliente = '';
  public planActual = '';

  // Los planes solo se necesitan para el modal de cambio de plan; se cargan bajo demanda.
  public planes = [] as any[];
  public isMobile = false;

  // Registro recibido desde el listado por router state (evita re-consultar)
  private registroDesdeState: any = null;

  // Catálogo completo de opciones, agrupado por categoría.
  private opciones: OpcionCliente[] = [
    { id: 'vista_360', label: 'Vista 360', icono: 'fas fa-id-card', categoria: 'Información', permiso: 'clientes.vista_360', ruta: '/clientes/vista/' },
    { id: 'registro_representantes', label: 'Representantes', icono: 'fas fa-user-group', categoria: 'Información', permiso: 'clientes.representantes', ruta: '/clientes/representantes/' },
    { id: 'registro_medidas', label: 'Medidas', icono: 'fas fa-ruler', categoria: 'Información', permiso: 'clientes.medidas', ruta: '/clientes/medidas/' },
    { id: 'observaciones', label: 'Observaciones', icono: 'fas fa-comment-dots', categoria: 'Información', permiso: 'clientes.observaciones', ruta: '/clientes/observaciones/' },
    { id: 'pagos', label: 'Pagos', icono: 'fas fa-money-bills', categoria: 'Servicios y cobros', permiso: 'clientes.pagos', ruta: '/clientes/pagos/' },
    { id: 'productos_servicios', label: 'Productos', icono: 'fas fa-box-open', categoria: 'Servicios y cobros', permiso: 'clientes.productos_servicios', ruta: '/clientes/productos-servicios/' },
    { id: 'contratos', label: 'Contratos', icono: 'fas fa-file-pen', categoria: 'Servicios y cobros', permiso: 'clientes.contratos', ruta: '/clientes/contratos/' },
    { id: 'cursos_extra', label: 'Cursos Extra', icono: 'fas fa-book-medical', categoria: 'Servicios y cobros', permiso: null, ruta: '/clientes/cursos-extra/' },
    { id: 'onces', label: 'Onces', icono: 'fas fa-apple-whole', categoria: 'Servicios y cobros', permiso: 'clientes.onces', ruta: '/clientes/onces/' },
    { id: 'editar', label: 'Editar', icono: 'fas fa-pen', categoria: 'Gestión', permiso: 'clientes.administrar', ruta: 'clientes/editar/' },
    { id: 'cambiar_plan', label: 'Cambio Plan', icono: 'fas fa-user-pen', categoria: 'Gestión', permiso: 'clientes.cambio_plan', ruta: null },
  ];

  // Orden de presentación de las categorías
  private ordenCategorias = ['Información', 'Servicios y cobros', 'Gestión'];

  public categorias: CategoriaOpciones[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private planesService: PlanesService,
    private institucionConfigService: InstitucionConfigService,
    private permisosService: PermisosService
  ) {
    // El registro enviado por el listado viaja en el state de la navegación.
    // Debe leerse con getCurrentNavigation() en el constructor; history.state
    // aún no está disponible en este punto.
    const nav = this.router.getCurrentNavigation();
    const estado: any = nav?.extras?.state;
    this.registroDesdeState = estado && estado.registro ? estado.registro : null;
  }

  ngOnInit(): void {
    this.checkDevice();
    this.configurarOpciones();
    this.route.params.subscribe((params) => {
      this.idCliente = params['id'];
      this.cargarRegistro();
    });
  }

  checkDevice() {
    this.isMobile = window.innerWidth <= 768;
  }

  configurarOpciones(): void {
    this.categorias = this.ordenCategorias
      .map((nombre) => ({
        nombre,
        opciones: this.opciones.filter(
          (o) =>
            o.categoria === nombre &&
            (o.permiso === null || this.permisosService.tienePermiso(o.permiso))
        ),
      }))
      .filter((c) => c.opciones.length > 0);
  }

  // Si el listado envió el registro por state, se usa directamente (sin consulta).
  // En refresh directo (state vacío) se consulta como fallback.
  cargarRegistro() {
    if (this.registroDesdeState) {
      this.registro = this.registroDesdeState;
      this.aplicarContexto(this.registro);
      return;
    }

    this.clientesService.obtenerPlanByCliente(this.idCliente).subscribe({
      next: (response: any) => {
        const body = response.body as any[];
        this.registro = body && body.length > 0 ? body[0] : null;
        if (this.registro) {
          this.aplicarContexto(this.registro);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar el plan del cliente:', error);
        this.registro = null;
      },
    });
  }

  private aplicarContexto(registro: any) {
    this.nombreCliente =
      registro.nombre_completo ||
      `${registro.primer_nombre || ''} ${registro.segundo_nombre || ''} ${registro.primer_apellido || ''} ${registro.segundo_apellido || ''}`
        .replace(/\s+/g, ' ')
        .trim();
    this.planActual = registro.nombre_plan || 'Sin plan';
    // El nombre se muestra en el encabezado (como en crear-cliente).
    if (this.nombreCliente) {
      this.titulo = this.nombreCliente;
    }
  }

  // Carga los planes solo si aún no se tienen (se usa al abrir el cambio de plan).
  private asegurarPlanes(): Promise<void> {
    return new Promise((resolve) => {
      if (this.planes.length > 0) {
        resolve();
        return;
      }
      this.planesService.obtenerTodos().subscribe({
        next: (response: any) => {
          this.planes = response.body as any[];
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  ejecutar(opcion: OpcionCliente) {
    if (opcion.ruta) {
      this.router.navigate([opcion.ruta + this.idCliente]);
      return;
    }

    if (opcion.id === 'cambiar_plan') {
      this.cambiarPlan();
    }
  }

  async cambiarPlan() {
    if (!this.registro) {
      Swal.fire('Sin plan activo', 'El cliente no tiene un plan activo para cambiar.', 'info');
      return;
    }

    await this.asegurarPlanes();

    const idClientePlan = this.registro.id;
    const idCliente = this.registro.id_cliente;

    let opcionesPlanHtml = '<option value="">Seleccionar</option>';
    this.planes.forEach((g: any) => {
      opcionesPlanHtml += `<option value="${g.id}">${g.nombre}</option>`;
    });

    const swalConfig: any = {
      title: 'Cambiar plan',
      html: `
        <div style="text-align: center; margin-bottom: 16px; padding: 10px 0; border-bottom: 1px solid #eee;">
          <div style="font-size: 1.05rem; font-weight: 600; color: #333;">${this.nombreCliente}</div>
          <div style="font-size: 0.85rem; color: #888; margin-top: 4px;">${this.planActual}</div>
        </div>
        <div style="text-align: left; overflow: hidden;">
          <label style="font-weight: 600; margin-bottom: 4px; display: block; font-size: 0.9rem;">Nuevo plan</label>
          <select id="swal-plan" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 14px; font-size: 0.95rem; display: block;">
            ${opcionesPlanHtml}
          </select>
        </div>
      `,
      width: 420,
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d4af37',
      preConfirm: () => {
        const plan = (document.getElementById('swal-plan') as HTMLSelectElement).value;

        if (!plan) {
          Swal.showValidationMessage('Seleccione un plan');
          return false;
        }
        return { plan };
      }
    };

    if (this.isMobile) {
      swalConfig.customClass = {
        popup: 'swal-mobile',
        title: 'swal-mobile-title',
      };
    }

    const result = await Swal.fire(swalConfig);

    if (!result.isConfirmed || !result.value) {
      return;
    }

    const { plan } = result.value;

    this.clientesService
      .inactivarClientePlan(idClientePlan)
      .subscribe((response: any) => {
        console.log('inactivarClientePlan', response);
        this.clientesService
          .activarClientePlan(idCliente, plan, this.institucionConfigService.getAnioAcademicoActual())
          .subscribe((response2: any) => {
            console.log('activarClientePlan', response2);
            Swal.fire({
              title: 'Se ha cambiado el plan.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            });
            // Tras el cambio el registro previo cambió; se refresca desde backend.
            this.registroDesdeState = null;
            this.cargarRegistro();
          });
      });
  }
}