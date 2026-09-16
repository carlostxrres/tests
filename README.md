# Tests de oposiciones

PWA para practicar exámenes de oposiciones por temario. Vite + React 19 + TypeScript, shadcn/ui (Base UI), Tailwind 4, TanStack Query/Table/Form, Supabase (Auth + Postgres con RLS) y Vercel.

La especificación funcional original está en [docs/spec.md](docs/spec.md).

## Arrancar en local

```bash
pnpm install
cp .env.example .env   # y rellena las variables
pnpm dev               # http://localhost:5173
```

Variables de `.env`:

| Variable                    | Uso                                                           |
| --------------------------- | ------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | Frontend                                                      |
| `VITE_SUPABASE_ANON_KEY`    | Frontend                                                      |
| `SUPABASE_URL`              | `pnpm db:seed`                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | `pnpm db:seed` (nunca en el frontend)                         |
| `DIRECT_URL`                | `pnpm db:push` / `pnpm db:types` (conexión directa, 5432)     |

## Base de datos

- Esquema en `supabase/migrations/`. Aplicar con `pnpm db:push`.
- Tipos TypeScript generados con `pnpm db:types` → `src/lib/database.types.ts` (necesita Docker). Las filas de las vistas se declaran a mano en `src/lib/types.ts` porque el generador las marca todas como nullable.
- Banco de preguntas: `pnpm db:seed` carga `sample-tables/{exams,units,questions}.json` (upsert por `id`; se puede relanzar).
- Usuarios: se crean a mano en el dashboard de Supabase (Authentication → Users). No hay registro en la app.

Reglas que viven en la base de datos (RLS + RPCs):

- `exams/units/questions` son globales y de solo lectura.
- `tests` y `submissions` son por usuario.
- Las submissions nunca se borran (solo `reset_user_data()`); "Reempezar" y "Eliminar test" las desvinculan (`test_id = null`).
- Una submission solo se puede modificar mientras su test está abierto y no tiene corrección instantánea.
- `finish_test()` crea submissions con `choice = null` para las preguntas en blanco.

## Scripts

| Script          | Qué hace                                  |
| --------------- | ----------------------------------------- |
| `pnpm dev`      | Servidor de desarrollo                    |
| `pnpm build`    | `tsc -b` + build de producción (con PWA)  |
| `pnpm preview`  | Sirve el build                            |
| `pnpm lint`     | Biome                                     |
| `pnpm format`   | Biome con `--write`                       |
| `pnpm db:push`  | Aplica migraciones                        |
| `pnpm db:types` | Regenera los tipos de Supabase            |
| `pnpm db:seed`  | Carga el banco de preguntas               |

## Deploy (Vercel)

Proyecto Vite estático: `vercel.json` reescribe todas las rutas a `index.html`. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el proyecto de Vercel.

## shadcn

Componentes en `src/components/ui/` (estilo `base-nova`, base color `stone`). Los skills de shadcn están instalados en `.agents/skills/` (`pnpm dlx skills add shadcn/ui`).
