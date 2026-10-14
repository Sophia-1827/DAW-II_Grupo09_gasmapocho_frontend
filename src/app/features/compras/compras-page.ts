import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/api-error';
import { Movimiento, Proveedor } from '../../core/api/models';
import { MovimientosApi } from '../../core/api/movimientos.api';
import { ProveedoresApi } from '../../core/api/proveedores.api';
import { fechaCorta, pesos } from '../../shared/formato';
import { Alert } from '../../shared/ui/alert/alert';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

/** Historial de compras a proveedores, con filtro por proveedor. Cada compra suma stock al balón. */
@Component({
  selector: 'gm-compras-page',
  imports: [RouterLink, Alert, Badge, Button, Icon, PageHeader, TableCard],
  template: `
    <gm-page-header title="Compras" subtitle="Historial de balones comprados a proveedores">
      <a gm-button routerLink="/app/compras/nueva"><gm-icon name="plus" [size]="18" />Nueva compra</a>
    </gm-page-header>

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [total]="todas().length" [pageSize]="tamano" [pagina]="pagina()" (paginaChange)="pagina.set($event)">
      <label toolbar class="filtro">
        <span class="sr-only">Filtrar por proveedor</span>
        <select class="gm-select" (change)="filtrar($any($event.target).value)">
          <option value="">Todos los proveedores</option>
          @for (p of proveedores(); track p.id) {
            <option [value]="p.id">{{ p.nombre }}</option>
          }
        </select>
      </label>
      <table class="gm-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Balón</th>
            <th class="cell-right">Cantidad</th>
            <th class="cell-right">Costo unitario</th>
            <th class="cell-right">Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td colspan="8">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td colspan="8">Sin compras registradas</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.folio }}</td>
              <td class="cell-muted">{{ fecha(row.fecha) }}</td>
              <td>{{ row.proveedorNombre }}</td>
              <td>{{ row.balonCodigo }} &middot; {{ row.balonNombre }}</td>
              <td class="cell-num">{{ row.cantidad }}</td>
              <td class="cell-num">{{ pesos(row.precioUnitario) }}</td>
              <td class="cell-num">{{ pesos(row.cantidad * row.precioUnitario) }}</td>
              <td><gm-badge [tone]="tono(row)">{{ row.estado }}</gm-badge></td>
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .filtro { display: block; min-width: 240px; }
  `,
})
export class ComprasPage {
  private readonly api = inject(MovimientosApi);
  private readonly proveedoresApi = inject(ProveedoresApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly tamano = TAMANO;
  protected readonly fecha = fechaCorta;
  protected readonly pesos = pesos;
  protected readonly todas = signal<Movimiento[]>([]);
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO;
    return this.todas().slice(inicio, inicio + TAMANO);
  });

  constructor() {
    const folio = this.route.snapshot.queryParamMap.get('creada');
    if (folio) this.mensaje.set({ tone: 'success', texto: `Compra ${folio} registrada. El stock se actualiza en segundos.` });
    this.proveedoresApi.listar().subscribe({ next: (rows) => this.proveedores.set(rows) });
    this.cargar();
  }

  protected filtrar(valor: string): void {
    this.pagina.set(1);
    this.cargar(valor ? Number(valor) : undefined);
  }

  protected tono(m: Movimiento): 'warning' | 'success' | 'danger' {
    return m.estado === 'CONFIRMADO' ? 'success' : m.estado === 'ANULADO' ? 'danger' : 'warning';
  }

  private cargar(proveedorId?: number): void {
    this.cargando.set(true);
    this.api.listarCompras(proveedorId).subscribe({
      next: (rows) => { this.todas.set(rows); this.cargando.set(false); },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.cargando.set(false); },
    });
  }
}
