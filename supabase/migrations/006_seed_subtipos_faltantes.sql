-- =============================================================
-- 006_seed_subtipos_faltantes.sql
-- Inserta un subtipo genérico "GENERAL" para cada tipo_novedad
-- que no tiene ningún subtipo registrado.
-- Idempotente: ON CONFLICT DO NOTHING sobre subtipo_code único.
-- Rango de códigos: ST077 – ST097
-- =============================================================
-- Tipos afectados (21):
--   T008 ALERTA PERSONA ASOCIADA      → ST077
--   T009 ANIEGOS                      → ST078
--   T010 APOYOS                       → ST079
--   T011 AUXILIO MECANICO             → ST080
--   T016 CONSUMO DE BEBIDAS ALCOHOLICAS → ST081
--   T017 CONSUMO DE DROGAS            → ST082
--   T018 CONTRAVECTORES               → ST083
--   T019 COORDINACION VECINAL         → ST084
--   T020 DAÑOS A LA PROPIEDAD         → ST085
--   T021 DEFENSA CIVIL                → ST086
--   T022 DESAPARICION                 → ST087
--   T023 DISPARO CON ARMA DE FUEGO    → ST088
--   T024 ESTAFAS                      → ST089
--   T025 FISCALIZACION                → ST090
--   T026 GRUPOS DE MANIFESTANTES      → ST091
--   T027 HALLAZGOS EN LA VIA PUBLICA  → ST092
--   T029 HOMOSEXUALES / MERETRICES    → ST093
--   T047 PATRULLAJE INDIVIDUALIZADO PNP → ST094
--   T048 PATRULLAJE INTEGRADO PNP     → ST095
--   T049 PELEA DE ANIMALES EN LA VIA PUBLICA → ST096
--   T051 VIOLENCIA FUTBOL (inactivo)  → ST097
-- =============================================================

INSERT INTO citysecure.subtipos_novedad
    (tipo_novedad_id, subtipo_code, nombre, prioridad,
     requiere_ambulancia, requiere_bomberos, requiere_pnp,
     orden, estado)
VALUES
    -- T008 ALERTA PERSONA ASOCIADA
    (8,  'ST077', 'GENERAL', 'ALTA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T009 ANIEGOS
    (9,  'ST078', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T010 APOYOS
    (10, 'ST079', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T011 AUXILIO MECANICO
    (11, 'ST080', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T016 CONSUMO DE BEBIDAS ALCOHOLICAS
    (16, 'ST081', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T017 CONSUMO DE DROGAS
    (17, 'ST082', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T018 CONTRAVECTORES
    (18, 'ST083', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T019 COORDINACION VECINAL
    (19, 'ST084', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T020 DAÑOS A LA PROPIEDAD
    (20, 'ST085', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T021 DEFENSA CIVIL
    (21, 'ST086', 'GENERAL', 'ALTA',  TRUE,  TRUE,  FALSE, 1, TRUE),
    -- T022 DESAPARICION
    (22, 'ST087', 'GENERAL', 'ALTA',  FALSE, FALSE, TRUE,  1, TRUE),
    -- T023 DISPARO CON ARMA DE FUEGO
    (23, 'ST088', 'GENERAL', 'ALTA',  FALSE, FALSE, TRUE,  1, TRUE),
    -- T024 ESTAFAS
    (24, 'ST089', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T025 FISCALIZACION
    (25, 'ST090', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T026 GRUPOS DE MANIFESTANTES
    (26, 'ST091', 'GENERAL', 'MEDIA', FALSE, FALSE, TRUE,  1, TRUE),
    -- T027 HALLAZGOS EN LA VIA PUBLICA
    (27, 'ST092', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, TRUE),
    -- T029 HOMOSEXUALES / MERETRICES
    (29, 'ST093', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T047 PATRULLAJE INDIVIDUALIZADO PNP
    (33, 'ST094', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T048 PATRULLAJE INTEGRADO PNP
    (34, 'ST095', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T049 PELEA DE ANIMALES EN LA VIA PUBLICA
    (35, 'ST096', 'GENERAL', 'BAJA',  FALSE, FALSE, FALSE, 1, TRUE),
    -- T051 VIOLENCIA FUTBOL (tipo inactivo — subtipo también inactivo)
    (37, 'ST097', 'GENERAL', 'MEDIA', FALSE, FALSE, FALSE, 1, FALSE)
ON CONFLICT (subtipo_code) DO NOTHING;
