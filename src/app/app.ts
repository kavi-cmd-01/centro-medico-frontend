import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { PacienteService } from './services/paciente.service';
import { CitaService } from './services/cita.service';
import { MedicoService } from './services/medico.service';

import { Paciente } from './models/paciente';
import { Cita } from './models/cita';
import { Medico } from './models/medico';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  pacientes = signal<Paciente[]>([]);
  pacienteEnEdicionId = signal<number | null>(null);
  citas = signal<Cita[]>([]);
  medicos = signal<Medico[]>([]);

  private pacienteService = inject(PacienteService);
  private citaService = inject(CitaService);
  private medicoService = inject(MedicoService);
  private fb = inject(FormBuilder);

  pacienteForm!: FormGroup;
  citaForm!: FormGroup;
  medicoForm!: FormGroup;

  esEdicion = false;
  idEdicion: number | null = null;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarPacientes();
    this.cargarMedicos();
    this.cargarCitas();
  }

  private inicializarFormularios(): void {
    this.pacienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}[A-Za-z]$')]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.medicoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      especialidad: ['', Validators.required],
      numColegiado: ['', Validators.required]
    });

    this.citaForm = this.fb.group({
      pacienteId: ['', Validators.required],
      medicoId: ['', Validators.required],
      fechaHora: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  cargarPacientes(): void {
    this.pacienteService.obtenerPacientes().subscribe({
      next: (data) => this.pacientes.set(data),
      error: (err: any) => console.error('Error al cargar pacientes:', err)
    });
  }

  cargarMedicos(): void {
    this.medicoService.obtenerMedicos().subscribe({
      next: (data) => this.medicos.set(data),
      error: (err: any) => console.error('Error al cargar médicos:', err)
    });
  }

  cargarCitas(): void {
    this.citaService.obtenerCitas().subscribe({
      next: (data) => this.citas.set(data),
      error: (err: any) => console.error('Error al cargar citas:', err)
    });
  }

  guardarMedico(): void {
    if (this.medicoForm.invalid) {
      this.medicoForm.markAllAsTouched();
      return;
    }

    this.medicoService.crearMedico(this.medicoForm.value).subscribe({
      next: () => {
        this.cargarMedicos();
        this.medicoForm.reset();
        Swal.fire({ icon: 'success', title: 'Médico Registrado', timer: 2000, showConfirmButton: false });
      },
      error: (err: any) => Swal.fire('Error', 'No se pudo registrar el médico', 'error')
    });
  }

  guardarPaciente(): void {
    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      return;
    }

    const pacienteData: Paciente = this.pacienteForm.value;

    if (this.esEdicion && this.idEdicion !== null) {
      this.pacienteService.actualizarPaciente(this.idEdicion, pacienteData).subscribe({
        next: () => {
          this.cargarPacientes();
          this.cancelarEdicion();
          Swal.fire({ icon: 'success', title: 'Paciente Actualizado', timer: 2000, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', 'No se pudo actualizar', 'error')
      });
    } else {
      this.pacienteService.crearPaciente(pacienteData).subscribe({
        next: () => {
          this.cargarPacientes();
          this.pacienteForm.reset();
          Swal.fire({ icon: 'success', title: 'Paciente Guardado', timer: 2000, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', 'No se pudo registrar', 'error')
      });
    }
  }

  guardarCita(): void {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      return;
    }

    const { pacienteId, medicoId, fechaHora, motivo } = this.citaForm.value;

    // Formatear la fecha para LocalDateTime (ej. 2026-08-24T16:39:00)
    const fechaFormateada = fechaHora.length === 16 ? `${fechaHora}:00` : fechaHora;

    // Enviar directamente las referencias de los objetos con su ID
    const nuevaCita = {
      fechaHora: fechaFormateada,
      motivo: motivo,
      paciente: { id: Number(pacienteId) },
      medico: { id: Number(medicoId) }
    };

    this.citaService.crearCita(nuevaCita as any).subscribe({
      next: () => {
        this.cargarCitas();
        this.citaForm.reset();
        Swal.fire({ icon: 'success', title: 'Cita Agendada Correctamente', timer: 2000, showConfirmButton: false });
      },
      error: (err: any) => {
        console.error('Detalle del error 500:', err);
        Swal.fire('Error', 'Error en el servidor al guardar la cita.', 'error');
      }
    });
  }

  eliminarCita(id: number | undefined): void {
    if (!id) return;
    Swal.fire({
      title: '¿Cancelar cita?', icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, cancelar'
    }).then((r) => {
      if (r.isConfirmed) {
        this.citaService.eliminarCita(id).subscribe({
          next: () => this.cargarCitas(),
          error: (err: any) => Swal.fire('Error', 'No se pudo cancelar', 'error')
        });
      }
    });
  }
// Para la edición de pacientes
editarPaciente(paciente: Paciente): void {
  if (paciente.id) {
    this.pacienteEnEdicionId.set(paciente.id);
    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellidos: paciente.apellidos,
      dni: paciente.dni,
      telefono: paciente.telefono,
      email: paciente.email
    });
  }
}

cancelarEdicion(): void {
  this.pacienteEnEdicionId.set(null);
  this.pacienteForm.reset();
}
  esCampoInvalido(form: FormGroup, campo: string): boolean {
    const control = form.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
