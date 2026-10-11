import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Balon, BalonRequest } from './models';

@Injectable({ providedIn: 'root' })
export class BalonesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/balones`;

  listar(): Observable<Balon[]> { return this.http.get<Balon[]>(this.base); }
  obtener(id: number): Observable<Balon> { return this.http.get<Balon>(`${this.base}/${id}`); }
  crear(body: BalonRequest): Observable<Balon> { return this.http.post<Balon>(this.base, body); }
  actualizar(id: number, body: BalonRequest): Observable<Balon> { return this.http.put<Balon>(`${this.base}/${id}`, body); }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
