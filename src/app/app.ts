import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacienteService } from './services/paciente.service';
import { Paciente } from './models/paciente';

interface Medico {
  id?: number;
  nombre: string;
  especialidad: string;
  telefono: string;
  email: string;
}

interface Cita {
  id?: number;
  pacienteNombre: string;
  medicoNombre: string;
  fecha: string;
  motivo: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'centro-medico-frontend';

  // Listas de datos
  pacientes: Paciente[] = [];
  medicos: Medico[] = [];
  citas: Cita[] = [];

  // Formularios
  nuevoPaciente: Paciente = {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: ''
  };

  nuevoMedico: Medico = {
    nombre: '',
    especialidad: '',
    telefono: '',
    email: ''
  };

  nuevaCita = {
    pacienteId: '',
    medicoId: '',
    fecha: '',
    motivo: ''
  };

  idEdicion: number | null = null;

  constructor(
    private pacienteService: PacienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerPacientes();
  }

  // Pacientes
  obtenerPacientes(): void {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al obtener pacientes:', err)
    });
  }

  guardarPaciente(): void {
    if (this.idEdicion !== null) {
      this.pacienteService.actualizarPaciente(this.idEdicion, this.nuevoPaciente).subscribe({
        next: () => {
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al actualizar paciente:', err)
      });
    } else {
      this.pacienteService.crearPaciente(this.nuevoPaciente).subscribe({
        next: () => {
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al crear paciente:', err)
      });
    }
  }

  editarPaciente(paciente: Paciente): void {
    if (paciente.id !== undefined) {
      this.idEdicion = paciente.id;
      this.nuevoPaciente = { ...paciente };
      this.cdr.detectChanges();
    }
  }

  eliminarPaciente(id: number | undefined): void {
    if (id !== undefined && confirm('¿Estás seguro de eliminar este paciente?')) {
      this.pacienteService.eliminarPaciente(id).subscribe({
        next: () => this.obtenerPacientes(),
        error: (err) => console.error('Error al eliminar paciente:', err)
      });
    }
  }

  limpiarFormulario(): void {
    this.idEdicion = null;
    this.nuevoPaciente = { nombre: '', apellido: '', dni: '', telefono: '', email: '' };
    this.cdr.detectChanges();
  }

  // Médicos
  guardarMedico(): void {
    if (!this.nuevoMedico.nombre) {
      alert('Por favor, ingresa el nombre del médico.');
      return;
    }

    const medicoGuardado: Medico = {
      id: Date.now(),
      ...this.nuevoMedico
    };

    this.medicos.push(medicoGuardado);
    alert(`Médico guardado: Dr/a. ${this.nuevoMedico.nombre}`);

    this.nuevoMedico = { nombre: '', especialidad: '', telefono: '', email: '' };
    this.cdr.detectChanges();
  }

  // Citas
  agendarCita(): void {
    if (!this.nuevaCita.pacienteId || !this.nuevaCita.medicoId || !this.nuevaCita.fecha) {
      alert('Por favor selecciona un paciente, un médico y una fecha.');
      return;
    }

    const paciente = this.pacientes.find(p => p.id === Number(this.nuevaCita.pacienteId));
    const medico = this.medicos.find(m => m.id === Number(this.nuevaCita.medicoId));

    if (paciente && medico) {
      this.citas.push({
        id: Date.now(),
        pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
        medicoNombre: medico.nombre,
        fecha: this.nuevaCita.fecha,
        motivo: this.nuevaCita.motivo
      });

      alert('Cita agendada con éxito.');
      this.nuevaCita = { pacienteId: '', medicoId: '', fecha: '', motivo: '' };
      this.cdr.detectChanges();
    }
  }
}
