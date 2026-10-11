import { Component, computed, input } from '@angular/core';

/** Familia de íconos de línea (24x24, trazo 2). Ícono nuevo = path nuevo en el mapa, nunca un <svg> suelto. */
export type IconName =
  | 'home' | 'cylinder' | 'swap' | 'users' | 'chart'
  | 'plus' | 'search' | 'pencil' | 'trash' | 'download' | 'logout'
  | 'arrow-in' | 'arrow-out';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cylinder: 'M9 3h6v2.6a6 6 0 0 1 3 5.2V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.2a6 6 0 0 1 3-5.2zM9 3V1.5h6V3',
  swap: 'M7 4v16m0 0-4-4m4 4 4-4M17 20V4m0 0-4 4m4-4 4 4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  chart: 'M3 3v18h18M7 16v-6M12 16V6M17 16v-3',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  pencil: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  download: 'M12 3v12m0 0-4-4m4 4 4-4M4 21h16',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  'arrow-in': 'M12 3v13m0 0-4-4m4 4 4-4M5 21h14',
  'arrow-out': 'M12 21V8m0 0-4 4m4-4 4 4M5 3h14',
};

@Component({
  selector: 'gm-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path [attr.d]="d()" />
    </svg>
  `,
  host: {
    class: 'gm-icon',
    '[style.--gm-icon-size.px]': 'size()',
  },
  styles: `
    :host { display: inline-flex; flex: none; width: var(--gm-icon-size, 20px); height: var(--gm-icon-size, 20px); }
    svg { width: 100%; height: 100%; }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  protected readonly d = computed(() => PATHS[this.name()]);
}
