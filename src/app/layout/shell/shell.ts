import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { Sidenav } from '../sidenav/sidenav';

/** Estructura compartida por todas las pantallas autenticadas: header, nav, contenido y footer. */
@Component({
  selector: 'gm-shell',
  imports: [RouterOutlet, Header, Sidenav, Footer],
  template: `
    <gm-header class="shell__header" />
    <gm-sidenav class="shell__nav" />
    <main class="shell__main">
      <div class="shell__content">
        <router-outlet />
      </div>
    </main>
    <gm-footer class="shell__footer" />
  `,
  styles: `
    :host {
      display: grid;
      min-height: 100dvh;
      grid-template-columns: var(--gm-sidenav-width) minmax(0, 1fr);
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        'header header'
        'nav main'
        'footer footer';
    }
    /* min-width: 0 evita que el nav horizontal o una tabla ancha estiren la grilla más allá del viewport */
    .shell__header, .shell__nav, .shell__main, .shell__footer { min-width: 0; }
    .shell__header { grid-area: header; }
    .shell__nav { grid-area: nav; }
    .shell__main { grid-area: main; padding: var(--gm-space-6) var(--gm-gutter); min-width: 0; }
    .shell__content { max-width: var(--gm-content-max); }
    .shell__footer { grid-area: footer; }

    @media (max-width: 1023px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          'header'
          'nav'
          'main'
          'footer';
      }
    }
  `,
})
export class Shell {}
