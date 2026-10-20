import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/api-error';
import { BalonesApi } from '../../core/api/balones.api';
import { Balon } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { conTilde, estadoStock, pesos } from '../../shared/formato';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Search } from '../../shared/ui/search/search';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

/** Catálogo de balones. ADMIN crea, edita y elimina; ALMACEN consulta y registra movimientos. */
@Component({
  selector: 'gm-balones-page',
  imports: [RouterLink, Alert, Button, Icon, PageHeader, Search, TableCard],
  template: `
    <gm-page-header title="Balones"
      [subtitle]="auth.esAdmin() ? 'Administra el catálogo, los precios y el stock' : 'Consulta el stock disponible en el almacén'">
      @if (auth.esAdmin()) {
        <a gm-button routerLink="/app/balones/nuevo"><gm-icon name="plus" [size]="18" />Nuevo balón</a>
      } @else {
        <a gm-button routerLink="/app/movimientos/nuevo"><gm-icon name="swap" [size]="18" />Registrar movimiento</a>
      }
    </gm-page-header>

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [total]="filtrados().length" [pageSize]="tamano" [pagina]="pagina()" (paginaChange)="pagina.set($event)">
      <gm-search toolbar placeholder="Buscar balón" (busqueda)="filtro.set($event); pagina.set(1)" />
      <table class="gm-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th class="cell-right">Precio</th>
            <th class="cell-right">Stock</th>
            @if (auth.esAdmin()) {
              <th class="cell-actions"><span class="sr-only">Acciones</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Sin balones que coincidan</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.codigo }}</td>
              <td class="cell-muted">{{ conTilde(row.nombre) }}</td>
              <td class="cell-num">{{ pesos(row.precio) }}</td>
              <td class="cell-stock">
                <span class="stock__n">{{ row.stock }}</span>
                <span class="stock__state">{{ estadoStock(row) }}</span>
              </td>
              @if (auth.esAdmin()) {
                <td class="cell-actions">
                  <a gm-button variant="icon" [routerLink]="['/app/balones', row.id, 'editar']" [attr.aria-label]="'Editar ' + row.codigo"><gm-icon name="pencil" [size]="18" /></a>
                  <button gm-button variant="icon-danger" type="button" [attr.aria-label]="'Eliminar ' + row.codigo" (click)="eliminar(row)"><gm-icon name="trash" [size]="18" /></button>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
  `,
})
export class BalonesPage {
  private readonly api = inject(BalonesApi);
  protected readonly auth = inject(AuthService);

  protected readonly tamano = TAMANO;
  protected readonly pesos = pesos;
  protected readonly conTilde = conTilde;
  protected readonly estadoStock = estadoStock;
  protected readonly columnas = computed(() => (this.auth.esAdmin() ? 5 : 4));
  protected readonly todos = signal<Balon[]>([]);
  protected readonly filtro = signal('');
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly filtrados = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    return q ? this.todos().filter((b) => b.codigo.toLowerCase().includes(q) || b.nombre.toLowerCase().includes(q)) : this.todos();
  });
  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO;
    return this.filtrados().slice(inicio, inicio + TAMANO);
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (rows) => { this.todos.set(rows); this.cargando.set(false); },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.cargando.set(false); },
    });
  }

  protected eliminar(row: Balon): void {
    if (!confirm(`¿Eliminar el balón ${row.codigo} del catálogo?`)) return;
    this.api.eliminar(row.id).subscribe({
      next: () => { this.mensaje.set({ tone: 'success', texto: `Balón ${row.codigo} eliminado.` }); this.cargar(); },
      error: (err: unknown) => this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }),
    });
  }
}
