import { Paciente } from './paciente';
import { Medico } from './medico';

export interface Cita {
  id?: number;
  fechaHora: string;
  motivo: string;
  paciente: Paciente;
  medico: Medico;
}
