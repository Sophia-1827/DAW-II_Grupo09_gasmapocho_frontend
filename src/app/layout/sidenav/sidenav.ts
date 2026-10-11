import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NAV_ITEMS } from '../../core/navigation';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'gm-sidenav',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <nav aria-label="Navegación principal">
      @for (item of items(); track item.path) {
        <a class="item" [routerLink]="['/app', item.path]" routerLinkActive="is-active" ariaCurrentWhenActive="page">
          <gm-icon [name]="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--gm-space-5) var(--gm-space-4);
      background: var(--gm-surface-card);
      border-right: 1px solid var(--gm-line);
    }
    nav { display: grid; gap: var(--gm-space-1); }
    .item {
      display: flex;
      align-items: center;
      gap: var(--gm-space-3);
      height: var(--gm-control-height);
      padding: 0 var(--gm-space-4);
      border-radius: var(--gm-radius-sm);
      color: var(--gm-ink-muted);
      font-weight: var(--gm-weight-semibold);
      transition: background-color var(--gm-duration) var(--gm-ease), color var(--gm-duration) var(--gm-ease);
    }
    .item:hover { background: var(--gm-surface-subtle); color: var(--gm-ink); text-decoration: none; }
    .item.is-active { background: var(--gm-surface-selected); color: var(--gm-primary); }

    @media (max-width: 1023px) {
      :host { padding: var(--gm-space-2) var(--gm-gutter); border-right: 0; border-bottom: 1px solid var(--gm-line); }
      nav { display: flex; gap: var(--gm-space-2); overflow-x: auto; scrollbar-width: none; }
      nav::-webkit-scrollbar { display: none; }
      .item { flex: none; }
    }
  `,
})
export class Sidenav {
  private readonly auth = inject(AuthService);
  /** Solo los ítems que el rol actual puede abrir. */
  protected readonly items = computed(() => NAV_ITEMS.filter((i) => this.auth.tieneRol(...i.roles)));
}
