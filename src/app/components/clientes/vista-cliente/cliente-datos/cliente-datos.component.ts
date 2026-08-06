import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ClientesService } from '../../../../services/clientes.service';
import { PersonasService } from '../../../../services/personas.service';
import { RepresentantesService } from '../../../../services/representantes.service';
import { TiposIdentificacionService } from '../../../../services/tipos-identificacion.service';
import { GenerosService } from '../../../../services/generos.service';
import { PlanesService } from '../../../../services/planes.service';
import { CiudadesService } from '../../../../services/ciudades.service';
import { FotoPersonaComponent } from '../../../../common/foto-persona/foto-persona.component';

@Component({
  selector: 'app-cliente-datos',
  standalone: true,
  imports: [CommonModule, FormsModule, FotoPersonaComponent],
  templateUrl: './cliente-datos.component.html',
  styleUrl: './cliente-datos.component.scss'
})
export class ClienteDatosComponent implements OnInit {
  @Input() idCliente: string = "0";

  // Variables para almacenar datos
  public cliente: any = null;
  public representantes: any[] = [];
  public tiposIdentificacion: any[] = [];
  public generos: any[] = [];
  public planes: any[] = [];
  public ciudades: any[] = [];
  public planActual: any = null;
  public nombreCompleto = "";

  // Indicadores de carga
  public cargando = {
    datos: false,
    representantes: false
  };

  // Control de expansión de representantes
  public representanteExpandido: boolean[] = [];

  constructor(
    private clientesService: ClientesService,
    private personasService: PersonasService,
    private representantesService: RepresentantesService,
    private tiposIdentificacionService: TiposIdentificacionService,
    private generosService: GenerosService,
    private planesService: PlanesService,
    private ciudadesService: CiudadesService
  ) { }

  ngOnInit(): void {
    if (this.idCliente && this.idCliente !== "0") {
      // Cargar listas para tener los datos de referencia
      this.cargarListas();

      // Cargar los datos del cliente
      this.cargarDatosCliente();
    }
  }

  cargarListas(): void {
    // Cargar tipos de identificación
    this.tiposIdentificacionService.obtenerTodos().subscribe((response: any) => {
      this.tiposIdentificacion = response.body;
    });

    // Cargar géneros
    this.generosService.obtenerTodos().subscribe((response: any) => {
      this.generos = response.body;
    });

    // Cargar planes
    this.planesService.obtenerTodos().subscribe((response: any) => {
      this.planes = response.body;
    });

    // Cargar ciudades
    this.ciudadesService.obtenerTodos().subscribe((response: any) => {
      this.ciudades = response.body;
    });
  }

  cargarDatosCliente(): void {
    this.cargando.datos = true;

    // Obtener datos del cliente
    this.clientesService.obtenerById(this.idCliente).subscribe({
      next: (response: any) => {
        if (response.body && response.body.length > 0) {
          this.cliente = response.body[0];

          // Obtener datos de la persona
          this.cargarDatosPersona(this.cliente.id_persona);

          // Obtener el plan actual del cliente
          this.obtenerPlanCliente();

          // Cargamos los representantes
          this.cargarRepresentantes();
        } else {
          Swal.fire('Error', 'No se encontró el cliente', 'error');
        }
        this.cargando.datos = false;
      },
      error: (error: any) => {
        console.error("Error al obtener cliente", error);
        Swal.fire('Error', 'Error al cargar los datos del cliente', 'error');
        this.cargando.datos = false;
      }
    });
  }

  cargarDatosPersona(idPersona: any): void {
    this.personasService.obtenerById(idPersona).subscribe({
      next: (response: any) => {
        if (response.body && response.body.length > 0) {
          const persona = response.body[0];

          // Fusionar datos de persona con cliente
          this.cliente = { ...this.cliente, ...persona };

          // Crear nombre completo para el título
          this.nombreCompleto = [
            persona.primer_nombre,
            persona.segundo_nombre,
            persona.primer_apellido,
            persona.segundo_apellido
          ].filter(Boolean).join(' ');
        }
      },
      error: (error: any) => {
        console.error("Error al obtener datos de persona", error);
      }
    });
  }

