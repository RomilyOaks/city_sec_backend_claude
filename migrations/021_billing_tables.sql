-- ============================================================
-- SPEC-BILLING-001 — Fase 1: Tablas de billing
-- Archivo: migrations/021_billing_tables.sql
-- Repo:    city_sec_backend_claude (MySQL Railway)
-- Fecha:   2026-06-09
-- ============================================================

-- 4.1 planes
CREATE TABLE IF NOT EXISTS planes (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                    VARCHAR(100) NOT NULL,
  descripcion               TEXT,
  precio_base_mensual       DECIMAL(10,2) NOT NULL,
  moneda                    ENUM('PEN','USD') NOT NULL DEFAULT 'PEN',
  max_usuarios              INT UNSIGNED,              -- NULL = ilimitado
  max_novedades_mes         INT UNSIGNED,              -- NULL = ilimitado
  precio_usuario_extra      DECIMAL(10,2) DEFAULT 0.00,
  precio_novedad_extra_100  DECIMAL(10,2) DEFAULT 0.00,
  features                  TEXT,                      -- JSON string (array de features)
  activo                    TINYINT(1) NOT NULL DEFAULT 1,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4.2 suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id             INT UNSIGNED NOT NULL,
  estado              ENUM('trial','activa','gracia','suspendida','cancelada')
                        NOT NULL DEFAULT 'trial',
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE,                      -- NULL = renovación automática
  trial_fin           DATE,
  ciclo_facturacion   ENUM('mensual','anual') NOT NULL DEFAULT 'mensual',
  dias_gracia         INT UNSIGNED NOT NULL DEFAULT 15,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_suscripciones_plan FOREIGN KEY (plan_id) REFERENCES planes(id)
);

-- 4.3 metricas_uso
CREATE TABLE IF NOT EXISTS metricas_uso (
  id                          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  suscripcion_id              INT UNSIGNED NOT NULL,
  periodo                     DATE NOT NULL,           -- primer día del mes: 2026-06-01
  usuarios_activos            INT UNSIGNED DEFAULT 0,
  novedades_creadas           INT UNSIGNED DEFAULT 0,
  costo_base                  DECIMAL(10,2) DEFAULT 0.00,
  costo_excedente_usuarios    DECIMAL(10,2) DEFAULT 0.00,
  costo_excedente_novedades   DECIMAL(10,2) DEFAULT 0.00,
  costo_total                 DECIMAL(10,2) DEFAULT 0.00,
  moneda                      ENUM('PEN','USD') NOT NULL DEFAULT 'PEN',
  calculado_at                DATETIME,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_metrica_periodo (suscripcion_id, periodo),
  CONSTRAINT fk_metricas_suscripcion FOREIGN KEY (suscripcion_id) REFERENCES suscripciones(id),
  INDEX idx_metricas_periodo (periodo)
);

-- 4.4 facturas
CREATE TABLE IF NOT EXISTS facturas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  suscripcion_id      INT UNSIGNED NOT NULL,
  metrica_id          INT UNSIGNED,
  numero_factura      VARCHAR(20) NOT NULL UNIQUE,  -- F001-00001
  periodo             DATE NOT NULL,
  moneda              ENUM('PEN','USD') NOT NULL DEFAULT 'PEN',
  tipo_cambio         DECIMAL(10,4),               -- tipo de cambio al momento de emisión (si moneda=USD)
  monto_base          DECIMAL(10,2) NOT NULL,
  monto_excedente     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  monto_igv           DECIMAL(10,2) NOT NULL,      -- 18% IGV sobre subtotal
  monto_total         DECIMAL(10,2) NOT NULL,
  estado              ENUM('pendiente','pagada','vencida','anulada')
                        NOT NULL DEFAULT 'pendiente',
  fecha_emision       DATE NOT NULL,
  fecha_vencimiento   DATE NOT NULL,
  fecha_pago          DATE,
  pdf_url             TEXT,                        -- URL pública en Supabase Storage
  notas               TEXT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_facturas_suscripcion FOREIGN KEY (suscripcion_id) REFERENCES suscripciones(id),
  CONSTRAINT fk_facturas_metrica FOREIGN KEY (metrica_id) REFERENCES metricas_uso(id),
  INDEX idx_facturas_estado  (estado),
  INDEX idx_facturas_periodo (periodo),
  INDEX idx_facturas_numero  (numero_factura)
);

-- 4.5 datos_facturacion
CREATE TABLE IF NOT EXISTS datos_facturacion (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razon_social          VARCHAR(200) NOT NULL,
  ruc                   VARCHAR(11) NOT NULL,
  direccion_fiscal      VARCHAR(300),
  ubigeo                VARCHAR(6),
  email_facturacion     VARCHAR(255),
  representante_legal   VARCHAR(200),
  cargo_representante   VARCHAR(100),
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
