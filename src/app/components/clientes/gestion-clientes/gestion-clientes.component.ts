import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../common/header/header.component';
import { PermisosService } from '../../../services/permisos.service';

@Component({
  selector: 'app-gestion-clientes',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './gestion-clientes.component.html',
  styleUrl: './gestion-clientes.component.scss'
})
export class GestionClientesComponent {
  titulo = "Gestión de Clientes";
  menuActivo: string | null = null;

  constructor(
    public permisosService: PermisosService,
    private router: Router) { }

  toggleMenu(menu: string, event: Event) {
    event.stopPropagation();
    this.menuActivo = this.menuActivo === menu ? null : menu;
  }

  seleccionarOpcion(opcion: string, event: Event) {
    event.stopPropagation();
    // NOTA: ajusta estas rutas a las reales del módulo de clientes si difieren.
    switch (opcion) {
      case 'clientes':
        this.router.navigate(['/clientes']);
        break;
      case 'registro-rapido-cliente':
        this.router.navigate(['/clientes/registro-rapido']);
        break;
    }
  }

  tieneAlguno(codigos: string[]): boolean {
    return codigos.some(c => this.permisosService.tienePermiso(c));
  }
}
