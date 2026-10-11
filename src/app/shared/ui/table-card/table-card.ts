import { Component, booleanAttribute, computed, input, output } from '@angular/core';

/**
 * Tarjeta que envuelve una tabla: barra de herramientas, tabla proyectada y pie con
 * resumen y paginación. La página es 1-based; el padre decide si pagina en cliente o en servidor.
 */
@Component({
  selector: 'gm-table-card',
  template: `
    <div class="toolbar"><ng-content select="[toolbar]" /></div>
    <div class="scroll"><ng-content /></div>
    @if (paged()) {
      <footer>
        <span class="summary">Mostrando {{ desde() }} a {{ hasta() }} de {{ total() }}</span>
        <nav class="pager" aria-label="Paginación">
          <button type="button" class="pager__btn" [disabled]="pagina() <= 1" (click)="ir(pagina() - 1)">Anterior</button>
          @for (p of ventana(); track $index) {
            @if (p === null) {
              <span class="pager__gap" aria-hidden="true">&hellip;</span>
            } @else {
              <button type="button" class="pager__num" [class.is-active]="p === pagina()"
                      [attr.aria-current]="p === pagina() ? 'page' : null" (click)="ir(p)">{{ p }}</button>
            }
          }
          <button type="button" class="pager__btn" [disabled]="pagina() >= totalPaginas()" (click)="ir(pagina() + 1)">Siguiente</button>
        </nav>
      </footer>
    }
  `,
  styleUrl: './table-card.scss',
})
export class TableCard {
  readonly total = input(0);
  readonly pageSize = input(5);
  readonly pagina = input(1);
  readonly paged = input(true, { transform: booleanAttribute });
  readonly paginaChange = output<number>();

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.pageSize() + 1));
  protected readonly hasta = computed(() => Math.min(this.pagina() * this.pageSize(), this.total()));

  /** Ventana de páginas alrededor de la actual; null = salto. */
  protected readonly ventana = computed<(number | null)[]>(() => {
    const n = this.totalPaginas();
    const p = this.pagina();
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const set = new Set<number>([1, 2, n - 1, n, p - 1, p, p + 1].filter((x) => x >= 1 && x <= n));
    const nums = [...set].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    nums.forEach((x, i) => {
      if (i > 0 && x - nums[i - 1] > 1) out.push(null);
      out.push(x);
    });
    return out;
  });

  protected ir(p: number) {
    if (p >= 1 && p <= this.totalPaginas() && p !== this.pagina()) this.paginaChange.emit(p);
  }
}
