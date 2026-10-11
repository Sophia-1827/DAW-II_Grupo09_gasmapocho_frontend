import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/api-error';
import { Movimiento } from '../../core/api/models';
import { MovimientosApi } from '../../core/api/movimientos.api';
import { AuthService } from '../../core/auth/auth.service';
import { fechaCorta } from '../../shared/formato';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

/** Historial de movimientos. Todos registran entradas y salidas; ADMIN además exporta. */
@Component({
  selector: 'gm-movimientos-page',
  imports: [RouterLink, Alert, Button, Icon, PageHeader, TableCard],
  template: `
    <gm-page-header title="Movimientos"
      [subtitle]="auth.esAdmin() ? 'Supervisa y registra las entradas y salidas de balones' : 'Registra y revisa las entradas y salidas del almacén'">
      @if (auth.esAdmin()) {
        <button gm-button variant="secondary" type="button" (click)="exportar()"><gm-icon name="download" [size]="18" />Exportar CSV</button>
      }
      <a gm-button variant="secondary" routerLink="/app/movimientos/nuevo" [queryParams]="{ tipo: 'ENTRADA' }"><gm-icon name="arrow-in" [size]="18" />Nueva entrada</a>
      <a gm-button routerLink="/app/movimientos/nuevo" [queryParams]="{ tipo: 'SALIDA' }"><gm-icon name="arrow-out" [size]="18" />Nueva salida</a>
    </gm-page-header>

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [total]="todos().length" [pageSize]="tamano" [pagina]="pagina()" (paginaChange)="pagina.set($event)">
      <span toolbar class="toolbar-title">Historial de movimientos</span>
      <table class="gm-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Balón</th>
            <th class="cell-right">Cantidad</th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td colspan="6">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td colspan="6">Sin movimientos registrados</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.folio }}</td>
              <td class="cell-muted">{{ fecha(row.fecha) }}</td>
              <td>{{ row.tipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}</td>
              <td>{{ row.balonCodigo }} &middot; {{ row.balonNombre }}</td>
              <td class="cell-num">{{ row.cantidad }}</td>
              <td class="cell-muted">{{ row.responsable }}</td>
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
    .toolbar-title { font-weight: var(--gm-weight-semibold); }
  `,
})
export class MovimientosPage {
  private readonly api = inject(MovimientosApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly tamano = TAMANO;
  protected readonly fecha = fechaCorta;
  protected readonly todos = signal<Movimiento[]>([]);
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO;
    return this.todos().slice(inicio, inicio + TAMANO);
  });

  constructor() {
    const folio = this.route.snapshot.queryParamMap.get('creado');
    if (folio) this.mensaje.set({ tone: 'success', texto: `Movimiento ${folio} registrado. El stock se actualiza en segundos.` });
    this.api.listar().subscribe({
      next: (rows) => { this.todos.set(rows); this.cargando.set(false); },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.cargando.set(false); },
    });
  }

  /** Descarga todo el historial como CSV. */
  protected exportar(): void {
    const enc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const filas = [
      ['Folio', 'Fecha', 'Tipo', 'Balón', 'Nombre', 'Cantidad', 'Precio unitario', 'Responsable', 'Observación'].map(enc).join(';'),
      ...this.todos().map((m) => [m.folio, m.fecha, m.tipo, m.balonCodigo, m.balonNombre, m.cantidad, m.precioUnitario, m.responsable, m.observacion].map(enc).join(';')),
    ];
    const blob = new Blob(['﻿' + filas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
