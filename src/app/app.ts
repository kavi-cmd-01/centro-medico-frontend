import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacienteService } from './services/paciente.service';
import { Paciente } from './models/paciente';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'centro-medico-frontend';

  // Lista principal de pacientes
  pacientes: Paciente[] = [];

  // Objeto para el formulario
  nuevoPaciente: Paciente = {
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: ''
  };

  // Variable para controlar el modo edición
  idEdicion: number | null = null;

  constructor(private pacienteService: PacienteService) {}

  ngOnInit(): void {
    this.obtenerPacientes();
  }

  // Obtener el listado de pacientes desde Render
  obtenerPacientes(): void {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = data;
      },
      error: (err) => {
        console.error('Error al obtener pacientes:', err);
      }
    });
  }

  // Guardar o Actualizar un paciente
  guardarPaciente(): void {
    if (this.idEdicion !== null) {
      // Si estamos editando
      this.pacienteService.actualizarPaciente(this.idEdicion, this.nuevoPaciente).subscribe({
        next: () => {
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al actualizar paciente:', err)
      });
    } else {
      // Si estamos creando uno nuevo
      this.pacienteService.crearPaciente(this.nuevoPaciente).subscribe({
        next: () => {
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al crear paciente:', err)
      });
    }
  }

  // Cargar datos en el formulario para editar
  editarPaciente(paciente: Paciente): void {
    if (paciente.id !== undefined) {
      this.idEdicion = paciente.id;
      this.nuevoPaciente = { ...paciente };
    }
  }

  // Eliminar un paciente
  eliminarPaciente(id: number | undefined): void {
    if (id !== undefined && confirm('¿Estás seguro de eliminar este paciente?')) {
      this.pacienteService.eliminarPaciente(id).subscribe({
        next: () => {
          this.obtenerPacientes();
        },
        error: (err) => console.error('Error al eliminar paciente:', err)
      });
    }
  }

  // Resetear el formulario
  limpiarFormulario(): void {
    this.idEdicion = null;
    this.nuevoPaciente = {
      nombre: '',
      apellidos: '',
      dni: '',
      telefono: '',
      email: ''
    };
  }
}
