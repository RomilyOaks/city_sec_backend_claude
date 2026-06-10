-- ============================================================
-- SPEC-BILLING-002: Tablas de billing en Supabase PostgreSQL
-- Schema: citysecure
-- Fecha: 2026-06-09
-- ============================================================

-- 1. planes
CREATE TABLE IF NOT EXISTS citysecure.planes (
  id                        SERIAL PRIMARY KEY,
  nombre                    VARCHAR(100) NOT NULL,
  descripcion               TEXT,
  precio_base_mensual       DECIMAL(10,2) NOT NULL,
  moneda                    VARCHAR(3) NOT NULL DEFAULT 'PEN'
                              CHECK (moneda IN ('PEN','USD')),
  max_usuarios              INTEGER,
  max_novedades_mes         INTEGER,
  precio_usuario_extra      DECIMAL(10,2) DEFAULT 0.00,
  precio_novedad_extra_100  DECIMAL(10,2) DEFAULT 0.00,
  features                  JSONB DEFAULT '[]',
  activo                    BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. suscripciones
CREATE TABLE IF NOT EXISTS citysecure.suscripciones (
  id                  SERIAL PRIMARY KEY,
  plan_id             INTEGER NOT NULL,
  estado              VARCHAR(20) NOT NULL DEFAULT 'trial'
                        CHECK (estado IN ('trial','activa','gracia','suspendida','cancelada')),
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE,
  trial_fin           DATE,
  ciclo_facturacion   VARCHAR(10) NOT NULL DEFAULT 'mensual'
                        CHECK (ciclo_facturacion IN ('mensual','anual')),
  dias_gracia         INTEGER NOT NULL DEFAULT 15,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_suscripciones_plan FOREIGN KEY (plan_id) REFERENCES citysecure.planes(id)
);

-- 3. metricas_uso
CREATE TABLE IF NOT EXISTS citysecure.metricas_uso (
  id                          SERIAL PRIMARY KEY,
  suscripcion_id              INTEGER NOT NULL,
  periodo                     DATE NOT NULL,
  usuarios_activos            INTEGER DEFAULT 0,
  novedades_creadas           INTEGER DEFAULT 0,
  costo_base                  DECIMAL(10,2) DEFAULT 0.00,
  costo_excedente_usuarios    DECIMAL(10,2) DEFAULT 0.00,
  costo_excedente_novedades   DECIMAL(10,2) DEFAULT 0.00,
  costo_total                 DECIMAL(10,2) DEFAULT 0.00,
  moneda                      VARCHAR(3) NOT NULL DEFAULT 'PEN'
                                CHECK (moneda IN ('PEN','USD')),
  calculado_at                TIMESTAMPTZ,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_metrica_periodo UNIQUE (suscripcion_id, periodo),
  CONSTRAINT fk_metricas_suscripcion FOREIGN KEY (suscripcion_id)
    REFERENCES citysecure.suscripciones(id)
);

CREATE INDEX IF NOT EXISTS idx_metricas_periodo
  ON citysecure.metricas_uso(periodo DESC);

-- 4. facturas
CREATE TABLE IF NOT EXISTS citysecure.facturas (
  id                  SERIAL PRIMARY KEY,
  suscripcion_id      INTEGER NOT NULL,
  metrica_id          INTEGER,
  numero_factura      VARCHAR(20) NOT NULL UNIQUE,
  periodo             DATE NOT NULL,
  moneda              VARCHAR(3) NOT NULL DEFAULT 'PEN'
                        CHECK (moneda IN ('PEN','USD')),
  tipo_cambio         DECIMAL(10,4),
  monto_base          DECIMAL(10,2) NOT NULL,
  monto_excedente     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  monto_igv           DECIMAL(10,2) NOT NULL,
  monto_total         DECIMAL(10,2) NOT NULL,
  estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente','pagada','vencida','anulada')),
  fecha_emision       DATE NOT NULL,
  fecha_vencimiento   DATE NOT NULL,
  fecha_pago          DATE,
  pdf_url             TEXT,
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_facturas_suscripcion FOREIGN KEY (suscripcion_id)
    REFERENCES citysecure.suscripciones(id),
  CONSTRAINT fk_facturas_metrica FOREIGN KEY (metrica_id)
    REFERENCES citysecure.metricas_uso(id)
);

CREATE INDEX IF NOT EXISTS idx_facturas_estado
  ON citysecure.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_periodo
  ON citysecure.facturas(periodo DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_numero
  ON citysecure.facturas(numero_factura);

-- 5. datos_facturacion
CREATE TABLE IF NOT EXISTS citysecure.datos_facturacion (
  id                    SERIAL PRIMARY KEY,
  razon_social          VARCHAR(200) NOT NULL,
  ruc                   VARCHAR(11) NOT NULL,
  direccion_fiscal      VARCHAR(300),
  ubigeo                VARCHAR(6),
  email_facturacion     VARCHAR(255),
  representante_legal   VARCHAR(200),
  cargo_representante   VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS (Row-Level Security)
-- Tablas de billing son de administración interna — single-tenant.
-- service_role bypasea RLS automáticamente; el cliente anon/público
-- queda sin acceso a estas tablas.
-- ============================================================
ALTER TABLE citysecure.planes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE citysecure.suscripciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE citysecure.metricas_uso      ENABLE ROW LEVEL SECURITY;
ALTER TABLE citysecure.facturas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE citysecure.datos_facturacion ENABLE ROW LEVEL SECURITY;
