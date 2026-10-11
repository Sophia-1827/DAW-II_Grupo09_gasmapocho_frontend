import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ROL_DESCRIPCION } from '../../core/app-config';
import { mensajeDeError } from '../../core/api/api-error';
import { BalonesApi } from '../../core/api/balones.api';
import { Balon, Movimiento } from '../../core/api/models';
import { MovimientosApi } from '../../core/api/movimientos.api';
import { AuthService } from '../../core/auth/auth.service';
import { esHoy, fechaCorta } from '../../shared/formato';
import { Alert } from '../../shared/ui/alert/alert';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Stat } from '../../shared/ui/stat/stat';
import { TableCard } from '../../shared/ui/table-card/table-card';

@Component({
  selector: 'gm-inicio-page',
  imports: [RouterLink, Alert, PageHeader, Stat, TableCard],
  template: `
    <gm-page-header title="Inicio" [subtitle]="descripcion()" />

    @if (sinAcceso()) {
      <gm-alert tone="error">No tienes acceso a esa sección con tu rol actual.</gm-alert>
    }
    @if (error(); as e) {
      <gm-alert tone="error">{{ e }}</gm-alert>
    }

    <section class="stats">
      <gm-stat label="Balones en stock" [value]="cargando() ? '—' : '' + totalStock()" [hint]="balones().length + ' productos en catálogo'" />
      <gm-stat label="Movimientos de hoy" [value]="cargando() ? '—' : '' + hoy().length"
               [hint]="entradasHoy() + ' entradas · ' + salidasHoy() + ' salidas'" />
      <gm-stat label="Bajo mínimo" [value]="cargando() ? '—' : '' + bajoMinimo().length" [hint]="bajoMinimo().join(', ')" />
    </section>

    <gm-table-card [paged]="false">
      <h2 toolbar>Últimos movimientos</h2>
      <a toolbar routerLink="/app/movimientos">Ver todos</a>
      <table class="gm-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Balón</th>
            <th class="cell-right">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td colspan="5">Cargando...</td></tr>
          } @else if (recientes().length === 0) {
            <tr class="row-state"><td colspan="5">Sin movimientos registrados</td></tr>
          }
          @for (row of recientes(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.folio }}</td>
              <td class="cell-muted">{{ fecha(row.fecha) }}</td>
              <td>{{ row.tipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}</td>
              <td>{{ row.balonCodigo }} &middot; {{ row.balonNombre }}</td>
              <td class="cell-num">{{ row.cantidad }}</td>
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    .stats {
      display: grid;
      gap: var(--gm-space-4);
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin: var(--gm-space-4) 0 var(--gm-space-5);
    }
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
    h2 { font-size: var(--gm-text-lg); font-weight: var(--gm-weight-bold); }
  `,
})
export class InicioPage {
  private readonly balonesApi = inject(BalonesApi);
  private readonly movimientosApi = inject(MovimientosApi);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly fecha = fechaCorta;
  protected readonly descripcion = computed(() => {
    const r = this.auth.rol();
    return r ? ROL_DESCRIPCION[r] : '';
  });
  protected readonly sinAcceso = signal(this.route.snapshot.queryParamMap.has('sinAcceso'));
  protected readonly balones = signal<Balon[]>([]);
  protected readonly movimientos = signal<Movimiento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Indicadores calculados a partir de las listas que ya expone la API
  protected readonly totalStock = computed(() => this.balones().reduce((s, b) => s + b.stock, 0));
  protected readonly bajoMinimo = computed(() => this.balones().filter((b) => b.stock <= b.stockMinimo).map((b) => b.codigo));
  protected readonly hoy = computed(() => this.movimientos().filter((m) => esHoy(m.fecha)));
  protected readonly entradasHoy = computed(() => this.hoy().filter((m) => m.tipo === 'ENTRADA').length);
  protected readonly salidasHoy = computed(() => this.hoy().filter((m) => m.tipo === 'SALIDA').length);
  protected readonly recientes = computed(() => this.movimientos().slice(0, 5));

  constructor() {
    const fallo = (err: unknown) => { this.error.set(mensajeDeError(err)); this.cargando.set(false); };
    this.balonesApi.listar().subscribe({ next: (r) => this.balones.set(r), error: fallo });
    this.movimientosApi.listar().subscribe({
      next: (r) => { this.movimientos.set(r); this.cargando.set(false); },
      error: fallo,
    });
  }
}
