-- ============================================================
-- Migración 3: Programas de destino para generación de plantillas
-- Agregar nuevos programas aquí cuando se soporten (PSCAD, ETAP, etc.)
-- ============================================================

INSERT INTO template_programs (code, name, description, active)
VALUES
    ('digsilent', 'DIgSILENT PowerFactory', 'Genera tablas para importar en DIgSILENT PowerFactory', TRUE)
ON CONFLICT (code) DO NOTHING;
