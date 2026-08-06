import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../../../common/header/header.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import Swal from 'sweetalert2';
import { ClientesService } from '../../../services/clientes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TablasComponent],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss'
})
export class ServiciosComponent {

  titulo = "Gestión de servicios";

  public titulos = [] as any[];

  public datos = [] as any[];
  public planes = [] as any[];

  public acciones = [
    { id: 'academico', label: 'Académico', icono: 'mdi mdi-school' },
    { id: 'extraacademico', label: 'Extra académico', icono: 'mdi mdi-basketball' },
    { id: 'alimentacion', label: 'Alimentación', icono: 'mdi mdi-food' },
    { id: 'vestuario', label: 'Vestuario', icono: 'mdi mdi-tshirt-crew' },
    { id: 'insumos', label: 'Insumos', icono: 'mdi mdi-package-variant' }
  ] as any[];

  constructor(
    private clientesService: ClientesService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.crearTitulos();
    this.obtenerClientesXPlan();
  }

  obtenerClientesXPlan() {
    this.clientesService.obtenerTodosXPlan(0).subscribe((response: any) => {
      const body = response.body as any[];
      console.log("consumo servicio obtenerClientesXPlan", body);

      this.datos = body;

      this.datos.forEach((e: any) => {
        e.nombre_completo = `${e.primer_nombre} ${e.segundo_nombre} ${e.primer_apellido} ${e.segundo_apellido}`;
        e.color = e.activo === 0 ? "#e2e9f3" : "";
        e.estado = e.activo === 0 ? "Inactivo" : "Activo";
        e.alimentacion = e.alimentacion === 0 ? "No" : "Sí";
      });
    });
  }



  eliminar(valor: any) {
    console.log("SE VA A ELMINAR EL REGISTRO " + valor);
  }

  crearTitulos() {
    this.titulos = [

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
        clave: 'alimentacion',
        alias: 'Alimentación',
        alinear: 'centrado',
      },
      {
        clave: 'estado',
        alias: 'Estado',
        alinear: 'centrado',
      }

    ];
  }

  buscar(event: any) {
    console.log("buscar", event);
  }

  clicAccion($event: any) {
    console.log("Acción", $event);
    switch ($event.accion) {
      case 'academico':
        this.router.navigate(['/clientes/servicios/1/'+$event.registro.id_cliente]);
        break;
      case 'extraacademico':
        this.router.navigate(['/clientes/servicios/2/'+$event.registro.id_cliente]);
        break;
      case 'alimentacion':
        this.router.navigate(['/clientes/servicios/3/'+$event.registro.id_cliente]);
        break;
      case 'vestuario':
        this.router.navigate(['/clientes/servicios/4/'+$event.registro.id_cliente]);
        break;
      case 'insumos':
        this.router.navigate(['/clientes/servicios/5/'+$event.registro.id_cliente]);
        break;
    }
  }

 
}
