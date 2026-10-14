import { Component, input } from '@angular/core';

/** Etiqueta corta de estado. El tono es semántico (no un color): el significado va también en el texto. */
@Component({
  selector: 'gm-badge',
  template: '<ng-content />',
  host: {
    class: 'gm-badge',
    '[class.gm-badge--success]': 'tone() === "success"',
    '[class.gm-badge--warning]': 'tone() === "warning"',
    '[class.gm-badge--danger]': 'tone() === "danger"',
    '[class.gm-badge--info]': 'tone() === "info"',
  },
  styles: `
    :host {
      display: inline-block;
      padding: 2px var(--gm-space-3);
      border-radius: var(--gm-radius-pill);
      background: var(--gm-surface-subtle);
      color: var(--gm-ink-muted);
      font-size: var(--gm-text-xs);
      font-weight: var(--gm-weight-bold);
      white-space: nowrap;
    }
    :host(.gm-badge--success) { background: var(--gm-success-soft); color: var(--gm-success); }
    :host(.gm-badge--warning) { background: var(--gm-warning-soft); color: var(--gm-warning); }
    :host(.gm-badge--danger) { background: var(--gm-danger-soft); color: var(--gm-danger); }
    :host(.gm-badge--info) { background: var(--gm-info-soft); color: var(--gm-info); }
  `,
})
export class Badge {
  readonly tone = input<'neutral' | 'success' | 'warning' | 'danger' | 'info'>('neutral');
}
