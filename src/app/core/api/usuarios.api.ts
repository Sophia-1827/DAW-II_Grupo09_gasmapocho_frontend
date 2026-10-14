import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioRequest } from './models';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/usuarios`;

  listar(): Observable<Usuario[]> { return this.http.get<Usuario[]>(this.base); }
  obtener(id: number): Observable<Usuario> { return this.http.get<Usuario>(`${this.base}/${id}`); }
  crear(body: UsuarioRequest): Observable<Usuario> { return this.http.post<Usuario>(this.base, body); }
  actualizar(id: number, body: UsuarioRequest): Observable<Usuario> { return this.http.put<Usuario>(`${this.base}/${id}`, body); }
  /** Alterna activo/inactivo. Un usuario inactivo no puede iniciar sesión; un ADMIN no puede desactivarse a sí mismo. */
  cambiarEstado(id: number): Observable<Usuario> { return this.http.patch<Usuario>(`${this.base}/${id}/estado`, null); }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
