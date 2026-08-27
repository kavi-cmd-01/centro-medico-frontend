import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente'; // Ajusta la ruta a tu modelo si es distinta

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  // Reemplaza esta URL con tu URL exacta de Render + la ruta del endpoint
  private apiUrl = 'https://centro-medico-plrv.onrender.com/api/pacientes';

  constructor(private http: HttpClient) { }

  // Obtener todos los pacientes
  getPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }

  // Guardar / Crear un nuevo paciente
  crearPaciente(paciente: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, paciente);
  }

  // Eliminar un paciente por ID (opcional)
  eliminarPaciente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
