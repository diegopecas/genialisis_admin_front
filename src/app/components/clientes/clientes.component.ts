import { Component, HostListener, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../common/header/header.component';
import { TablasComponent } from '../../common/tablas/tablas.component';
import { PlanesService } from '../../services/planes.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermisosService } from '../../services/permisos.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    TablasComponent,
    RouterModule,
    FormsModule,
  ],
})
export class ClientesComponent implements OnInit {
  titulo = 'Gestión de clientes';
  public titulos = [] as any[];

  public datos = [] as any[];
  public planes = [] as any[];

  // Filtros que se envían al backend
  public filtroPlan = '';
  public filtroEstado = '';
  public filtroPermanente = '';
  public filtroNombre = '';

  // Estado de la búsqueda
  public busquedaRealizada = false;
  public cargando = false;

  // Variables para móvil
  public isMobile = false;

  // Única acción personalizada: abre el hub de opciones del cliente.
  public acciones = [
    { id: 'opciones', label: 'Opciones', icono: 'fas fa-ellipsis' },
  ];

  // Variables de permisos
  public puedeAdministrar = false;

  constructor(
    private clientesService: ClientesService,
    private planesService: PlanesService,
    private router: Router,
    private permisosService: PermisosService
  ) {}

  ngOnInit(): void {
    this.checkDevice();
    this.configurarPermisos();
    this.crearTitulos();
    this.obtenerPlanes();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkDevice();
  }

  checkDevice() {
    this.isMobile = window.innerWidth <= 768;
  }

  configurarPermisos(): void {
    this.puedeAdministrar = this.permisosService.tienePermiso('clientes.administrar');
  }

  obtenerPlanes() {
    this.planesService.obtenerTodos().subscribe((response: any) => {
      const body = response.body as any[];
      this.planes = body;
    });
  }

  crearTitulos() {
    this.titulos = [
      {
        clave: 'id',
        alias: 'id',
        alinear: 'centrado',
      },
      {
        clave: 'nombre_plan',
        alias: 'Plan',
        alinear: 'izquierda',
      },
      {
        clave: 'nombre_completo',
        alias: 'Nombre completo',
        alinear: 'izquierda',
      },
      {
        clave: 'estado',
        alias: 'Estado',
        alinear: 'centrado',
      },
      {
        clave: 'permanente_texto',
        alias: 'Permanente',
        alinear: 'centrado',
      },
    ];
  }

  // Lanza la consulta al backend con los filtros actuales. Sin filtros => trae todos.
  buscar() {
    this.cargando = true;

    const filtros = {
      id_plan: this.filtroPlan,
      estado: this.filtroEstado,
      permanente: this.filtroPermanente,
      nombre: (this.filtroNombre || '').trim(),
    };

    this.clientesService.obtenerPorFiltros(filtros).subscribe({
      next: (response: any) => {
        const body = response.body as any[];
        this.mapearDatos(body);
        this.busquedaRealizada = true;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al obtener clientes:', error);
        this.datos = [];
        this.busquedaRealizada = true;
        this.cargando = false;
      },
    });
  }

  limpiar() {
    this.filtroPlan = '';
    this.filtroEstado = '';
    this.filtroPermanente = '';
    this.filtroNombre = '';
    this.datos = [];
    this.busquedaRealizada = false;
  }

  private mapearDatos(body: any[]) {
    this.datos = body || [];
    this.datos.forEach((e: any) => {
      e.nombre_completo = `${e.primer_nombre} ${e.segundo_nombre} ${e.primer_apellido} ${e.segundo_apellido}`;
      e.color = e.activo === 0 ? '#e2e9f3' : '';
      e.estado = e.activo === 0 ? 'Inactivo' : 'Activo';
      e.alimentacion = e.alimentacion === 0 ? 'No' : 'Sí';
      e.permanente_texto = e.permanente == 1 ? 'Sí' : 'No';
    });
  }

  clicAccion($event: any) {
    switch ($event.accion) {
      case 'editar':
        this.router.navigate(['clientes/editar/' + $event.registro.id_cliente]);
        break;
      case 'opciones':
        this.irAOpciones($event.registro);
        break;
    }
  }

  editarMovil(event: Event, cliente: any) {
    event.stopPropagation();
    this.router.navigate(['clientes/editar/' + cliente.id_cliente]);
  }

  opcionesMovil(event: Event, cliente: any) {
    event.stopPropagation();
    this.irAOpciones(cliente);
  }

  // Navega al hub pasando el registro completo de la fila para evitar una nueva
  // consulta. En refresh directo el hub usa su propio fallback.
  private irAOpciones(registro: any) {
    this.router.navigate(['/clientes/opciones/' + registro.id_cliente], {
      state: { registro },
    });
  }
}
