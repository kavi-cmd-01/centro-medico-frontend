import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacienteService } from './services/paciente.service';
import { Paciente } from './models/paciente';
import Swal from 'sweetalert2';

interface Medico {
  id: number;
  nombre: string;
  especialidad: string;
  telefono: string;
  email: string;
}

interface Cita {
  id: number;
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

  pacientes: Paciente[] = [];
  medicos: Medico[] = [];
  citas: Cita[] = [];

  nuevoPaciente: Paciente = {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: ''
  };

  nuevoMedico: Medico = {
    id: 0,
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
    this.cargarMedicosLocalStorage();
  }

  // --- PACIENTES ---
  obtenerPacientes(): void {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener pacientes:', err);
        Swal.fire('Error', 'No se pudieron cargar los pacientes desde el servidor.', 'error');
      }
    });
  }

  guardarPaciente(): void {
    if (!this.nuevoPaciente.nombre || !this.nuevoPaciente.apellido || !this.nuevoPaciente.dni) {
      Swal.fire('Atención', 'Por favor, completa Nombre, Apellido y DNI.', 'warning');
      return;
    }

    if (this.idEdicion !== null) {
      // Actualizar paciente existente
      this.pacienteService.actualizarPaciente(this.idEdicion, this.nuevoPaciente).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'El paciente ha sido actualizado correctamente.', 'success');
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar paciente:', err);
          Swal.fire('Error', 'No se pudo actualizar el paciente en el servidor.', 'error');
        }
      });
    } else {
      // Crear nuevo paciente
      this.pacienteService.crearPaciente(this.nuevoPaciente).subscribe({
        next: () => {
          Swal.fire('¡Registrado!', 'El paciente se ha guardado con éxito.', 'success');
          this.obtenerPacientes();
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('Error al crear paciente:', err);
          Swal.fire('Error', 'No se pudo guardar el paciente en la base de datos.', 'error');
        }
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
    if (id === undefined) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará al paciente permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pacienteService.eliminarPaciente(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El paciente ha sido eliminado.', 'success');
            this.obtenerPacientes();
          },
          error: (err) => {
            console.error('Error al eliminar paciente:', err);
            Swal.fire('Error', 'No se pudo eliminar el paciente del servidor.', 'error');
          }
        });
      }
    });
  }

  limpiarFormulario(): void {
    this.idEdicion = null;
    this.nuevoPaciente = {
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      email: ''
    };
    this.cdr.detectChanges();
  }

  // --- MÉDICOS (Con persistencia en LocalStorage) ---
  cargarMedicosLocalStorage(): void {
    const medicosGuardados = localStorage.getItem('medicos');
    if (medicosGuardados) {
      this.medicos = JSON.parse(medicosGuardados);
    }
  }

  guardarMedico(): void {
    if (!this.nuevoMedico.nombre) {
      Swal.fire('Atención', 'Ingresa el nombre del médico.', 'warning');
      return;
    }

    const medicoGuardado: Medico = {
      id: Date.now(),
      ...this.nuevoMedico
    };

    this.medicos.push(medicoGuardado);
    localStorage.setItem('medicos', JSON.stringify(this.medicos));

    Swal.fire('¡Éxito!', `Médico Dr/a. ${this.nuevoMedico.nombre} guardado correctamente.`, 'success');

    this.nuevoMedico = { id: 0, nombre: '', especialidad: '', telefono: '', email: '' };
    this.cdr.detectChanges();
  }

  // --- CITAS ---
  agendarCita(): void {
    if (!this.nuevaCita.pacienteId || !this.nuevaCita.medicoId || !this.nuevaCita.fecha) {
      Swal.fire('Campos incompletos', 'Selecciona paciente, médico y fecha.', 'info');
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

      Swal.fire('¡Cita Agendada!', 'La cita ha sido registrada con éxito.', 'success');
      this.nuevaCita = { pacienteId: '', medicoId: '', fecha: '', motivo: '' };
      this.cdr.detectChanges();
    }
  }
}
