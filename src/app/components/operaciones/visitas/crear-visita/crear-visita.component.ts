import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../../common/header/header.component';
import { VisitasService } from '../../../../services/visitas.service';
import { ColaboradoresService } from '../../../../services/colaboradores.service';
import { InstitucionConfigService } from '../../../../services/institucion-config.service';

@Component({
  selector: 'app-crear-visita',
  templateUrl: './crear-visita.component.html',
  styleUrl: './crear-visita.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
})
export class CrearVisitaComponent implements OnInit {
  titulo = 'Visita a Cliente';
  accion = '';
  public id = '0';

  public nuevo = false;
  public editable = true;
  public submitted = false;

  public listas = {
    clientes: [] as any[],
    colaboradores: [] as any[],
  };

  public model: any = {
    id: null,
    id_cliente: '',
    nombre: '',
    fecha: '',
    fecha_vencimiento: '',
    observaciones: '',
    activo: 1,
  };

  // Ids de colaboradores marcados. Son los que después arman el bloque
  // "uno por uno" del cuestionario de calificación.
  public colaboradoresSeleccionados: string[] = [];

  public enlace = '';

  constructor(
    private visitasService: VisitasService,
    private colaboradoresService: ColaboradoresService,
    private institucionConfigService: InstitucionConfigService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.accion = params['accion'];
      this.id = params['id'] || '0';

      switch (this.accion) {
        case 'crear':
          this.nuevo = true;
          this.editable = true;
          this.model.fecha = this.fechaDeHoy();
          this.consultarListas();
          break;
        case 'editar':
          this.nuevo = false;
          this.editable = true;
          this.consultarListas();
          this.consultarVisita();
          break;
        case 'ver':
        case 'consultar':
          this.nuevo = false;
          this.editable = false;
          this.consultarListas();
          this.consultarVisita();
          break;
      }
    });
  }

  fechaDeHoy(): string {
    const hoy = new Date();
    const mes = `${hoy.getMonth() + 1}`.padStart(2, '0');
    const dia = `${hoy.getDate()}`.padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  }

  consultarListas() {
    this.visitasService.obtenerClientes().subscribe({
      next: (response: any) => {
        this.listas.clientes = (response.body as any[]) || [];
      },
      error: () => {
        this.listas.clientes = [];
      },
    });

    this.colaboradoresService.obtenerTodos().subscribe({
      next: (response: any) => {
        const body = (response.body as any[]) || [];
        this.listas.colaboradores = body.filter((c: any) => c.activo);
      },
      error: () => {
        this.listas.colaboradores = [];
      },
    });
  }

  consultarVisita() {
    this.visitasService.obtenerPorId(this.id).subscribe({
      next: (response: any) => {
        const visita = response.body as any;

        this.model = {
          id: visita.id,
          id_cliente: visita.id_cliente,
          nombre: visita.nombre,
          fecha: visita.fecha,
          // El input datetime-local no acepta el espacio que manda MySQL.
          fecha_vencimiento: visita.fecha_vencimiento
            ? visita.fecha_vencimiento.replace(' ', 'T').substring(0, 16)
            : '',
          observaciones: visita.observaciones,
          activo: visita.activo,
        };

        this.colaboradoresSeleccionados = (visita.colaboradores || []).map(
          (c: any) => c.id_colaborador
        );

        this.enlace = this.armarEnlace(visita.token);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la visita.', 'error');
      },
    });
  }

  /**
   * El tenant viaja en la URL porque quien abre el enlace no tiene sesión:
   * es lo único que le permite al front saber a qué institución consultar.
   */
  armarEnlace(token: string): string {
    if (!token) {
      return '';
    }
    const tenant = this.institucionConfigService.getTenantHeader();
    return `${window.location.origin}/#/taller/${tenant}/${token}`;
  }

  estaSeleccionado(idColaborador: string): boolean {
    return this.colaboradoresSeleccionados.indexOf(idColaborador) >= 0;
  }

  alternarColaborador(idColaborador: string) {
    if (!this.editable) {
      return;
    }
    const indice = this.colaboradoresSeleccionados.indexOf(idColaborador);
    if (indice >= 0) {
      this.colaboradoresSeleccionados.splice(indice, 1);
    } else {
      this.colaboradoresSeleccionados.push(idColaborador);
    }
  }

  async copiarEnlace() {
    if (!this.enlace) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.enlace);
      Swal.fire({ icon: 'success', title: 'Enlace copiado', timer: 1500, showConfirmButton: false });
    } catch {
      // El portapapeles falla en http o sin permiso del navegador.
      Swal.fire({ icon: 'info', title: 'Enlace de la visita', text: this.enlace });
    }
  }

  guardar() {
    this.submitted = true;

    if (!this.model.id_cliente || !this.model.nombre || !this.model.fecha) {
      Swal.fire('Faltan datos', 'Cliente, nombre y fecha son obligatorios.', 'warning');
      return;
    }

    const data = {
      ...this.model,
      colaboradores: this.colaboradoresSeleccionados,
    };

    if (this.nuevo) {
      this.visitasService.crear(data).subscribe({
        next: (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Visita creada',
            text: 'Ya puedes copiar el enlace para compartirlo con el jardín.',
          });
          this.router.navigate(['/operaciones/visitas/editar/' + response.id]);
        },
        error: (error: any) => {
          console.error('Error al crear la visita', error);
          Swal.fire('Error', 'No se pudo crear la visita.', 'error');
        },
      });
    } else {
      this.visitasService.actualizar(data).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Visita actualizada',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (error: any) => {
          console.error('Error al actualizar la visita', error);
          Swal.fire('Error', 'No se pudo actualizar la visita.', 'error');
        },
      });
    }
  }

  volver() {
    this.router.navigate(['/operaciones/visitas']);
  }

  verResultados() {
    this.router.navigate(['/operaciones/visitas/resultados/' + this.model.id]);
  }
}
