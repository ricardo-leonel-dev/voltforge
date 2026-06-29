# ---- Stage 1: Build ----
FROM rust:1.94-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copiar manifiestos primero para cachear compilación de dependencias
COPY Cargo.toml Cargo.lock* ./

# Pre-compilar dependencias con stub main.rs (capa cacheada)
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN SQLX_OFFLINE=true cargo build --release 2>/dev/null || \
    cargo build --release 2>/dev/null || true
RUN rm -f src/main.rs

# Copiar código fuente, migraciones y caché SQLx
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx

# Compilar en modo offline si hay caché, de lo contrario se necesita DATABASE_URL
ENV SQLX_OFFLINE=true
RUN touch src/main.rs && cargo build --release

# ---- Stage 2: Run ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/backend /usr/local/bin/backend

EXPOSE 3000

CMD ["backend"]