  obtenerPlanCliente(): void {
    this.clientesService.obtenerPlanByCliente(this.idCliente).subscribe({
      next: (response: any) => {
        if (response.body && response.body.length > 0) {
          this.planActual = response.body[0];
        }
      },
      error: (error: any) => {
        console.error("Error al obtener plan del cliente", error);
      }
    });
  }

  cargarRepresentantes(): void {
    this.cargando.representantes = true;

    this.representantesService.obtenerPorCliente(this.idCliente).subscribe({
      next: (response: any) => {
        this.representantes = response.body;

        // Inicializar el array para controlar la expansión
        this.representanteExpandido = this.representantes.map((_, index) => index === 0);

        // Para cada representante, obtener datos completos de la persona
        if (this.representantes && this.representantes.length > 0) {
          this.representantes.forEach((representante, index) => {
            this.cargarDatosRepresentante(representante, index);
          });
        }

        this.cargando.representantes = false;
      },
      error: (error: any) => {
        console.error("Error al obtener representantes", error);
        this.cargando.representantes = false;
      }
    });
  }

  cargarDatosRepresentante(representante: any, index: number): void {
    if (representante && representante.id_persona) {
      this.personasService.obtenerById(representante.id_persona).subscribe({
        next: (response: any) => {
          if (response.body && response.body.length > 0) {
            const persona = response.body[0];
            // Actualizar el representante con los datos de la persona
            this.representantes[index] = {
              ...this.representantes[index],
              persona_data: persona
            };
          }
        },
        error: (error: any) => {
          console.error(`Error al obtener datos de persona para representante ${representante.id}`, error);
        }
      });
    }
  }

  toggleRepresentante(index: number): void {
    this.representanteExpandido[index] = !this.representanteExpandido[index];
  }

  // Métodos de ayuda para mostrar datos de referencia
  obtenerTipoDocumento(id: any): string {
    const tipo = this.tiposIdentificacion.find(t => t.id === id);
    return tipo ? tipo.nombre : 'No especificado';
  }

  obtenerGenero(id: any): string {
    const genero = this.generos.find(g => g.id === id);
    return genero ? genero.nombre : 'No especificado';
  }

  obtenerPlan(id: any): string {
    const plan = this.planes.find(g => g.id === id);
    return plan ? plan.nombre : 'No especificado';
  }

  obtenerCiudad(id: any): string {
    const ciudad = this.ciudades.find(c => c.id === id);
    return ciudad ? ciudad.nombre : 'No especificada';
  }

  // Funciones auxiliares para el cálculo de edad
  obtenerAnios(fechaNacimiento: string): number {
    if (!fechaNacimiento) {
      return 0;
    }

    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();

    // Verificar que la fecha sea válida
    if (isNaN(fechaNac.getTime())) {
      return 0;
    }

    let años = hoy.getFullYear() - fechaNac.getFullYear();
    const meses = hoy.getMonth() - fechaNac.getMonth();

    // Ajustar si aún no ha cumplido el mes exacto
    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) {
      años--;
    }

    return años;
  }

  obtenerMeses(fechaNacimiento: string): number {
    if (!fechaNacimiento) {
      return 0;
    }

    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();

    // Verificar que la fecha sea válida
    if (isNaN(fechaNac.getTime())) {
      return 0;
    }

    let meses = hoy.getMonth() - fechaNac.getMonth();

    // Ajustar si aún no ha cumplido el día exacto
    if (hoy.getDate() < fechaNac.getDate()) {
      meses--;
    }

    // Si los meses son negativos, ajustar
    if (meses < 0) {
      meses = meses + 12;
    }

    return meses;
  }
}