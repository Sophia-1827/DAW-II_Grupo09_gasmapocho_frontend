import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor, ProveedorRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ProveedoresApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/proveedores`;

  listar(): Observable<Proveedor[]> { return this.http.get<Proveedor[]>(this.base); }
  listarActivos(): Observable<Proveedor[]> { return this.http.get<Proveedor[]>(`${this.base}/activos`); }
  obtener(id: number): Observable<Proveedor> { return this.http.get<Proveedor>(`${this.base}/${id}`); }
  crear(body: ProveedorRequest): Observable<Proveedor> { return this.http.post<Proveedor>(this.base, body); }
  actualizar(id: number, body: ProveedorRequest): Observable<Proveedor> { return this.http.put<Proveedor>(`${this.base}/${id}`, body); }
  /** Alterna activo/inactivo; el backend no borra proveedores con historial de compras. */
  cambiarEstado(id: number): Observable<Proveedor> { return this.http.patch<Proveedor>(`${this.base}/${id}/estado`, null); }
}
