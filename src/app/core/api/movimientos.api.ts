import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Movimiento, MovimientoRequest } from './models';

@Injectable({ providedIn: 'root' })
export class MovimientosApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/movimientos`;

  /** Lista completa ordenada por fecha descendente; la pantalla pagina en cliente. */
  listar(): Observable<Movimiento[]> { return this.http.get<Movimiento[]>(this.base); }
  registrar(body: MovimientoRequest): Observable<Movimiento> { return this.http.post<Movimiento>(this.base, body); }
}
