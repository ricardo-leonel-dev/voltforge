# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electrical calculations web app (monorepo). Users input electrical parameters (conductor type, voltage, phase config, distance), the app runs calculations, and generates structured output templates for import into desktop engineering software. Starts with DIgSILENT PowerFactory; extensible to PSCAD, ETAP, etc.

Subscription model: free tier (2 templates/week), pro tier (unlimited). Organization-level multitenancy.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Rust + Axum 0.7 + SQLx 0.7 |
| Database | PostgreSQL 16 (local Docker for dev, Supabase for prod) |
| Auth | Custom JWT (jsonwebtoken crate) |
| Frontend | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS 3 + custom shadcn/ui components |
| Containers | Docker + Docker Compose |

## Repository Structure

```
proyecto_electrico/
├── backend/
│   ├── src/
│   │   ├── main.rs              # Entry point, router, migrations on startup
│   │   ├── config.rs            # Config::from_env()
│   │   ├── error.rs             # AppError → IntoResponse
│   │   ├── state.rs             # AppState { db, config, generators }
│   │   ├── auth/                # jwt.rs, extractor.rs (Claims/AdminClaims), password.rs
│   │   ├── templates/           # TemplateGenerator trait + digsilent.rs
│   │   ├── models/              # Domain structs (Serialize + sqlx::FromRow)
│   │   ├── db/                  # SQLx query functions per domain
│   │   ├── handlers/            # Axum handler functions per domain
│   │   └── routes/              # Router construction per domain
│   ├── migrations/              # Numbered SQL migration files
│   ├── .sqlx/                   # Offline query cache — MUST be committed
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── components/ui/       # shadcn/ui components (source files, not a package)
│   │   ├── components/          # App components: Layout, Navbar, UpdateBanner, SubscriptionGate, TemplateDisplay
│   │   ├── pages/               # Route-level pages + pages/admin/
│   │   ├── hooks/               # useAuth, useSubscription, useUpdateNotification
│   │   └── lib/                 # api.ts, types.ts, utils.ts
│   ├── vite.config.ts           # PWA config (registerType: 'prompt') + /api proxy
│   ├── tailwind.config.ts       # Electric dark theme
│   ├── nginx.conf               # SPA routing + /api proxy for prod
│   └── Dockerfile               # Multi-stage: node build → nginx serve
├── docker-compose.yml           # db + backend + frontend
├── .env.example                 # Copy to .env to configure
└── CLAUDE.md
```

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
DATABASE_URL=postgres://postgres:postgres@db:5432/proyecto_electrico
HOST=0.0.0.0
PORT=3000
JWT_SECRET=<min 32 random chars>
VITE_API_URL=http://localhost:3000
```

To use Supabase instead of local Docker, replace `DATABASE_URL` only.

## Commands

### Full local stack (primera vez)

```bash
cp .env.example .env             # Crear archivo de entorno
make prepare                     # Genera backend/.sqlx/ (requiere ~5-10 min)
make up                          # docker compose up --build
```

### Ejecuciones subsecuentes

```bash
make up                          # Build + arrancar todo
make down                        # Parar
make restart                     # Parar + rebuild
make logs                        # Ver logs en vivo
make clean                       # Parar + borrar volumen DB
```

### Comandos directos de docker compose

```bash
docker compose up --build        # Build y arrancar todos los servicios
docker compose up -d             # En segundo plano
docker compose down              # Parar
docker compose down -v           # Parar y borrar volumen DB
```

### Backend (standalone)

```bash
cd backend
cargo run                        # Dev server (requires DB)
cargo build --release
cargo test
cargo clippy -- -D warnings
cargo fmt
```

### Migrations

```bash
cd backend
sqlx migrate run                 # Apply pending migrations
sqlx migrate add <name>          # New migration file
cargo sqlx prepare               # Regenerate .sqlx/ offline cache
```

`.sqlx/` must be committed. The Docker build uses `SQLX_OFFLINE=true`.  
Regenerate after any change to `sqlx::query!` macros.

### Frontend (standalone)

```bash
cd frontend
npm run dev                      # Vite dev server (:5173), proxies /api → :3000
npm run build                    # Production build
npm run lint
```

## First-time Setup

### Prerequisito: `.sqlx/` cache

`SQLX_OFFLINE=true` en el Dockerfile evita conectarse a la DB durante el build Docker. Requiere que el directorio `backend/.sqlx/` tenga los archivos de caché generados por `cargo sqlx prepare`. Para generarlos sin Rust instalado localmente:

```bash
make prepare   # Arranca la DB, aplica migraciones, genera .sqlx/ via Docker
```

Después de esto, haz commit de `backend/.sqlx/` al repositorio y `docker compose up --build` funcionará sin DB durante el build.

### Credenciales superadmin

La migración seed crea una cuenta superadmin:
- **Email**: `admin@electrico.local`
- **Password**: `Admin1234!`

Cambiar esta contraseña inmediatamente en producción. El superadmin activa suscripciones Pro para organizaciones via el panel `/admin`.

## Architecture Notes

### Multitenancy

All domain tables have `org_id INTEGER NOT NULL`. Every query receives `org_id` explicitly from the JWT claims — there is no RLS. The `org_id` in JWT is set at registration and is immutable.

Registration flow:
1. User provides name, email, password, optional `org_name`
2. If no `org_name` → org created as `"{name} personal organization"`
3. Single transaction: create org → create user → create free subscription
4. JWT returned with `{ sub: user_id, org_id, role }`

### Auth

- JWT claims: `sub` (user_id i32), `org_id` (i32), `role` (String), `exp`, `iat`
- `Claims` extractor: `FromRequestParts<AppState>` reads `Authorization: Bearer <token>`
- `AdminClaims` extractor: same but rejects if `role != "superadmin"`
- bcrypt cost=12 for password hashing

### Template generation

`TemplateGenerator` trait in `templates/mod.rs`:
```rust
pub trait TemplateGenerator: Send + Sync {
    fn program_code(&self) -> &str;
    fn generate(&self, input: &CalcInput, conductor: &ConductorType) -> TemplateOutput;
}
```

`DigsilentGenerator` in `templates/digsilent.rs` produces 4 DIgSILENT sections. Adding a new program: implement the trait, register in `main.rs`, insert into `template_programs` table.

Key derived values (from the HTML prototype):
- `R0 = R * 3`, `X0 = X * 3`
- `Lkm = distancia_m / 1000`
- `fases`: ABC→3, AB/AC/BC→2, A/B/C→1
- `neutros`: 3F4C|2F3C|1F2C→1, else→0

### Subscription check (POST /api/calculations)

1. JWT → Claims
2. Find conductor by code (no org_id filter — catalog table)
3. Check active subscription for org (`subscriptions` table)
4. If free plan: BEGIN TX → check `weekly_usage` count ≥ 2 → 429 if over limit → increment count
5. Generate template via registered generator
6. INSERT calculation with org_id + user_id from JWT
7. COMMIT TX → return result

### PWA updates

`vite-plugin-pwa` with `registerType: 'prompt'`. The `useUpdateNotification` hook listens to the SW `updatefound` event. When a new SW is installed in `waiting` state, `UpdateBanner` appears. On click: `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` → `window.location.reload()`. Periodic check every 60 minutes.

### Adding a new calculation type

1. New migration if persisting new data
2. Implement `TemplateGenerator` trait in `backend/src/templates/<name>.rs`
3. Register in `main.rs` generators map
4. Insert into `template_programs` table
5. New page in `frontend/src/pages/` with form
6. Add route in `frontend/src/App.tsx`
