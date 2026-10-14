import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ClientesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/clientes`;

  listar(): Observable<Cliente[]> { return this.http.get<Cliente[]>(this.base); }
  listarActivos(): Observable<Cliente[]> { return this.http.get<Cliente[]>(`${this.base}/activos`); }
  obtener(id: number): Observable<Cliente> { return this.http.get<Cliente>(`${this.base}/${id}`); }
  crear(body: ClienteRequest): Observable<Cliente> { return this.http.post<Cliente>(this.base, body); }
  actualizar(id: number, body: ClienteRequest): Observable<Cliente> { return this.http.put<Cliente>(`${this.base}/${id}`, body); }
  /** Alterna activo/inactivo; el backend no borra clientes con historial de ventas. */
  cambiarEstado(id: number): Observable<Cliente> { return this.http.patch<Cliente>(`${this.base}/${id}/estado`, null); }
}
