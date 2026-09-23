import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../../common/header/header.component';
import { PlanesService } from '../../../../services/planes.service';
import { PlanTarifasComponent } from '../plan-tarifas/plan-tarifas.component';

@Component({
  selector: 'app-crear-plan',
  templateUrl: './crear-plan.component.html',
  styleUrl: './crear-plan.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, PlanTarifasComponent]
})
export class CrearPlanComponent implements OnInit {

  @ViewChild(PlanTarifasComponent) planTarifas?: PlanTarifasComponent;

  titulo = 'Crear plan';
  accion = 'crear';
  regresar = '/administracion/datos-maestros/planes';
  editable = true;
  submitted = false;
  guardando = false;

  // Secciones del formulario; Tarifas solo existe cuando el plan ya está guardado
  pestanaActiva: 'datos' | 'tarifas' = 'datos';

  model = {
    id: null as any,
    nombre: '',
    icono: null as any,
    color: '#C9A227',
    orden: 1 as any,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planesService: PlanesService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const accion = params.get('accion');
      const id = params.get('id');

      this.accion = accion || 'crear';
      this.editable = this.accion !== 'consultar';

      if (this.accion === 'crear') {
        this.titulo = 'Crear plan';
        this.sugerirOrden();
      } else if (id) {
        this.titulo = this.accion === 'editar' ? 'Editar plan' : 'Consultar plan';
        this.cargarPlan(id);
      }
    });
  }

  /** Al crear, el orden sugerido es el siguiente al último plan */
  sugerirOrden() {
    this.planesService.obtenerTodos().subscribe((response: any) => {
      const planes = (response.body as any[]) || [];
      const mayor = planes.reduce((max, p) => Math.max(max, parseInt(p.orden) || 0), 0);
      this.model.orden = mayor + 1;
    });
  }

  cargarPlan(id: string) {
    this.planesService.obtenerById(id).subscribe({
      next: (response: any) => {
        const plan = (response.body as any[])?.[0];
        if (!plan) {
          Swal.fire('Error', 'No se encontró el plan', 'error');
          this.volver();
          return;
        }
        this.model = {
          id: plan.id,
          nombre: plan.nombre || '',
          icono: plan.icono || null,
          color: plan.color || '#C9A227',
          orden: plan.orden || 1,
        };
        this.titulo = `${this.accion === 'editar' ? 'Editar' : 'Consultar'} plan: ${plan.nombre}`;
      },
      error: (error: any) => {
        console.error('Error al cargar el plan', error);
        Swal.fire('Error', 'No se pudo cargar el plan', 'error');
      }
    });
  }

  cambiarPestana(pestana: 'datos' | 'tarifas') {
    this.pestanaActiva = pestana;
  }

  guardar() {
    this.submitted = true;

    if (!this.model.nombre || !this.model.nombre.trim()) {
      Swal.fire('Campos requeridos', 'El nombre del plan es obligatorio', 'warning');
      return;
    }

    const payload = {
      id: this.model.id,
      nombre: this.model.nombre.trim(),
      icono: this.model.icono,
      color: this.model.color,
      orden: parseInt(this.model.orden) || 1,
    };

    this.guardando = true;

    if (this.accion === 'crear') {
      this.planesService.crear(payload).subscribe({
        next: (response: any) => {
          this.guardando = false;
          // Se pasa a edición para que pueda configurar las tarifas del plan
          Swal.fire('Éxito', 'Plan creado. Ahora puede configurar sus tarifas.', 'success');
          this.router.navigate([this.regresar + '/editar/' + response.id]);
          this.pestanaActiva = 'tarifas';
        },
        error: (error: any) => {
          this.guardando = false;
          console.error('Error al crear el plan', error);
          Swal.fire('Error', 'No se pudo crear el plan', 'error');
        }
      });
    } else {
      this.planesService.actualizar(payload).subscribe({
        next: () => {
          this.guardando = false;
          // Las tarifas se guardan en lote con el mismo botón Grabar
          this.planTarifas?.guardarTarifas();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Plan actualizado',
            showConfirmButton: false,
            timer: 2000
          });
        },
        error: (error: any) => {
          this.guardando = false;
          console.error('Error al actualizar el plan', error);
          Swal.fire('Error', 'No se pudo actualizar el plan', 'error');
        }
      });
    }
  }

  volver() {
    this.router.navigate([this.regresar]);
  }
}
