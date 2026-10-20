import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../core/api/api-error';
import { Movimiento } from '../../core/api/models';
import { MovimientosApi } from '../../core/api/movimientos.api';
import { AuthService } from '../../core/auth/auth.service';
import { fechaCorta, pesos } from '../../shared/formato';
import { Alert } from '../../shared/ui/alert/alert';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

/**
 * Historial de movimientos. Todos registran; solo ADMIN edita, confirma y anula.
 * Un movimiento REGISTRADO se puede editar, confirmar o anular; uno CONFIRMADO solo se anula.
 */
@Component({
  selector: 'gm-movimientos-page',
  imports: [RouterLink, Alert, Badge, Button, Icon, PageHeader, TableCard],
  template: `
    <gm-page-header title="Movimientos"
      [subtitle]="auth.esAdmin() ? 'Revisa el historial de entradas y salidas de balones y gestiona su estado' : 'Registra y revisa las entradas y salidas del almacén'">
      <a gm-button routerLink="/app/movimientos/nuevo"><gm-icon name="swap" [size]="18" />Registrar movimiento</a>
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
            <th class="cell-right">Precio</th>
            <th>Proveedor / Cliente</th>
            <th>Estado</th>
            @if (auth.esAdmin()) {
              <th class="cell-actions"><span class="sr-only">Acciones</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Sin movimientos registrados</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr [class.anulado]="row.estado === 'ANULADO'">
              <td class="cell-code">{{ row.folio }}</td>
              <td class="cell-muted">{{ fecha(row.fecha) }}</td>
              <td>{{ row.tipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}</td>
              <td>{{ row.balonCodigo }} &middot; {{ row.balonNombre }}</td>
              <td class="cell-num">{{ row.cantidad }}</td>
              <td class="cell-num">{{ pesos(row.precioUnitario) }}</td>
              <td class="cell-muted">
                @if (row.proveedorNombre) {
                  {{ row.proveedorNombre }}
                } @else if (row.clienteNombre) {
                  {{ row.clienteNombre }}
                  <span class="sub">{{ row.clienteDireccion }}</span>
                } @else {
                  —
                }
              </td>
              <td><gm-badge [tone]="tono(row)">{{ row.estado }}</gm-badge></td>
              @if (auth.esAdmin()) {
                <td class="cell-actions">
                  @if (row.estado === 'REGISTRADO') {
                    <a gm-button variant="icon" [routerLink]="['/app/movimientos', row.id, 'editar']" [attr.aria-label]="'Editar ' + row.folio" title="Editar"><gm-icon name="pencil" [size]="18" /></a>
                    <button gm-button variant="icon" type="button" [attr.aria-label]="'Confirmar ' + row.folio" title="Confirmar" (click)="confirmar(row)"><gm-icon name="check" [size]="18" /></button>
                  }
                  @if (row.estado !== 'ANULADO') {
                    <button gm-button variant="icon-danger" type="button" [attr.aria-label]="'Anular ' + row.folio" title="Anular" (click)="anular(row)"><gm-icon name="ban" [size]="18" /></button>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
    .toolbar-title { font-weight: var(--gm-weight-semibold); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .sub { display: block; font-size: var(--gm-text-xs); color: var(--gm-ink-faint); }
    tr.anulado td { color: var(--gm-ink-faint); }
  `,
})
export class MovimientosPage {
  private readonly api = inject(MovimientosApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly tamano = TAMANO;
  protected readonly fecha = fechaCorta;
  protected readonly pesos = pesos;
  protected readonly columnas = computed(() => (this.auth.esAdmin() ? 9 : 8));
  protected readonly todos = signal<Movimiento[]>([]);
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO;
    return this.todos().slice(inicio, inicio + TAMANO);
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('creado')) this.mensaje.set({ tone: 'success', texto: `Movimiento ${params.get('creado')} registrado. El stock se actualiza en segundos.` });
    if (params.get('editado')) this.mensaje.set({ tone: 'success', texto: `Movimiento ${params.get('editado')} actualizado. El stock se corrige en segundos.` });
    this.cargar();
  }

  protected tono(m: Movimiento): 'warning' | 'success' | 'danger' {
    return m.estado === 'CONFIRMADO' ? 'success' : m.estado === 'ANULADO' ? 'danger' : 'warning';
  }

  protected confirmar(m: Movimiento): void {
    if (!confirm(`¿Confirmar el movimiento ${m.folio}? Una vez confirmado ya no se podrá editar.`)) return;
    this.ejecutar(this.api.confirmar(m.id), `Movimiento ${m.folio} confirmado.`);
  }

  protected anular(m: Movimiento): void {
    if (!confirm(`¿Anular el movimiento ${m.folio}? Se revertirá su efecto en el stock y no se puede deshacer.`)) return;
    this.ejecutar(this.api.anular(m.id), `Movimiento ${m.folio} anulado. El stock se corrige en segundos.`);
  }

  private ejecutar(accion: Observable<Movimiento>, exito: string): void {
    accion.subscribe({
      next: () => { this.mensaje.set({ tone: 'success', texto: exito }); this.cargar(); },
      error: (err: unknown) => this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }),
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (rows) => { this.todos.set(rows); this.cargando.set(false); },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.cargando.set(false); },
    });
  }
}
