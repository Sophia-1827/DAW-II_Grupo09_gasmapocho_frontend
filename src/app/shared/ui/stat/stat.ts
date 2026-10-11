import { Component, input } from '@angular/core';

/** Indicador resumido para el inicio: etiqueta, valor y una nota breve. */
@Component({
  selector: 'gm-stat',
  template: `
    <span class="label">{{ label() }}</span>
    <strong class="value">{{ value() }}</strong>
    @if (hint()) {
      <span class="hint">{{ hint() }}</span>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--gm-space-1);
      padding: var(--gm-space-5);
      background: var(--gm-surface-card);
      border-radius: var(--gm-radius-md);
      box-shadow: var(--gm-shadow-card);
    }
    .label { color: var(--gm-ink-muted); font-size: var(--gm-text-sm); font-weight: var(--gm-weight-semibold); }
    .value { font-family: var(--gm-font-display); font-size: var(--gm-text-display); font-weight: var(--gm-weight-bold); line-height: var(--gm-leading-tight); letter-spacing: var(--gm-tracking-display); }
    .hint { color: var(--gm-ink-muted); font-size: var(--gm-text-sm); }
  `,
})
export class Stat {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input('');
}
