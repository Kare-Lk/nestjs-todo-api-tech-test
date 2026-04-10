# NestJS Todo API

Prueba técnica de Wited de tareas con autenticación JWT, PostgreSQL, Redis, TypeORM y validaciones con Zod.

## Stack

- NestJS
- PostgreSQL
- Redis
- TypeORM
- JWT
- Zod

## Requisitos

- Docker y Docker Compose
- Node.js 20+ si quieres correr la API fuera de Docker

## Variables de entorno

Crea tu archivo local desde el ejemplo:

```bash
cp .env.example .env
```

Variables disponibles:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_todo_api

JWT_SECRET=supersecret
JWT_EXPIRES_IN=3600

REDIS_HOST=localhost
REDIS_PORT=6379
```

Cuando la API corre dentro de Docker Compose, `DB_HOST` y `REDIS_HOST` se reemplazan automáticamente por `db` y `redis`.

## Levantar Todo Con Docker

Este es el flujo recomendado para una prueba técnica porque no depende de tener PostgreSQL o Redis instalados localmente.

```bash
cp .env.example .env
npm run docker:up
```

La primera vez, o despues de agregar dependencias nuevas, el contenedor `app` ejecuta `npm install` antes de iniciar Nest.

Servicios expuestos por defecto:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

PostgreSQL y Redis quedan sólo dentro de la red Docker. Eso evita errores por puertos ocupados en `5432` o `6379`.

Para apagar el stack:

```bash
npm run docker:down
```

Para borrar también el volumen de PostgreSQL:

```bash
npm run docker:down:v
```

## Desarrollo Local De La API

Si quieres correr Nest en tu máquina pero mantener Postgres y Redis en Docker:

```bash
cp .env.example .env
npm run docker:deps
npm install
npm run start:dev
```

En esta modalidad sí se exponen:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Scripts

```bash
npm run build
npm run docker:up
npm run docker:up:d
npm run docker:down
npm run docker:down:v
npm run docker:deps
npm run docker:deps:down
npx eslint "{src,test}/**/*.ts"
npm run test
npm run test:e2e
```

## Documentacion De La API

La documentacion interactiva esta disponible en Swagger:

- `http://localhost:3000/api/docs`

Desde ahi se pueden consultar y probar los endpoints de la API.

## Notas Técnicas

- `GET /tasks` está paginado.
- El listado de tareas por usuario se cachea en Redis.
- El cache se invalida al crear, actualizar o eliminar tareas.
- El schema se inicializa mediante migraciones TypeORM.
- La paginación de tareas se hace utilizando `skip` y `take` en la consulta de la base de datos. Para casos de uso real, se recomienda utilizar [cursores](https://www.postgresql.org/docs/current/plpgsql-cursors.html) en PostgreSQL.
