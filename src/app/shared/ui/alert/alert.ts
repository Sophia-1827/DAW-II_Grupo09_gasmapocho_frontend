import { Component, input } from '@angular/core';

/** Mensaje de estado de una pantalla o formulario. El tono es semántico. */
@Component({
  selector: 'gm-alert',
  template: '<ng-content />',
  host: {
    class: 'gm-alert',
    role: 'status',
    '[class.gm-alert--error]': 'tone() === "error"',
    '[class.gm-alert--success]': 'tone() === "success"',
  },
  styles: `
    :host {
      display: block;
      padding: var(--gm-space-3) var(--gm-space-4);
      border-radius: var(--gm-radius-sm);
      border: 1px solid var(--gm-line);
      background: var(--gm-surface-subtle);
      color: var(--gm-ink);
      font-size: var(--gm-text-sm);
    }
    :host(.gm-alert--error) { border-color: var(--gm-danger); background: var(--gm-danger-soft); color: var(--gm-danger); }
    :host(.gm-alert--success) { border-color: var(--gm-success); background: var(--gm-success-soft); color: var(--gm-success); }
  `,
})
export class Alert {
  readonly tone = input<'info' | 'error' | 'success'>('info');
}
