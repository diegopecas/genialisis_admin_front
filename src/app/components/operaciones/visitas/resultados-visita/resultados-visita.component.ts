import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../../../common/header/header.component';
import { VisitasService } from '../../../../services/visitas.service';

@Component({
  selector: 'app-resultados-visita',
  templateUrl: './resultados-visita.component.html',
  styleUrl: './resultados-visita.component.scss',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
})
export class ResultadosVisitaComponent implements OnInit {
  titulo = 'Resultados de la Visita';
  public id = '0';

  public seccionActiva:
    | 'participantes'
    | 'encuesta'
    | 'ideas'
    | 'caracter'
    | 'calificacion' = 'participantes';

  public visita: any = null;
  public participantes: any[] = [];
  public encuestas: any[] = [];
  public ideas: any[] = [];
  public caracter: any[] = [];
  public calificacion: any = null;

  // Encuesta abierta en el acordeón (una por vez: en una tabla plana no se
  // entiende de quién es cada tiempo).
  public encuestaAbierta: string | null = null;

  constructor(
    private visitasService: VisitasService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.id = params['id'];
      this.consultarResultados();
    });
  }

  consultarResultados() {
    this.visitasService.obtenerResultados(this.id).subscribe({
      next: (response: any) => {
        const body = response.body as any;
        this.visita = body.visita;
        this.participantes = body.participantes || [];
        this.encuestas = body.encuestas || [];
        this.ideas = body.ideas || [];
        this.caracter = body.caracter || [];
        this.calificacion = body.calificacion;
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar los resultados.', 'error');
      },
    });
  }

  cambiarSeccion(seccion: any) {
    this.seccionActiva = seccion;
  }

  alternarEncuesta(idEncuesta: string) {
    this.encuestaAbierta = this.encuestaAbierta === idEncuesta ? null : idEncuesta;
  }

  nombreRol(rol: string): string {
    switch (rol) {
      case 'coordinacion':
        return 'Coordinación';
      case 'direccion':
        return 'Dirección';
      default:
        return 'Docente';
    }
  }

  // Secciones presentes en una encuesta, en el orden en que llegaron.
  seccionesDe(encuesta: any): string[] {
    const secciones: string[] = [];
    for (const respuesta of encuesta.respuestas || []) {
      if (secciones.indexOf(respuesta.titulo_seccion) < 0) {
        secciones.push(respuesta.titulo_seccion);
      }
    }
    return secciones;
  }

  respuestasDe(encuesta: any, tituloSeccion: string): any[] {
    return (encuesta.respuestas || []).filter(
      (r: any) => r.titulo_seccion === tituloSeccion
    );
  }

  extrasDe(encuesta: any, tituloSeccion: string): any[] {
    // Los extras guardan la sección técnica, no el título; se resuelve
    // buscando alguna respuesta de esa sección.
    const respuesta = (encuesta.respuestas || []).find(
      (r: any) => r.titulo_seccion === tituloSeccion
    );
    if (!respuesta) {
      return [];
    }
    return (encuesta.extras || []).filter((e: any) => e.seccion === respuesta.seccion);
  }

  // Subtotal de tiempo de una sección, en la unidad de esa sección.
  subtotal(encuesta: any, tituloSeccion: string): number {
    let total = 0;
    for (const respuesta of this.respuestasDe(encuesta, tituloSeccion)) {
      total += respuesta.tiempo ? Number(respuesta.tiempo) : 0;
    }
    for (const extra of this.extrasDe(encuesta, tituloSeccion)) {
      total += extra.tiempo ? Number(extra.tiempo) : 0;
    }
    return total;
  }

  unidadDe(encuesta: any, tituloSeccion: string): string {
    const respuesta = (encuesta.respuestas || []).find(
      (r: any) => r.titulo_seccion === tituloSeccion
    );
    return respuesta ? respuesta.unidad : 'minutos';
  }

  // Preguntas de carácter distintas, para agrupar el listado.
  preguntasCaracter(): string[] {
    const preguntas: string[] = [];
    for (const fila of this.caracter) {
      if (preguntas.indexOf(fila.pregunta) < 0) {
        preguntas.push(fila.pregunta);
      }
    }
    return preguntas;
  }

  respuestasCaracter(pregunta: string): any[] {
    return this.caracter.filter((c: any) => c.pregunta === pregunta);
  }

  // Bloques de la calificación, en orden.
  bloquesCalificacion(): string[] {
    const bloques: string[] = [];
    for (const item of (this.calificacion?.items || [])) {
      if (bloques.indexOf(item.titulo_bloque) < 0) {
        bloques.push(item.titulo_bloque);
      }
    }
    return bloques;
  }

  itemsCalificacion(tituloBloque: string): any[] {
    return (this.calificacion?.items || []).filter(
      (i: any) => i.titulo_bloque === tituloBloque
    );
  }

  volver() {
    this.router.navigate(['/operaciones/visitas']);
  }
}
