import { Component, computed, inject } from '@angular/core';
import { APP_NAME, APP_VERSION, ROL_LABEL } from '../../core/app-config';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'gm-footer',
  template: `
    <span>{{ appName }} &middot; {{ panel() }} &middot; v{{ version }}</span>
    <span>Inventario de balones de gas</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--gm-space-3);
      padding: var(--gm-space-4) var(--gm-gutter);
      border-top: 1px solid var(--gm-line);
      color: var(--gm-ink-muted);
      font-size: var(--gm-text-sm);
    }
  `,
})
export class Footer {
  private readonly auth = inject(AuthService);
  protected readonly appName = APP_NAME;
  protected readonly version = APP_VERSION;
  protected readonly panel = computed(() => {
    const r = this.auth.rol();
    return r ? `panel de ${ROL_LABEL[r].toLowerCase()}` : 'panel';
  });
}
