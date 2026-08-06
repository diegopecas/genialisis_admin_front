import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponentAnidado } from '../../../common/header-anidado/header-anidado.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import { ClientesService } from '../../../services/clientes.service';
import { RepresentantesService } from '../../../services/representantes.service';
import { TiposRepresentanteService } from '../../../services/tipos-representante.service';
import { PermisosService } from '../../../services/permisos.service';

@Component({
  selector: 'app-representantes',
  standalone: true,
  imports: [CommonModule, TablasComponent, HeaderComponentAnidado],
  templateUrl: './representantes.component.html',
  styleUrl: './representantes.component.scss'
})
export class RepresentantesComponent {
  public titulo = "Módulo de representantes";
  public idCliente = "0";
  public accion = "";
  public path = "/clientes/representantes/crear/0/"
  public cliente: any;
  public nombre_cliente = "";
  public titulos = [] as any[];
  public datos = [] as any[];
  public columnasFiltro = ['Nombre Representante', 'Tipo Representante', 'Responsable Pago', 'Autorizado Recoger', 'Acceso Sistema'];
  public tiposRepresentante = [] as any[];

  // Variables de permisos
  public puedeAdministrar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientesService: ClientesService,
    private representantesService: RepresentantesService,
    private tiposRepresentanteService: TiposRepresentanteService,
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

    this.obtenerTiposRepresentante();
    this.crearTitulos();
  }

  configurarPermisos(): void {
    this.puedeAdministrar = this.permisosService.tienePermiso('clientes.representantes.administrar');
  }

  obtenerTodos(id_cliente: any): void {
    this.representantesService.obtenerPorCliente(id_cliente).subscribe((response: any) => {
      const body = response.body as any[];
      console.log("consumo servicio obtenerPorCliente", body);
      
      // Enriquecer los datos con información de tipo de representante
      this.enriquecerDatos(body);
    });
  }

  enriquecerDatos(representantes: any[]): void {
    // Esta función agrega información adicional a los datos de representantes
    // como convertir los valores booleanos a textos más descriptivos
    
    representantes.forEach(representante => {
      // Convertir booleano a texto
      representante.responsable_pago_texto = representante.es_responsable_pago ? 'Sí' : 'No';
      representante.autorizado_recoger_texto = representante.autorizado_recoger ? 'Sí' : 'No';
      representante.autorizado_sistema_texto = representante.autorizado_sistema ? 'Sí' : 'No';
      representante.activo_texto = representante.activo ? 'Activo' : 'Inactivo';
      
      // Buscar y asignar el nombre del tipo de representante
      const tipoRepresentante = this.tiposRepresentante.find(tipo => tipo.id === representante.id_tipo_representante);
      if (tipoRepresentante) {
        representante.nombre_tipo_representante = tipoRepresentante.nombre;
      } else {
        representante.nombre_tipo_representante = 'Desconocido';
      }
    });
    
    this.datos = representantes;
  }

  obtenerTiposRepresentante(): void {
    this.tiposRepresentanteService.obtenerTodos().subscribe((response: any) => {
      const body = response.body as any[];
      console.log("consumo servicio obtenerTodos tipos representante", body);
      this.tiposRepresentante = body;
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
        clave: 'nombre_persona',
        alias: 'Nombre Representante',
        alinear: 'izquierda',
      },
      {
        clave: 'nombre_tipo_representante',
        alias: 'Tipo Representante',
        alinear: 'izquierda',
      },
      {
        clave: 'responsable_pago_texto',
        alias: 'Responsable Pago',
        alinear: 'centrado',
      },
      {
        clave: 'autorizado_recoger_texto',
        alias: 'Autorizado Recoger',
        alinear: 'centrado',
      },
      {
        clave: 'autorizado_sistema_texto',
        alias: 'Acceso Sistema',
        alinear: 'centrado',
      },
      {
        clave: 'activo_texto',
        alias: 'Estado',
        alinear: 'centrado',
      }
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
      this.titulo = this.titulo + " para " + this.nombre_cliente;
    });
  }

  seleccionar(event: any) {
    if (event.accion === 'editar') {
      this.router.navigate(['clientes/representantes/editar/' + event.id + '/' + this.idCliente]);
    }
    if (event.accion === 'eliminar') {
      this.eliminar(event.id, event.registro);
    }
    if (event.accion === 'consultar') {
      this.router.navigate(['clientes/representantes/consultar/' + event.id + '/' + this.idCliente]);
    }
  }

  eliminar(id: any, registro: any) {
    // Mostrar ventana de confirmación antes de proceder con la eliminación
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el representante "${registro.nombre_persona}" de tipo ${registro.nombre_tipo_representante}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      // Si el usuario confirma la eliminación
      if (result.isConfirmed) {
        const body = { id: id };
        this.representantesService.eliminar(body).subscribe((response: any) => {
          if (response) {
            Swal.fire({
              title: 'Representante eliminado con éxito',
              icon: "info",
              showCancelButton: false,
              focusConfirm: true,
              confirmButtonText: "Aceptar"
            }).then(() => {
              this.obtenerTodos(this.idCliente);
            });
          } else {
            Swal.fire({
              title: 'Error al eliminar el representante',
              icon: "error",
              showCancelButton: false,
              focusConfirm: true,
              confirmButtonText: "Aceptar"
            });
            console.log("Error al eliminar representante.");
          }
        });
      } else {
        // Si el usuario cancela la eliminación
        Swal.fire({
          title: 'Operación cancelada',
          icon: 'info',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}