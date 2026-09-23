import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { BuscarComponent } from '../../common/buscar/buscar.component';
import { Router } from '@angular/router';
import { PermisosService } from '../../services/permisos.service';
import { GrupoMenuModulo, MenuModulosService, OpcionMenuModulo } from '../../services/menu-modulos.service';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BuscarComponent],
  templateUrl: './operaciones.component.html',
  styleUrl: './operaciones.component.scss'
})
export class OperacionesComponent implements OnInit {
  titulo = "Módulo Operaciones";
  menuActivo: string | null = null;

  // Grupos del menú ya filtrados por permisos (fuente para render y búsqueda)
  grupos: GrupoMenuModulo[] = [];
  // Grupos visibles en pantalla (todos, o el subconjunto que coincide con la búsqueda)
  gruposVisibles: GrupoMenuModulo[] = [];
  enBusqueda = false;

  constructor(
    public permisosService: PermisosService,
    private menuModulosService: MenuModulosService,
    private router: Router) { }

  ngOnInit(): void {
    this.grupos = this.menuModulosService.filtrarPorPermiso(this.menuModulosService.getOperaciones());
    this.gruposVisibles = this.grupos;
  }

  buscar(valor: string | null): void {
    const termino = (valor || '').trim();
    this.enBusqueda = termino.length > 0;
    this.gruposVisibles = this.enBusqueda
      ? this.menuModulosService.filtrarPorTexto(this.grupos, termino)
      : this.grupos;
  }

  trackByGrupo(_indice: number, grupo: GrupoMenuModulo): string {
    return grupo.id;
  }

  trackByOpcion(_indice: number, opcion: OpcionMenuModulo): string {
    return opcion.id;
  }

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
      case 'recordatorio-pagos':
        this.router.navigate(['/operaciones/recordatorio-pagos']);
        break;
      case 'visitas':
        this.router.navigate(['/operaciones/visitas']);
        break;
    }
  }

  tieneAlguno(codigos: string[]): boolean {
    return codigos.some(c => this.permisosService.tienePermiso(c));
  }
}
