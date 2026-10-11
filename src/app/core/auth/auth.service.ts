import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Rol } from '../api/models';

const CLAVE_SESION = 'gm.sesion';

interface Sesion {
  token: string;
  email: string;
  nombre: string;
  rol: Rol;
}

/**
 * Sesión de la app: token JWT + datos del usuario logueado. El rol que trae el token decide
 * qué ve la interfaz; la autorización real la hace ms-usuarios (responde 403 si no alcanza).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sesion = signal<Sesion | null>(leerSesion());

  readonly usuario = computed(() => this.sesion());
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);
  readonly rol = computed<Rol | null>(() => this.sesion()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');

  tieneRol(...roles: readonly Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(tap((r) => this.guardar({ token: r.token, email, nombre: r.nombre, rol: r.rol })));
  }

  logout(): void {
    this.guardar(null);
    this.router.navigateByUrl('/login');
  }

  private guardar(s: Sesion | null): void {
    this.sesion.set(s);
    try {
      if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
      else localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  }
}

function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(CLAVE_SESION);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}
