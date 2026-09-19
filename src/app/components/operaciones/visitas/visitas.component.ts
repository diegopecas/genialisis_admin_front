import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../common/header/header.component';
import { TablasComponent } from '../../../common/tablas/tablas.component';
import { VisitasService } from '../../../services/visitas.service';
import { InstitucionConfigService } from '../../../services/institucion-config.service';

@Component({
  selector: 'app-visitas',
  templateUrl: './visitas.component.html',
  styleUrl: './visitas.component.scss',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TablasComponent],
})
export class VisitasComponent implements OnInit {
  titulo = 'Visitas a Clientes';

  public columnasFiltro = ['Cliente', 'Visita', 'Fecha'];
  public titulos = [] as any[];
  public datos = [] as any[];
  public acciones = [
    { id: 'enlace', label: 'Copiar enlace', icono: '/assets/images/enlace.png' },
    { id: 'resultados', label: 'Resultados', icono: '/assets/images/resultados-visita.png' },
  ];

  constructor(
    private visitasService: VisitasService,
    private institucionConfigService: InstitucionConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.crearTitulos();
    this.obtenerVisitas();
  }

  obtenerVisitas() {
    this.visitasService.obtenerTodos().subscribe({
      next: (response: any) => {
        const body = response.body as any[];
        this.datos = (body || []).map((visita: any) => ({
          ...visita,
          estado: visita.activo ? 'Activa' : 'Cerrada',
        }));
      },
      error: () => {
        this.datos = [];
      },
    });
  }

  crearTitulos() {
    this.titulos = [
      { clave: 'nombre_cliente', alias: 'Cliente', alinear: 'izquierda' },
      { clave: 'nombre', alias: 'Visita', alinear: 'izquierda' },
      { clave: 'fecha', alias: 'Fecha', alinear: 'centrado' },
      { clave: 'fecha_vencimiento', alias: 'Vence', alinear: 'centrado' },
      { clave: 'total_participantes', alias: 'Participantes', alinear: 'centrado' },
      { clave: 'estado', alias: 'Estado', alinear: 'centrado' },
    ];
  }

  clicAccion($event: any) {
    switch ($event.accion) {
      case 'editar':
        this.router.navigate(['/operaciones/visitas/editar/' + $event.registro.id]);
        break;
      case 'resultados':
        this.router.navigate(['/operaciones/visitas/resultados/' + $event.registro.id]);
        break;
      case 'enlace':
        this.copiarEnlace($event.registro);
        break;
      case 'eliminar':
        this.eliminarVisita($event.registro);
        break;
    }
  }

  /**
   * Arma el enlace público de la visita. El tenant viaja en la URL porque
   * quien la abre no tiene sesión: es lo único que le permite al front saber
   * a qué institución pedirle los datos.
   */
  armarEnlace(visita: any): string {
    const tenant = this.institucionConfigService.getTenantHeader();
    return `${window.location.origin}/#/taller/${tenant}/${visita.token}`;
  }

  async copiarEnlace(visita: any) {
    const enlace = this.armarEnlace(visita);

    try {
      await navigator.clipboard.writeText(enlace);
      Swal.fire({
        icon: 'success',
        title: 'Enlace copiado',
        text: enlace,
        confirmButtonText: 'Listo',
      });
    } catch {
      // El portapapeles falla en http o si el navegador no da permiso:
      // ahí se muestra el enlace para copiarlo a mano.
      Swal.fire({
        icon: 'info',
        title: 'Enlace de la visita',
        text: enlace,
        confirmButtonText: 'Cerrar',
      });
    }
  }

  async eliminarVisita(visita: any) {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `Se elimina la visita ${visita.nombre} y todo lo que ya respondieron.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      this.visitasService.eliminar(visita.id).subscribe({
        next: () => {
          Swal.fire('Eliminada', 'La visita ha sido eliminada.', 'success');
          this.obtenerVisitas();
        },
        error: (error: any) => {
          console.error('Error al eliminar la visita', error);
          Swal.fire('Error', 'No se pudo eliminar la visita.', 'error');
        },
      });
    }
  }
}
