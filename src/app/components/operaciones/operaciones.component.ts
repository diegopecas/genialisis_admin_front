import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { Router } from '@angular/router';
import { PermisosService } from '../../services/permisos.service';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './operaciones.component.html',
  styleUrl: './operaciones.component.scss'
})
export class OperacionesComponent {
  titulo = "Módulo Operaciones";
  menuActivo: string | null = null;

  constructor(
    public permisosService: PermisosService,
    private router: Router) { }

  toggleMenu(menu: string, event: Event) {
    event.stopPropagation();
    this.menuActivo = this.menuActivo === menu ? null : menu;
  }

  seleccionarOpcion(opcion: string) {
    switch (opcion) {
      case 'movimientos-inventario':
        this.router.navigate(['/operaciones/movimientos-productos']);
        break;
      case 'registros-limpieza':
        this.router.navigate(['/operaciones/registros-limpieza']);
        break;
      case 'registro-rapido-limpieza':
        this.router.navigate(['/operaciones/registro-rapido-limpieza']);
        break;
      case 'registro-masivo-limpieza':
        this.router.navigate(['/operaciones/registro-masivo-limpieza']);
        break;
      case 'edicion-masiva-limpieza':
        this.router.navigate(['/operaciones/edicion-masiva-limpieza']);
        break;
      case 'supervision-limpieza':
        this.router.navigate(['/operaciones/supervision-limpieza']);
        break;
      case 'reporte-aseo':
        this.router.navigate(['/operaciones/reporte-aseo']);
        break;
      case 'recordatorios-generales':
        this.router.navigate(['/operaciones/recordatorios-generales']);
        break;
      default:
        console.log('Opción no reconocida:', opcion);
        break;
    }
  }

  tieneAlguno(codigos: string[]): boolean {
    return codigos.some(c => this.permisosService.tienePermiso(c));
  }
}
