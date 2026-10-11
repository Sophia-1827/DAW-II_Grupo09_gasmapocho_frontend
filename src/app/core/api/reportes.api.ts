import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Catálogo fijo: cada reporte es un GET de ms-reportes. */
export interface ReporteCatalogo {
  clave: 'stock-actual' | 'movimientos-dia' | 'consolidado-mensual';
  nombre: string;
  descripcion: string;
  tipo: 'REST' | 'SOAP';
  periodo: string;
}

export const REPORTES: readonly ReporteCatalogo[] = [
  { clave: 'stock-actual', nombre: 'Stock actual', descripcion: 'Existencias por tipo de balón (también por SOAP)', tipo: 'SOAP', periodo: 'Al día' },
  { clave: 'movimientos-dia', nombre: 'Movimientos del día', descripcion: 'Entradas y salidas con responsable', tipo: 'REST', periodo: 'Diario' },
  { clave: 'consolidado-mensual', nombre: 'Consolidado mensual', descripcion: 'Unidades movidas y ventas por balón', tipo: 'REST', periodo: 'Mensual' },
];

@Injectable({ providedIn: 'root' })
export class ReportesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reportes`;

  generar(clave: string): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/${clave}`);
  }
}
