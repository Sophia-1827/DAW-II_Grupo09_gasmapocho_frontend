import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompraRequest, Movimiento, MovimientoEdicion, MovimientoRequest } from './models';

@Injectable({ providedIn: 'root' })
export class MovimientosApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/movimientos`;

  /** Lista completa ordenada por fecha descendente; la pantalla pagina en cliente. */
  listar(): Observable<Movimiento[]> { return this.http.get<Movimiento[]>(this.base); }
  registrar(body: MovimientoRequest): Observable<Movimiento> { return this.http.post<Movimiento>(this.base, body); }

  /** Solo ADMIN. Si cambia la cantidad, el backend corrige el stock con la diferencia. */
  editar(id: number, body: MovimientoEdicion): Observable<Movimiento> { return this.http.put<Movimiento>(`${this.base}/${id}`, body); }
  confirmar(id: number): Observable<Movimiento> { return this.http.patch<Movimiento>(`${this.base}/${id}/confirmar`, null); }
  /** No borra: deja el movimiento en el historial como ANULADO y revierte el stock. */
  anular(id: number): Observable<Movimiento> { return this.http.patch<Movimiento>(`${this.base}/${id}/anular`, null); }

  /** Historial de compras a proveedores, opcionalmente de uno solo. */
  listarCompras(proveedorId?: number): Observable<Movimiento[]> {
    let params = new HttpParams();
    if (proveedorId) params = params.set('proveedorId', proveedorId);
    return this.http.get<Movimiento[]>(`${this.base}/compras`, { params });
  }
  registrarCompra(body: CompraRequest): Observable<Movimiento> { return this.http.post<Movimiento>(`${this.base}/compras`, body); }
}
