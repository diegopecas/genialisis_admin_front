import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import { PlanesService } from '../../../services/planes.service';

@Component({
  selector: 'app-listar-planes',
  templateUrl: './listar-planes.component.html',
  styleUrl: './listar-planes.component.scss',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TablasComponent]
})
export class ListarPlanesComponent implements OnInit {

  titulo = 'Planes';
  public columnasFiltro = ['Nombre'];
  public titulos = [] as any[];
  public datos = [] as any[];
  public acciones = [] as any[];

  private readonly raiz = '/administracion/datos-maestros/planes';

  constructor(
    private planesService: PlanesService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.crearTitulos();
    this.obtenerPlanes();
  }

  obtenerPlanes() {
    this.planesService.obtenerTodos().subscribe((response: any) => {
      this.datos = (response.body as any[]) || [];
    });
  }

  crearTitulos() {
    this.titulos = [
      { clave: 'orden', alias: 'Orden', alinear: 'centrado' },
      { clave: 'nombre', alias: 'Nombre', alinear: 'izquierda' },
      { clave: 'color', alias: 'Color', alinear: 'centrado' },
    ];
  }

  clicAccion($event: any) {
    switch ($event.accion) {
      case 'editar':
        this.router.navigate([this.raiz + '/editar/' + $event.registro.id]);
        break;
      case 'eliminar':
        this.eliminarPlan($event.registro);
        break;
    }
  }

  async eliminarPlan(plan: any) {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el plan ${plan.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.planesService.eliminar({ id: plan.id }).subscribe({
      next: () => {
        Swal.fire('Eliminado', 'El plan ha sido eliminado.', 'success');
        this.obtenerPlanes();
      },
      error: (error: any) => {
        console.error('Error al eliminar plan', error);
        // Un plan con clientes, tarifas o contratos no se puede borrar
        Swal.fire('Error', 'No se pudo eliminar el plan. Verifique que no tenga clientes, tarifas ni contratos asociados.', 'error');
      }
    });
  }
}
