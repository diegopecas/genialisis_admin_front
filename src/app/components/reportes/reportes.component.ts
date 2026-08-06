import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { Router } from '@angular/router';
import { PermisosService } from '../../services/permisos.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
})
export class ReportesComponent {
  titulo = 'Centro de Reportes';
  menuActivo: string | null = null;

  constructor(
    public permisosService: PermisosService,
    private router: Router) {}

  toggleMenu(menu: string, event: Event) {
    event.stopPropagation();
    this.menuActivo = this.menuActivo === menu ? null : menu;
  }

  seleccionarOpcion(opcion: string, event: Event) {
    event.stopPropagation();
    switch (opcion) {
      // Clientes
      case 'clientes-general':
        this.router.navigate(['/reportes/clientes-general']);
        break;
      // Financiero
      case 'cartera':
        this.router.navigate(['/reportes/cartera']);
        break;
      case 'pagos-recibidos':
        this.router.navigate(['/reportes/pagos-recibidos']);
        break;
      case 'cobros-realizados':
        this.router.navigate(['/reportes/cobros-realizados']);
        break;
      case 'movimientos-financieros':
        this.router.navigate(['/reportes/movimientos-financieros']);
        break;
      // Colaboradores
      case 'reporte-contabilizaciones':
        this.router.navigate(['/reportes/reporte-contabilizaciones']);
        break;
      case 'historial-actividades':
        this.router.navigate(['/reportes/historial-actividades']);
        break;
      // Administración
      case 'dashboard-gerencial':
        this.router.navigate(['/reportes/dashboard-gerencial']);
        break;
      case 'reportes-pago':
        this.router.navigate(['/reportes/reportes-pago']);
        break;
    }
  }

  tieneAlguno(codigos: string[]): boolean {
    return codigos.some(c => this.permisosService.tienePermiso(c));
  }
}
