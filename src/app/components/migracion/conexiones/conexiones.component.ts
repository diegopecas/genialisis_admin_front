import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../common/header/header.component';
import Swal from 'sweetalert2';
import { MigracionConexionesService } from '../../../services/migracion-conexiones.service';

@Component({
  selector: 'app-migracion-conexiones',
  templateUrl: './conexiones.component.html',
  styleUrl: './conexiones.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
})
export class MigracionConexionesComponent implements OnInit {

  public titulo = 'Conexiones destino';

  public conexiones: any[] = [];
  public cargando: boolean = false;

  public mostrarFormulario: boolean = false;
  public editando: boolean = false;
  public conexion: any = this.conexionVacia();

  public ambientes: string[] = ['semilla', 'pruebas', 'produccion'];

  constructor(private migracionConexionesService: MigracionConexionesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  private conexionVacia() {
    return {
      id: null,
      nombre: '',
      ambiente: 'pruebas',
      host: '',
      puerto: 3306,
      base_datos: '',
      usuario: '',
      clave: '',
      solo_lectura: 0
    };
  }

  cargar(): void {
    this.cargando = true;

    this.migracionConexionesService.obtenerTodos().subscribe({
      next: (respuesta: any) => {
        this.conexiones = respuesta.body || [];
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        Swal.fire('Error', error.message, 'error');
      }
    });
  }

  abrirFormulario(): void {
    this.conexion = this.conexionVacia();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  /**
   * La clave nunca vuelve del back, así que el campo arranca vacío: si se
   * deja así, se conserva la que ya estaba guardada.
   */
  editar(c: any): void {
    this.conexion = {
      id: c.id,
      nombre: c.nombre,
      ambiente: c.ambiente,
      host: c.host,
      puerto: c.puerto,
      base_datos: c.base_datos,
      usuario: c.usuario,
      clave: '',
      solo_lectura: c.solo_lectura
    };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  /** La semilla es referencia: se fuerza a solo lectura. */
  alCambiarAmbiente(): void {
    if (this.conexion.ambiente === 'semilla') {
      this.conexion.solo_lectura = 1;
    }
  }

  guardar(): void {
    if (!this.conexion.nombre || !this.conexion.host || !this.conexion.base_datos || !this.conexion.usuario) {
      Swal.fire('Faltan datos', 'Nombre, host, base de datos y usuario son obligatorios', 'warning');
      return;
    }
    if (!this.editando && !this.conexion.clave) {
      Swal.fire('Faltan datos', 'Escribe la clave de la conexión', 'warning');
      return;
    }

    const peticion = this.editando
      ? this.migracionConexionesService.actualizar(this.conexion)
      : this.migracionConexionesService.crear(this.conexion);

    peticion.subscribe({
      next: () => {
        this.mostrarFormulario = false;
        this.cargar();
      },
      error: (error) => Swal.fire('Error', error.message, 'error')
    });
  }

  probar(c: any): void {
    this.migracionConexionesService.probar(c.id).subscribe({
      next: (respuesta: any) => {
        if (!respuesta.success) {
          Swal.fire('No conectó', respuesta.error, 'error');
          return;
        }

        const tenants = respuesta.tenants_presentes.length
          ? respuesta.tenants_presentes.join(', ')
          : 'ninguno (la base está vacía)';

        Swal.fire({
          icon: 'success',
          title: 'Conexión correcta',
          html: `Base <strong>${respuesta.base_datos}</strong> (${respuesta.ambiente})<br><br>`
            + `${respuesta.total_tablas} tablas · ${respuesta.tablas_con_tenant} con id_tenant · `
            + `${respuesta.tablas_globales} globales<br><br>`
            + `Tenants ya presentes: ${tenants}`
        });
      },
      error: (error) => Swal.fire('No conectó', error.message, 'error')
    });
  }

  eliminar(c: any): void {
    Swal.fire({
      title: '¿Desactivar la conexión?',
      text: 'Queda inactiva pero no se borra, para que la bitácora de las sesiones siga teniendo contexto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then(resultado => {
      if (!resultado.isConfirmed) {
        return;
      }
      this.migracionConexionesService.eliminar({ id: c.id }).subscribe({
        next: () => this.cargar(),
        error: (error) => Swal.fire('Error', error.message, 'error')
      });
    });
  }

  claseAmbiente(ambiente: string): string {
    switch (ambiente) {
      case 'produccion': return 'ambiente-produccion';
      case 'pruebas': return 'ambiente-pruebas';
      default: return 'ambiente-semilla';
    }
  }
}
