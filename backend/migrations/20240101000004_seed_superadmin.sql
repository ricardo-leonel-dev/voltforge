-- ============================================================
-- Migración 4: Superadmin inicial
-- Contraseña por defecto: Admin1234!
-- IMPORTANTE: Cambiar la contraseña inmediatamente en producción.
-- ============================================================

-- Organización del sistema
INSERT INTO organizations (name)
VALUES ('Admin Organization')
ON CONFLICT DO NOTHING;

-- Usuario superadmin (password: Admin1234!)
-- Hash generado con bcrypt cost=12
INSERT INTO users (org_id, email, name, password_hash, role)
SELECT
    o.id,
    'admin@electrico.local',
    'Super Admin',
    '$2b$12$5JfgoxqsmXTb8ofpttXo5eg2vf5QBE3lShRGQM7Aw3DaC1NkYqcAW',
    'superadmin'
FROM organizations o
WHERE o.name = 'Admin Organization'
ON CONFLICT (email) DO NOTHING;

-- Suscripción pro para la org del admin
INSERT INTO subscriptions (org_id, plan, status)
SELECT o.id, 'pro', 'active'
FROM organizations o
WHERE o.name = 'Admin Organization'
ON CONFLICT DO NOTHING;
