import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NAME } from '../../core/app-config';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'gm-header',
  imports: [RouterLink, Button, Icon],
  template: `
    <a class="brand" routerLink="/app/inicio" [attr.aria-label]="appName">
      <img class="brand__logo" src="logo-gasco.webp" alt="Gasco" width="457" height="112" />
    </a>
    <div class="spacer"></div>
    @if (auth.usuario(); as u) {
      <span class="session">{{ u.nombre }} <span class="session__rol">&middot; {{ u.rol }}</span></span>
    }
    <button gm-button variant="ghost" type="button" aria-label="Salir" (click)="auth.logout()">
      <gm-icon name="logout" [size]="18" /><span class="label">Salir</span>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--gm-space-4);
      height: var(--gm-header-height);
      padding: 0 var(--gm-gutter);
      background: var(--gm-surface-card);
      border-bottom: 1px solid var(--gm-line);
    }
    .brand { display: inline-flex; align-items: center; }
    .brand__logo { display: block; height: 32px; width: auto; }
    .spacer { flex: 1; }
    .session { color: var(--gm-ink); font-size: var(--gm-text-sm); font-weight: var(--gm-weight-semibold); }
    .session__rol { color: var(--gm-ink-muted); font-weight: var(--gm-weight-regular); }
    :host { min-width: 0; }
    @media (max-width: 639px) {
      :host { gap: var(--gm-space-3); }
      .brand__logo { height: 26px; }
      .session, .label { display: none; }
    }
  `,
})
export class Header {
  protected readonly appName = APP_NAME;
  protected readonly auth = inject(AuthService);
}
