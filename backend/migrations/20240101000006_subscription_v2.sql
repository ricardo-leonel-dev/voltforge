-- ============================================================
-- Migración 6: Modelo de suscripción v2
-- ============================================================

-- 1. Ampliar planes: free | basico | pro
ALTER TABLE subscriptions
  DROP CONSTRAINT subscriptions_plan_check,
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'basico', 'pro'));

-- 2. Programa permitido para plan básico (null = sin restricción / pro)
ALTER TABLE subscriptions
  ADD COLUMN program_code TEXT DEFAULT 'digsilent';

-- 3. Tabla de uso diario (reemplaza weekly_usage para el tier gratuito)
CREATE TABLE daily_usage (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id         INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    usage_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    template_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, usage_date)
);
CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, usage_date);

-- 4. HTML de plantilla con placeholders en template_programs
ALTER TABLE template_programs
  ADD COLUMN html_template TEXT;

-- 5. Enriquecer tabla de cálculos
ALTER TABLE calculations
  ADD COLUMN result_html         TEXT,
  ADD COLUMN download_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN parent_calc_id      INTEGER REFERENCES calculations(id) ON DELETE SET NULL;

CREATE INDEX idx_calculations_parent ON calculations(parent_calc_id);
