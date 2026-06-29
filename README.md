# Calculadora Eléctrica

App web para calcular parámetros de líneas eléctricas y generar plantillas para DIgSILENT PowerFactory (extensible a PSCAD, ETAP, etc.).

**Stack:** Rust + Axum · React + Vite · PostgreSQL · Docker

---

## Requisitos

- Docker + Docker Compose
- Node.js v18+ (solo para desarrollo con hot reload)

---

## Primera vez

```bash
cp .env.example .env          # configurar variables de entorno
make prepare                  # genera caché SQLx (~5-10 min, requiere solo una vez)
make up                       # construye y arranca todo
```

Abre `http://localhost:5173`.

Credenciales superadmin por defecto:
- **Email:** `admin@electrico.local`
- **Password:** `Admin1234!`

> Cambia esta contraseña en producción desde el panel `/admin`.

---

## Desarrollo local

### Modo simple — Todo en Docker

```bash
make up          # arranca los 3 servicios (DB, backend, frontend)
make down        # para todo
make restart     # para + reconstruye todo
make logs        # ver logs en vivo
make clean       # para + elimina volumen de DB
```

Cada cambio de código requiere `make restart`.

### Modo híbrido — Frontend con recarga automática (recomendado)

Permite ver los cambios del frontend en el navegador en menos de 1 segundo sin reconstruir.

**Terminal 1** — DB y backend en Docker:
```bash
docker compose up db backend
```

**Terminal 2** — Frontend con hot reload:
```bash
cd frontend
npm install      # solo la primera vez
npm run dev      # disponible en http://localhost:5173
```

| | Simple (Docker) | Híbrido |
|---|---|---|
| Cambio frontend | `make restart` | Automático (<1 seg) |
| Cambio backend | `make restart` | `docker compose restart backend` |
| Requiere Node local | No | Sí |

---

## Deploy en producción

### Servidor propio (Ubuntu + Docker)

**Setup único:**

```bash
# Clonar el repo en el servidor
git clone <repositorio> /opt/proyecto_electrico
cd /opt/proyecto_electrico
cp .env.example .env
# Editar .env: JWT_SECRET con mínimo 32 caracteres aleatorios, etc.

# Instalar Caddy (reverse proxy + HTTPS automático)
apt install -y caddy
```

Configurar `/etc/caddy/Caddyfile`:
```
tudominio.com {
    reverse_proxy localhost:5173
}
```

```bash
systemctl reload caddy
docker compose up --build -d
```

Caddy obtiene el certificado SSL de Let's Encrypt automáticamente.

**Cada deploy:**
```bash
git pull
docker compose up --build -d
```

Reconstruye y reinicia backend y frontend en ~30 segundos. Con `restart: unless-stopped` en todos los servicios, si un contenedor falla se reinicia automáticamente.

Para reconstruir solo un servicio:
```bash
docker compose up --build -d frontend   # solo frontend
docker compose up --build -d backend    # solo backend
```

### Cloud (Railway, Render, Fly.io)

Ejemplo con Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Incluye PostgreSQL, HTTPS y dominio `*.railway.app`. Costo ~$5/mes.

---

## Estructura del proyecto

```
proyecto_electrico/
├── backend/          # Rust + Axum + SQLx
│   ├── src/
│   ├── migrations/   # Migraciones SQL numeradas
│   └── .sqlx/        # Caché de queries (debe estar en git)
├── frontend/         # React + Vite + Tailwind + shadcn/ui
│   └── src/
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `JWT_SECRET` | Clave secreta JWT (mínimo 32 caracteres) |
| `HOST` | Host de escucha del backend (`0.0.0.0` para Docker) |
| `PORT` | Puerto interno del backend (`3000`) |
| `VITE_API_URL` | URL base de la API (vacío en Docker, usa proxy Vite en dev) |

---

## Migraciones

```bash
cd backend
sqlx migrate run        # aplicar migraciones pendientes
sqlx migrate add nombre # crear nueva migración
cargo sqlx prepare      # regenerar caché .sqlx/ tras cambios en queries
```

Después de regenerar `.sqlx/`, hacer commit del directorio y correr `make up`.
