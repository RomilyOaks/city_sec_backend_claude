-- ============================================================
-- CitySecure — Patch: historial_usuarios.realizado_por nullable
-- Archivo: 007_fix_historial_usuarios_nullable.sql
--
-- PROBLEMA: realizado_por era NOT NULL, pero los hooks afterUpdate
-- de Sequelize pueden no recibir el usuario autenticado (ej. cuando
-- el contexto de auditoría se pasa anidado). Esto causaba que el
-- INSERT en historial_usuarios fallara dentro de la transacción,
-- abortando silenciosamente el COMMIT en PostgreSQL.
--
-- SOLUCIÓN: Hacer realizado_por nullable. El DEFAULT sigue siendo
-- el ID del usuario que hizo el cambio (via código), pero si llega
-- null no explota la transacción.
--
-- Es IDEMPOTENTE: DROP NOT NULL es seguro si ya es nullable.
-- ============================================================

SET search_path TO citysecure;

ALTER TABLE historial_usuarios
  ALTER COLUMN realizado_por DROP NOT NULL;
