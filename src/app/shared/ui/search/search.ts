import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** Campo de búsqueda de las barras de herramientas. Emite el texto en cada cambio. */
@Component({
  selector: 'gm-search',
  imports: [Icon],
  template: `
    <label>
      <gm-icon name="search" [size]="18" />
      <input type="search" [placeholder]="placeholder()" [attr.aria-label]="placeholder()"
             (input)="busqueda.emit(($any($event.target)).value)" />
    </label>
  `,
  styles: `
    :host { display: block; width: min(100%, 380px); }
    label {
      display: flex;
      align-items: center;
      gap: var(--gm-space-3);
      height: var(--gm-control-height);
      padding: 0 var(--gm-space-4);
      border: 1px solid var(--gm-line-strong);
      border-radius: var(--gm-radius-sm);
      background: var(--gm-surface-subtle);
      color: var(--gm-ink-muted);
      transition: border-color var(--gm-duration) var(--gm-ease), background-color var(--gm-duration) var(--gm-ease);
    }
    label:hover { border-color: var(--gm-ink-muted); }
    label:focus-within { border-color: var(--gm-primary); background: var(--gm-surface-card); }
    input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; color: var(--gm-ink); }
    input::placeholder { color: var(--gm-ink-muted); }
  `,
})
export class Search {
  readonly placeholder = input('Buscar');
  readonly busqueda = output<string>();
}
