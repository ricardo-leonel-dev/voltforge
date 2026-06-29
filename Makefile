.PHONY: prepare up down restart logs clean

DB_URL = postgres://postgres:postgres@localhost:5433/proyecto_electrico

# ─────────────────────────────────────────────────────────────────────────────
# Primera vez / después de cambios en el schema:
#   make prepare   → genera backend/.sqlx/ (requiere ~5-10 min la primera vez)
#   make up        → docker compose up --build
# ─────────────────────────────────────────────────────────────────────────────

prepare:
	@echo "==> Iniciando base de datos..."
	docker compose up -d db
	@echo "==> Esperando que Postgres esté listo..."
	@until docker compose exec -T db pg_isready -U postgres -q; do printf '.'; sleep 2; done
	@echo ""
	@echo "==> Generando caché SQLx (esto tarda ~5-10 min la primera vez)..."
	@docker run --rm \
		--network host \
		-v "$$(pwd)/backend:/app" \
		-w /app \
		-e DATABASE_URL=$(DB_URL) \
		rust:1.94-slim-bookworm \
		bash -c "\
			apt-get update -qq && apt-get install -y -qq pkg-config libssl-dev && \
			cargo install sqlx-cli --no-default-features --features rustls,postgres -q && \
			cargo sqlx migrate run && \
			cargo sqlx prepare && \
			echo 'Caché generada en .sqlx/'"
	@echo ""
	@echo "==> Listo. Ahora ejecuta: make up"

up:
	docker compose up --build

down:
	docker compose down

restart:
	docker compose down
	docker compose up --build

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf backend/target
