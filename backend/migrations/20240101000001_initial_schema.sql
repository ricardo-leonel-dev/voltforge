-- ============================================================
-- Migración 1: Schema inicial
-- ============================================================

-- Organizaciones / tenants
CREATE TABLE organizations (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuarios
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    org_id        INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suscripciones (por organización)
CREATE TABLE subscriptions (
    id                  SERIAL PRIMARY KEY,
    org_id              INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan                TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    activated_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    stripe_customer_id  TEXT,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catálogo de tipos de conductor (datos eléctricos)
CREATE TABLE conductor_types (
    id              SERIAL PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    material        TEXT NOT NULL CHECK (material IN ('Aluminium', 'Copper')),
    line_type       TEXT NOT NULL CHECK (line_type IN ('OHL', 'Cable')),
    r_ohm_km        NUMERIC(10,6) NOT NULL,
    x_ohm_km        NUMERIC(10,6) NOT NULL,
    rn_ohm_km       NUMERIC(10,6) NOT NULL DEFAULT 0,
    xn_ohm_km       NUMERIC(10,6) NOT NULL DEFAULT 0,
    rpn_ohm_km      NUMERIC(10,6) NOT NULL DEFAULT 0,
    xpn_ohm_km      NUMERIC(10,6) NOT NULL DEFAULT 0,
    b_us_km         NUMERIC(10,6) NOT NULL DEFAULT 0,
    b0_us_km        NUMERIC(10,6) NOT NULL DEFAULT 0,
    bn_us_km        NUMERIC(10,6) NOT NULL DEFAULT 0,
    bpn_us_km       NUMERIC(10,6) NOT NULL DEFAULT 0,
    i_ground_ka     NUMERIC(10,6) NOT NULL,
    i_air_ka        NUMERIC(10,6) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Programas de destino para plantillas
CREATE TABLE template_programs (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Cálculos guardados
CREATE TABLE calculations (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id              INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inputs              JSONB NOT NULL,
    template_program_id INTEGER NOT NULL REFERENCES template_programs(id),
    result_data         JSONB,
    result_text         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Control de uso semanal (tier gratuito: 2/semana)
CREATE TABLE weekly_usage (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,
    template_count  INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, week_start)
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX idx_users_org_id             ON users(org_id);
CREATE INDEX idx_subscriptions_org_id     ON subscriptions(org_id);
CREATE INDEX idx_calculations_org_id      ON calculations(org_id);
CREATE INDEX idx_calculations_user_id     ON calculations(user_id);
CREATE INDEX idx_calculations_created_at  ON calculations(created_at DESC);
CREATE INDEX idx_weekly_usage_user_week   ON weekly_usage(user_id, week_start);
