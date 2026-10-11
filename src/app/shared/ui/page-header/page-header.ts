import { Component, input } from '@angular/core';

/** Cabecera de toda página: título y subtítulo a la izquierda, acciones a la derecha. */
@Component({
  selector: 'gm-page-header',
  template: `
    <div class="text">
      <h1>{{ title() }}</h1>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--gm-space-4);
      flex-wrap: wrap;
      margin-bottom: var(--gm-space-5);
    }
    .text { display: grid; gap: var(--gm-space-2); }
    h1 { font-size: var(--gm-text-display); font-weight: var(--gm-weight-bold); line-height: var(--gm-leading-tight); }
    p { color: var(--gm-ink-muted); font-size: var(--gm-text-lg); }
    .actions { display: flex; gap: var(--gm-space-3); flex-wrap: wrap; padding-top: var(--gm-space-1); }
    .actions:empty { display: none; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
