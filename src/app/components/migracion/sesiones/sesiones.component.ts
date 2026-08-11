import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../common/header/header.component';
import Swal from 'sweetalert2';
import { MigracionSesionesService } from '../../../services/migracion-sesiones.service';
import { MigracionConexionesService } from '../../../services/migracion-conexiones.service';
import { ClientesService } from '../../../services/clientes.service';

@Component({
  selector: 'app-migracion-sesiones',
  templateUrl: './sesiones.component.html',
  styleUrl: './sesiones.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
})
export class MigracionSesionesComponent implements OnInit {

  public titulo = 'Migración de clientes';

  public sesiones: any[] = [];
  public conexiones: any[] = [];
  public clientes: any[] = [];
  public cargando: boolean = false;

  public mostrarFormulario: boolean = false;
  public nueva: any = this.sesionVacia();

  constructor(
    private migracionSesionesService: MigracionSesionesService,
    private migracionConexionesService: MigracionConexionesService,
    private clientesService: ClientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private sesionVacia() {
    return {
      id_cliente: null,
      nombre_cliente: '',
      codigo_tenant_destino: '',
      id_tenant_destino: null,
      anno: new Date().getFullYear(),
      id_conexion: null,
      id_conexion_semilla: null,
      notas: ''
    };
  }

  cargar(): void {
    this.cargando = true;

    this.migracionSesionesService.obtenerTodos().subscribe({
      next: (respuesta: any) => {
        this.sesiones = respuesta.body || [];
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        Swal.fire('Error', error.message, 'error');
      }
    });

    this.migracionConexionesService.obtenerTodos().subscribe({
      next: (respuesta: any) => { this.conexiones = respuesta.body || []; },
      error: () => { this.conexiones = []; }
    });

    this.clientesService.obtenerTodos().subscribe({
      next: (respuesta: any) => { this.clientes = respuesta.body || []; },
      error: () => { this.clientes = []; }
    });
  }

  /** La semilla es de solo lectura, así que no puede ser destino. */
  get conexionesDestino(): any[] {
    return this.conexiones.filter(c => c.ambiente !== 'semilla');
  }

  get conexionesSemilla(): any[] {
    return this.conexiones.filter(c => c.ambiente === 'semilla');
  }

  abrirFormulario(): void {
    this.nueva = this.sesionVacia();
    this.mostrarFormulario = true;
  }

  /** Al escoger un cliente registrado se hereda su nombre. */
  alCambiarCliente(): void {
    const cliente = this.clientes.find(c => c.id === this.nueva.id_cliente);
    if (!cliente) {
      return;
    }
    const partes = [
      cliente.primer_nombre,
      cliente.segundo_nombre,
      cliente.primer_apellido,
      cliente.segundo_apellido
    ].filter(p => !!p);
    this.nueva.nombre_cliente = partes.join(' ').trim();
  }

  guardar(): void {
    if (!this.nueva.nombre_cliente || !this.nueva.codigo_tenant_destino) {
      Swal.fire('Faltan datos', 'El nombre del cliente y el código del tenant destino son obligatorios', 'warning');
      return;
    }
    if (!this.nueva.id_conexion) {
      Swal.fire('Faltan datos', 'Escoge contra qué base se va a trabajar', 'warning');
      return;
    }

    this.migracionSesionesService.crear(this.nueva).subscribe({
      next: (respuesta: any) => {
        this.mostrarFormulario = false;
        this.router.navigate(['/migracion/sesion', respuesta.id]);
      },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  abrir(sesion: any): void {
    this.router.navigate(['/migracion/sesion', sesion.id]);
  }

  eliminar(sesion: any, evento: Event): void {
    evento.stopPropagation();

    Swal.fire({
      title: '¿Borrar la sesión?',
      text: 'Se borran los archivos cargados y el expediente. Lo que ya se escribió en la base destino NO se borra con esto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.migracionSesionesService.eliminar({ id: sesion.id }).subscribe({
        next: () => this.cargar(),
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'abierta': return 'estado-abierta';
      case 'en_proceso': return 'estado-proceso';
      case 'validada': return 'estado-validada';
      case 'purgada': return 'estado-purgada';
      default: return 'estado-cancelada';
    }
  }

  avance(sesion: any): number {
    if (!sesion.total_bloques) {
      return 0;
    }
    return Math.round((sesion.bloques_listos / sesion.total_bloques) * 100);
  }
}
