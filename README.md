# frontend (Gas Mapocho)

Proyecto generado con [Angular CLI](https://github.com/angular/angular-cli) versión 22.2.1.

**Nota de versiones**: Angular CLI 22 exige Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Si `ng serve`/`ng build` falla con un error de versión, actualiza Node o usa una build portable temporal.

**Contrato con el backend**: el login y el CRUD de usuarios usan `email` (no `username`) y la respuesta de `/api/auth/login` es plana (`{ token, nombre, rol }`, sin envoltorio `usuario`), igual a como responde `ms-usuarios`. `apiUrl` en los `environment.*.ts` apunta al futuro API Gateway (puerto 8080); mientras ese no exista, para probar localmente contra un microservicio suelto hay que apuntarlo temporalmente a su puerto real (p. ej. `8081` para `ms-usuarios`) y no dejar ese cambio commiteado.

## Servidor de desarrollo

Para levantar un servidor de desarrollo local, ejecuta:

```bash
ng serve
```

Con el servidor corriendo, abre el navegador en `http://localhost:4200/`. La aplicación se recarga automáticamente al modificar cualquier archivo fuente.

## Generar código

Angular CLI incluye herramientas de scaffolding. Para generar un nuevo componente:

```bash
ng generate component nombre-del-componente
```

Para ver la lista completa de esquemas disponibles (`components`, `directives`, `pipes`, etc.):

```bash
ng generate --help
```

## Compilación

Para compilar el proyecto:

```bash
ng build
```

Esto compila el proyecto y guarda los artefactos en `dist/`. Por defecto, la build de producción optimiza la aplicación para rendimiento y velocidad.

## Pruebas unitarias

Para correr las pruebas unitarias con [Vitest](https://vitest.dev/):

```bash
ng test
```

## Pruebas end-to-end

Para pruebas end-to-end (e2e):

```bash
ng e2e
```

Angular CLI no trae un framework de e2e por defecto; se puede elegir el que mejor se ajuste.

## Recursos adicionales

Para más información sobre Angular CLI, incluyendo referencia detallada de comandos, visita [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
