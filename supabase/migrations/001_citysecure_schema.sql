-- ============================================================
-- CitySecure Backend — Schema PostgreSQL para Supabase
-- Archivo: 001_citysecure_schema.sql
-- Schema: citysecure (creado manualmente en Supabase antes de ejecutar)
-- Versión de la app: 2.4.0
-- Fecha: 2026-05-28
--
-- INSTRUCCIONES DE EJECUCIÓN:
--   1. Ir al SQL Editor de Supabase
--   2. El schema 'citysecure' ya debe existir (creado manualmente)
--   3. Pegar este archivo completo y ejecutar
--   4. Puede ejecutarse múltiples veces (IF NOT EXISTS en todo)
--
-- NOTAS DE MIGRACIÓN vs MySQL original:
--   - BIGINT / INTEGER en lugar de BIGINT UNSIGNED / INTEGER UNSIGNED
--   - operativos_turno.id → BIGSERIAL (era INTEGER) para alinear con FK de operativos
--   - TEXT / CHECK constraints en lugar de ENUM inline
--   - TIMESTAMPTZ en lugar de DATETIME
--   - JSONB en lugar de JSON
--   - SMALLINT en lugar de TINYINT
--   - SERIAL / BIGSERIAL en lugar de AUTO_INCREMENT
--   - Triggers PL/pgSQL para calles.nombre_completo y direcciones.direccion_completa
--   - FK circulares (vehiculos ↔ personal_seguridad, usuarios ↔ personal)
--     se agregan con ALTER TABLE al final del archivo
-- ============================================================

SET search_path TO citysecure;

-- ============================================================
-- GRUPO 1 — TABLAS SIN DEPENDENCIAS EXTERNAS
-- ============================================================

-- ----------------------------------------------------------
-- ubigeo
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ubigeo (
    ubigeo_code CHAR(6)     NOT NULL,
    departamento VARCHAR(50) NOT NULL,
    provincia    VARCHAR(50) NOT NULL,
    distrito     VARCHAR(50) NOT NULL,
    CONSTRAINT pk_ubigeo PRIMARY KEY (ubigeo_code)
);

-- ----------------------------------------------------------
-- tipos_via
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_via (
    id          SERIAL      NOT NULL,
    codigo      VARCHAR(10) NOT NULL,
    nombre      VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    descripcion TEXT,
    orden       INTEGER     NOT NULL DEFAULT 0,
    estado      SMALLINT    DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  INTEGER,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  INTEGER,
    deleted_at  TIMESTAMPTZ,
    deleted_by  INTEGER,
    CONSTRAINT pk_tipos_via PRIMARY KEY (id),
    CONSTRAINT chk_tipos_via_estado CHECK (estado IN (0, 1))
);

-- ----------------------------------------------------------
-- tipos_vehiculo
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
    id          SERIAL      NOT NULL,
    nombre      VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    prefijo     VARCHAR(20),
    estado      BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  INTEGER,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  INTEGER,
    deleted_at  TIMESTAMPTZ,
    deleted_by  INTEGER,
    CONSTRAINT pk_tipos_vehiculo PRIMARY KEY (id),
    CONSTRAINT uq_tipos_vehiculo_nombre UNIQUE (nombre)
);

-- ----------------------------------------------------------
-- estados_novedad
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_novedad (
    id              SERIAL      NOT NULL,
    nombre          VARCHAR(50) NOT NULL,
    descripcion     VARCHAR(255),
    color_hex       VARCHAR(7)  DEFAULT '#6B7280',
    icono           VARCHAR(50),
    orden           INTEGER     DEFAULT 0,
    es_inicial      BOOLEAN     DEFAULT FALSE,
    es_final        BOOLEAN     DEFAULT FALSE,
    requiere_unidad BOOLEAN     DEFAULT FALSE,
    estado          BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      INTEGER,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INTEGER,
    CONSTRAINT pk_estados_novedad    PRIMARY KEY (id),
    CONSTRAINT uq_estados_novedad_nombre UNIQUE (nombre)
);

-- ----------------------------------------------------------
-- tipos_novedad
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_novedad (
    id              SERIAL       NOT NULL,
    tipo_code       VARCHAR(10)  NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    icono           VARCHAR(50),
    color_hex       VARCHAR(7)   DEFAULT '#6B7280',
    orden           INTEGER      DEFAULT 0,
    requiere_unidad BOOLEAN      DEFAULT TRUE,
    estado          BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      INTEGER,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INTEGER,
    CONSTRAINT pk_tipos_novedad      PRIMARY KEY (id),
    CONSTRAINT uq_tipos_novedad_code UNIQUE (tipo_code)
);

-- ----------------------------------------------------------
-- catalogo_desperfectos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_desperfectos (
    id                          SERIAL       NOT NULL,
    codigo                      VARCHAR(20),
    nombre                      VARCHAR(100) NOT NULL,
    categoria                   VARCHAR(50),
    descripcion                 TEXT,
    prioridad                   VARCHAR(10)  DEFAULT 'MEDIA',
    tiempo_estimado_reparacion  INTEGER,
    activo                      BOOLEAN      DEFAULT TRUE,
    estado                      BOOLEAN      DEFAULT TRUE,
    deleted_at                  TIMESTAMPTZ,
    deleted_by                  INTEGER,
    created_by                  INTEGER,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by                  INTEGER,
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_catalogo_desperfectos PRIMARY KEY (id),
    CONSTRAINT chk_catalogo_prioridad   CHECK (prioridad IN ('ALTA','MEDIA','BAJA') OR prioridad IS NULL)
);

-- ----------------------------------------------------------
-- estados_operativo_recurso
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS estados_operativo_recurso (
    id          SERIAL      NOT NULL,
    codigo      VARCHAR(10) NOT NULL,
    descripcion VARCHAR(35) NOT NULL,
    estado      SMALLINT    DEFAULT 1,
    created_by  INTEGER,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  INTEGER,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_by  INTEGER,
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT pk_estados_operativo_recurso      PRIMARY KEY (id),
    CONSTRAINT uq_estados_operativo_recurso_cod  UNIQUE (codigo)
);

-- ----------------------------------------------------------
-- tipos_copiloto
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_copiloto (
    id          SERIAL      NOT NULL,
    codigo      VARCHAR(10) NOT NULL,
    descripcion VARCHAR(35) NOT NULL,
    estado      SMALLINT    DEFAULT 1,
    created_by  INTEGER,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  INTEGER,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_by  INTEGER,
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT pk_tipos_copiloto     PRIMARY KEY (id),
    CONSTRAINT uq_tipos_copiloto_cod UNIQUE (codigo)
);

-- ----------------------------------------------------------
-- cargos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cargos (
    id               SERIAL       NOT NULL,
    nombre           VARCHAR(100) NOT NULL,
    descripcion      TEXT,
    nivel_jerarquico INTEGER      NOT NULL DEFAULT 5,
    categoria        VARCHAR(20)  NOT NULL DEFAULT 'Operativo',
    requiere_licencia BOOLEAN     DEFAULT FALSE,
    salario_base     NUMERIC(10,2),
    codigo           VARCHAR(20),
    color            VARCHAR(7)   DEFAULT '#6B7280',
    estado           BOOLEAN      DEFAULT TRUE,
    deleted_at       TIMESTAMPTZ,
    deleted_by       INTEGER,
    created_by       INTEGER,
    updated_by       INTEGER,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cargos          PRIMARY KEY (id),
    CONSTRAINT uq_cargo_nombre    UNIQUE (nombre),
    CONSTRAINT uq_cargo_codigo    UNIQUE (codigo),
    CONSTRAINT chk_cargo_categoria CHECK (categoria IN
        ('Alcalde','Gerente','Directivo','Jefatura','Supervisión','Operativo','Administrativo','Apoyo'))
);

-- ----------------------------------------------------------
-- roles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id              SERIAL      NOT NULL,
    nombre          VARCHAR(50) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    descripcion     TEXT,
    nivel_jerarquia INTEGER     DEFAULT 0,
    es_sistema      BOOLEAN     DEFAULT FALSE,
    color           VARCHAR(7)  DEFAULT '#6B7280',
    estado          BOOLEAN     DEFAULT TRUE,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INTEGER,
    created_by      INTEGER,
    updated_by      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_roles      PRIMARY KEY (id),
    CONSTRAINT uq_roles_slug UNIQUE (slug)
);

-- ----------------------------------------------------------
-- permisos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
    id          SERIAL       NOT NULL,
    modulo      VARCHAR(50)  NOT NULL,
    recurso     VARCHAR(50)  NOT NULL,
    accion      VARCHAR(30)  NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_sistema  BOOLEAN      DEFAULT FALSE,
    estado      BOOLEAN      DEFAULT TRUE,
    created_by  INTEGER,
    updated_by  INTEGER,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_permisos             PRIMARY KEY (id),
    CONSTRAINT uq_permisos_slug        UNIQUE (slug),
    CONSTRAINT uq_permisos_mod_rec_acc UNIQUE (modulo, recurso, accion)
);

-- ============================================================
-- GRUPO 2 — DEPENDEN SÓLO DEL GRUPO 1
-- ============================================================

-- ----------------------------------------------------------
-- subtipos_novedad
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtipos_novedad (
    id                  SERIAL       NOT NULL,
    tipo_novedad_id     INTEGER      NOT NULL,
    subtipo_code        VARCHAR(10)  NOT NULL,
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    prioridad           VARCHAR(10)  NOT NULL DEFAULT 'MEDIA',
    tiempo_respuesta_min INTEGER,
    requiere_ambulancia BOOLEAN      DEFAULT FALSE,
    requiere_bomberos   BOOLEAN      DEFAULT FALSE,
    requiere_pnp        BOOLEAN      DEFAULT FALSE,
    orden               INTEGER      DEFAULT 0,
    estado              BOOLEAN      DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          INTEGER,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by          INTEGER,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INTEGER,
    CONSTRAINT pk_subtipos_novedad      PRIMARY KEY (id),
    CONSTRAINT uq_subtipos_novedad_code UNIQUE (subtipo_code),
    CONSTRAINT fk_subtipo_tipo          FOREIGN KEY (tipo_novedad_id) REFERENCES tipos_novedad(id),
    CONSTRAINT chk_subtipo_prioridad    CHECK (prioridad IN ('ALTA','MEDIA','BAJA'))
);

-- ----------------------------------------------------------
-- unidades_oficina
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS unidades_oficina (
    id               SERIAL       NOT NULL,
    codigo           VARCHAR(20),
    nombre           VARCHAR(100) NOT NULL,
    tipo_unidad      VARCHAR(15)  NOT NULL,
    telefono         VARCHAR(20),
    email            VARCHAR(100),
    direccion        VARCHAR(255),
    ubigeo           CHAR(6),
    latitud          NUMERIC(10,8),
    longitud         NUMERIC(11,8),
    radio_cobertura_km NUMERIC(5,2),
    activo_24h       BOOLEAN      DEFAULT TRUE,
    horario_inicio   TIME,
    horario_fin      TIME,
    estado           BOOLEAN      DEFAULT TRUE,
    deleted_at       TIMESTAMPTZ,
    created_by       INTEGER,
    updated_by       INTEGER,
    deleted_by       INTEGER,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_unidades_oficina       PRIMARY KEY (id),
    CONSTRAINT uq_unidades_oficina_cod   UNIQUE (codigo),
    CONSTRAINT fk_unidades_ubigeo        FOREIGN KEY (ubigeo) REFERENCES ubigeo(ubigeo_code),
    CONSTRAINT chk_unidades_tipo         CHECK (tipo_unidad IN
        ('SERENAZGO','PNP','BOMBEROS','AMBULANCIA','DEFENSA_CIVIL','TRANSITO','OTROS'))
);

-- ----------------------------------------------------------
-- rol_permisos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permisos (
    id          SERIAL      NOT NULL,
    rol_id      INTEGER     NOT NULL,
    permiso_id  INTEGER     NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  INTEGER,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  INTEGER,
    CONSTRAINT pk_rol_permisos     PRIMARY KEY (id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id)     REFERENCES roles(id),
    CONSTRAINT fk_rol_permisos_per FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- ============================================================
-- GRUPO 3 — TABLAS CON DEPENDENCIAS CIRCULARES
--           FK circulares se agregan al FINAL con ALTER TABLE
-- ============================================================

-- ----------------------------------------------------------
-- personal_seguridad
-- (vehiculo_id FK se agrega después — circular con vehiculos)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS personal_seguridad (
    id               SERIAL      NOT NULL,
    doc_tipo         VARCHAR(20) NOT NULL DEFAULT 'DNI',
    doc_numero       VARCHAR(20) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NOT NULL,
    nombres          VARCHAR(50) NOT NULL,
    sexo             VARCHAR(15),
    fecha_nacimiento DATE,
    nacionalidad     VARCHAR(50) DEFAULT 'Peruana',
    direccion        VARCHAR(150),
    ubigeo_code      CHAR(6),
    cargo_id         INTEGER,
    fecha_ingreso    DATE,
    fecha_baja       DATE,
    status           VARCHAR(15) NOT NULL DEFAULT 'Activo',
    regimen          VARCHAR(20),
    licencia         VARCHAR(20),
    categoria        VARCHAR(20),
    vigencia         DATE,
    vehiculo_id      INTEGER,    -- FK circular → vehiculos, se agrega después
    codigo_acceso    VARCHAR(45),
    foto             VARCHAR(255),
    estado           BOOLEAN     DEFAULT TRUE,
    deleted_at       TIMESTAMPTZ,
    deleted_by       INTEGER,
    created_by       INTEGER,
    updated_by       INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_personal_seguridad         PRIMARY KEY (id),
    CONSTRAINT uq_personal_doc               UNIQUE (doc_tipo, doc_numero),
    CONSTRAINT uq_personal_licencia          UNIQUE (licencia),
    CONSTRAINT uq_personal_codigo_acceso     UNIQUE (codigo_acceso),
    CONSTRAINT fk_personal_ubigeo            FOREIGN KEY (ubigeo_code) REFERENCES ubigeo(ubigeo_code),
    CONSTRAINT fk_personal_cargo             FOREIGN KEY (cargo_id)    REFERENCES cargos(id),
    CONSTRAINT chk_personal_doc_tipo         CHECK (doc_tipo IN ('DNI','Carnet Extranjeria','Pasaporte','PTP')),
    CONSTRAINT chk_personal_sexo             CHECK (sexo IN ('Masculino','Femenino') OR sexo IS NULL),
    CONSTRAINT chk_personal_status           CHECK (status IN ('Activo','Inactivo','Suspendido','Retirado')),
    CONSTRAINT chk_personal_regimen          CHECK (regimen IN ('256','276','728','1057 CAS','Orden Servicio','Practicante') OR regimen IS NULL)
);

-- ----------------------------------------------------------
-- sectores
-- (supervisor_id FK se agrega después — circular)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sectores (
    id          SERIAL       NOT NULL,
    sector_code VARCHAR(10)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ubigeo      CHAR(6),
    zona_code   VARCHAR(20),
    supervisor_id INTEGER,    -- FK circular → personal_seguridad, se agrega después
    poligono_json JSONB,
    color_mapa  VARCHAR(7)   DEFAULT '#3B82F6',
    estado      BOOLEAN      DEFAULT TRUE,
    deleted_at  TIMESTAMPTZ,
    deleted_by  INTEGER,
    created_by  INTEGER,
    updated_by  INTEGER,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_sectores           PRIMARY KEY (id),
    CONSTRAINT uq_sectores_code      UNIQUE (sector_code),
    CONSTRAINT fk_sectores_ubigeo    FOREIGN KEY (ubigeo) REFERENCES ubigeo(ubigeo_code)
);

-- ----------------------------------------------------------
-- talleres
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS talleres (
    id              SERIAL       NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    ruc             VARCHAR(11)  NOT NULL,
    direccion       VARCHAR(255),
    telefono        VARCHAR(30),
    email           VARCHAR(150),
    contacto_nombre VARCHAR(150),
    estado          SMALLINT     NOT NULL DEFAULT 1,
    deleted_at      TIMESTAMPTZ,
    deleted_by      INTEGER,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      INTEGER,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      INTEGER,
    CONSTRAINT pk_talleres     PRIMARY KEY (id),
    CONSTRAINT uq_talleres_ruc UNIQUE (ruc)
);

-- ----------------------------------------------------------
-- usuarios
-- (personal_seguridad_id FK se agrega después — circular)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id                        SERIAL       NOT NULL,
    username                  VARCHAR(50)  NOT NULL,
    email                     VARCHAR(100) NOT NULL,
    email_verified_at         TIMESTAMPTZ,
    password_hash             VARCHAR(255) NOT NULL,
    password_changed_at       TIMESTAMPTZ,
    require_password_change   BOOLEAN      DEFAULT FALSE,
    personal_seguridad_id     INTEGER,     -- FK circular, se agrega después
    nombres                   VARCHAR(100),
    apellidos                 VARCHAR(100),
    telefono                  VARCHAR(20),
    foto_perfil               VARCHAR(255),
    oauth_provider            VARCHAR(15)  DEFAULT 'LOCAL',
    oauth_id                  VARCHAR(255),
    oauth_token               TEXT,
    oauth_refresh_token       TEXT,
    last_login_at             TIMESTAMPTZ,
    last_login_ip             VARCHAR(45),
    last_activity_at          TIMESTAMPTZ,
    failed_login_attempts     INTEGER      DEFAULT 0,
    locked_until              TIMESTAMPTZ,
    bloqueos_acumulados       INTEGER      DEFAULT 0,
    two_factor_enabled        BOOLEAN      DEFAULT FALSE,
    two_factor_secret         VARCHAR(255),
    two_factor_recovery_codes JSONB,
    estado                    VARCHAR(15)  DEFAULT 'PENDIENTE',
    deleted_at                TIMESTAMPTZ,
    deleted_by                INTEGER,
    created_by                INTEGER,
    updated_by                INTEGER,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_usuarios          PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT uq_usuarios_email    UNIQUE (email),
    CONSTRAINT chk_usuarios_oauth   CHECK (oauth_provider IN ('LOCAL','GOOGLE','MICROSOFT','AZURE_AD','GITHUB')),
    CONSTRAINT chk_usuarios_estado  CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO','PENDIENTE'))
);

-- ----------------------------------------------------------
-- vehiculos
-- (conductor_asignado_id FK se agrega después — circular)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehiculos (
    id                   SERIAL      NOT NULL,
    tipo_id              INTEGER     NOT NULL,
    codigo_vehiculo      VARCHAR(10),
    nombre               VARCHAR(100),
    placa                VARCHAR(20) NOT NULL,
    marca                VARCHAR(50),
    modelo_vehiculo      VARCHAR(50),
    anio_vehiculo        INTEGER,
    color_vehiculo       VARCHAR(30),
    numero_motor         VARCHAR(50),
    numero_chasis        VARCHAR(50),
    kilometraje_inicial  INTEGER     DEFAULT 0,
    kilometraje_actual   INTEGER     DEFAULT 0,
    capacidad_combustible NUMERIC(5,2),
    unidad_oficina_id    INTEGER     NOT NULL,
    conductor_asignado_id INTEGER,   -- FK circular, se agrega después
    estado_operativo     VARCHAR(25) NOT NULL DEFAULT 'DISPONIBLE',
    soat                 VARCHAR(50),
    fec_soat             DATE,
    fec_manten           DATE,
    observaciones        TEXT,
    estado               SMALLINT    DEFAULT 1,
    deleted_at           TIMESTAMPTZ,
    deleted_by           INTEGER,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by           INTEGER,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by           INTEGER,
    CONSTRAINT pk_vehiculos               PRIMARY KEY (id),
    CONSTRAINT uq_vehiculos_codigo        UNIQUE (codigo_vehiculo),
    CONSTRAINT uq_vehiculos_placa         UNIQUE (placa),
    CONSTRAINT fk_vehiculos_tipo          FOREIGN KEY (tipo_id)          REFERENCES tipos_vehiculo(id),
    CONSTRAINT fk_vehiculos_unidad        FOREIGN KEY (unidad_oficina_id) REFERENCES unidades_oficina(id),
    CONSTRAINT chk_vehiculos_estado_oper  CHECK (estado_operativo IN
        ('DISPONIBLE','EN_SERVICIO','MANTENIMIENTO','REPARACION','FUERA_DE_SERVICIO','INACTIVO'))
);

-- ============================================================
-- GRUPO 4 — DEPENDEN DE GRUPO 3
-- ============================================================

-- ----------------------------------------------------------
-- subsectores
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subsectores (
    id                    SERIAL      NOT NULL,
    subsector_code        VARCHAR(10) NOT NULL,
    nombre                VARCHAR(50) NOT NULL,
    sector_id             INTEGER     NOT NULL,
    personal_supervisor_id INTEGER,
    referencia            TEXT,
    poligono_json         JSONB,
    radio_metros          INTEGER,
    color_mapa            VARCHAR(7)  DEFAULT '#10B981',
    estado                SMALLINT    DEFAULT 1,
    deleted_at            TIMESTAMPTZ,
    deleted_by            INTEGER,
    created_by            INTEGER,
    updated_by            INTEGER,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_subsectores     PRIMARY KEY (id),
    CONSTRAINT uq_subsectores_cod UNIQUE (subsector_code),
    CONSTRAINT fk_subsectores_sector   FOREIGN KEY (sector_id) REFERENCES sectores(id),
    CONSTRAINT fk_subsectores_super    FOREIGN KEY (personal_supervisor_id) REFERENCES personal_seguridad(id)
);

-- ----------------------------------------------------------
-- cuadrantes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuadrantes (
    id                    SERIAL      NOT NULL,
    cuadrante_code        VARCHAR(10) NOT NULL,
    nombre                VARCHAR(100) NOT NULL,
    sector_id             INTEGER     NOT NULL,
    subsector_id          INTEGER     NOT NULL,
    zona_code             VARCHAR(20),
    personal_supervisor_id INTEGER,
    referencia            TEXT,
    latitud               NUMERIC(10,8),
    longitud              NUMERIC(11,8),
    poligono_json         JSONB,
    radio_metros          INTEGER,
    color_mapa            VARCHAR(7)  DEFAULT '#10B981',
    estado                BOOLEAN     DEFAULT TRUE,
    deleted_at            TIMESTAMPTZ,
    deleted_by            INTEGER,
    created_by            INTEGER,
    updated_by            INTEGER,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cuadrantes     PRIMARY KEY (id),
    CONSTRAINT uq_cuadrantes_cod UNIQUE (cuadrante_code),
    CONSTRAINT fk_cuadrantes_sector  FOREIGN KEY (sector_id)   REFERENCES sectores(id),
    CONSTRAINT fk_cuadrantes_subsect FOREIGN KEY (subsector_id) REFERENCES subsectores(id),
    CONSTRAINT fk_cuadrantes_super   FOREIGN KEY (personal_supervisor_id) REFERENCES personal_seguridad(id)
);

-- ----------------------------------------------------------
-- calles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS calles (
    id                  SERIAL       NOT NULL,
    calle_code          VARCHAR(20)  NOT NULL,
    tipo_via_id         INTEGER      NOT NULL,
    nombre_via          VARCHAR(200) NOT NULL,
    nombre_completo     VARCHAR(250),   -- generado por trigger
    nombre_anterior     VARCHAR(250),
    ubigeo_code         CHAR(6),
    urbanizacion        VARCHAR(150),
    zona                VARCHAR(100),
    longitud_metros     NUMERIC(8,2),
    ancho_metros        NUMERIC(5,2),
    tipo_pavimento      VARCHAR(15),
    sentido_via         VARCHAR(10)  DEFAULT 'DOBLE_VIA',
    carriles            SMALLINT,
    interseccion_inicio VARCHAR(200),
    interseccion_fin    VARCHAR(200),
    linea_geometria_json JSONB,
    observaciones       TEXT,
    es_principal        SMALLINT     DEFAULT 0,
    categoria_via       VARCHAR(15)  DEFAULT 'LOCAL',
    estado              SMALLINT     DEFAULT 1,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by          INTEGER,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by          INTEGER,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INTEGER,
    CONSTRAINT pk_calles                 PRIMARY KEY (id),
    CONSTRAINT uq_calle_code             UNIQUE (calle_code),
    CONSTRAINT uq_tipo_nombre_via        UNIQUE (tipo_via_id, nombre_via, urbanizacion),
    CONSTRAINT fk_calles_tipo_via        FOREIGN KEY (tipo_via_id)   REFERENCES tipos_via(id),
    CONSTRAINT fk_calles_ubigeo          FOREIGN KEY (ubigeo_code)   REFERENCES ubigeo(ubigeo_code),
    CONSTRAINT chk_calles_pavimento      CHECK (tipo_pavimento IN
        ('ASFALTO','CONCRETO','AFIRMADO','TROCHA','ADOQUIN','SIN_PAVIMENTO') OR tipo_pavimento IS NULL),
    CONSTRAINT chk_calles_sentido        CHECK (sentido_via IN ('UNA_VIA','DOBLE_VIA','VARIABLE')),
    CONSTRAINT chk_calles_categoria      CHECK (categoria_via IN ('ARTERIAL','COLECTORA','LOCAL','RESIDENCIAL')),
    CONSTRAINT chk_calles_es_principal   CHECK (es_principal IN (0, 1)),
    CONSTRAINT chk_calles_estado         CHECK (estado IN (0, 1))
);

-- ----------------------------------------------------------
-- historial_usuarios
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_usuarios (
    id               SERIAL       NOT NULL,
    usuario_id       INTEGER      NOT NULL,
    accion           VARCHAR(30)  NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior   TEXT,
    valor_nuevo      TEXT,
    descripcion      TEXT,
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(500),
    realizado_por    INTEGER      NOT NULL,
    fecha_hora       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_historial_usuarios PRIMARY KEY (id),
    CONSTRAINT fk_historial_usuario  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id),
    CONSTRAINT fk_historial_realizado FOREIGN KEY (realizado_por) REFERENCES usuarios(id),
    CONSTRAINT chk_historial_accion  CHECK (accion IN (
        'creacion','actualizacion','cambio_password','cambio_estado',
        'asignacion_rol','revocacion_rol','asignacion_permiso','revocacion_permiso',
        'eliminacion','restauracion'))
);

-- ----------------------------------------------------------
-- password_historial
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_historial (
    id            SERIAL       NOT NULL,
    usuario_id    INTEGER      NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_password_historial PRIMARY KEY (id)
);

-- ----------------------------------------------------------
-- password_resets
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id          SERIAL       NOT NULL,
    email       VARCHAR(100) NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_password_resets PRIMARY KEY (id)
);

-- ----------------------------------------------------------
-- email_verifications
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
    id          SERIAL       NOT NULL,
    usuario_id  INTEGER      NOT NULL,
    email       VARCHAR(100) NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_email_verifications PRIMARY KEY (id)
);

-- ----------------------------------------------------------
-- sesiones
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id               SERIAL       NOT NULL,
    usuario_id       INTEGER      NOT NULL,
    session_id       VARCHAR(255) NOT NULL,
    ip_address       VARCHAR(45),
    user_agent       VARCHAR(500),
    device_name      VARCHAR(100),
    device_type      VARCHAR(10)  DEFAULT 'OTHER',
    browser          VARCHAR(50),
    os               VARCHAR(50),
    location_country VARCHAR(50),
    location_city    VARCHAR(100),
    last_activity    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ  NOT NULL,
    is_current       SMALLINT     DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_sesiones          PRIMARY KEY (id),
    CONSTRAINT chk_sesiones_device  CHECK (device_type IN ('DESKTOP','MOBILE','TABLET','OTHER') OR device_type IS NULL)
);

-- ----------------------------------------------------------
-- tokens_acceso
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens_acceso (
    id                 SERIAL       NOT NULL,
    usuario_id         INTEGER      NOT NULL,
    token_type         VARCHAR(10)  DEFAULT 'ACCESS',
    token_hash         VARCHAR(255) NOT NULL,
    jti                VARCHAR(64)  NOT NULL,
    client_ip          VARCHAR(45),
    user_agent         VARCHAR(255),
    scopes             JSONB,
    expires_at         TIMESTAMPTZ  NOT NULL,
    revoked_at         TIMESTAMPTZ,
    revoked_by         INTEGER,
    revocation_reason  VARCHAR(255),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_tokens_acceso      PRIMARY KEY (id),
    CONSTRAINT chk_tokens_type       CHECK (token_type IN ('ACCESS','REFRESH') OR token_type IS NULL)
);

-- ----------------------------------------------------------
-- login_intentos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_intentos (
    id                  BIGSERIAL    NOT NULL,
    usuario_id          INTEGER,
    username_or_email   VARCHAR(100) NOT NULL,
    ip_address          VARCHAR(45)  NOT NULL,
    user_agent          VARCHAR(255),
    intento_exitoso     SMALLINT     DEFAULT 0,
    razon_fallo         VARCHAR(255),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_login_intentos PRIMARY KEY (id)
);

-- ----------------------------------------------------------
-- rol_estados_novedad
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_estados_novedad (
    id               SERIAL      NOT NULL,
    rol_id           INTEGER     NOT NULL,
    estado_novedad_id INTEGER    NOT NULL,
    descripcion      TEXT,
    observaciones    TEXT,
    estado           SMALLINT    NOT NULL DEFAULT 1,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       INTEGER     NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by       INTEGER,
    deleted_by       INTEGER,
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT pk_rol_estados_novedad       PRIMARY KEY (id),
    CONSTRAINT uq_rol_estados               UNIQUE (rol_id, estado_novedad_id),
    CONSTRAINT fk_rol_estados_rol           FOREIGN KEY (rol_id)            REFERENCES roles(id),
    CONSTRAINT fk_rol_estados_estado_novedad FOREIGN KEY (estado_novedad_id) REFERENCES estados_novedad(id)
);

-- ----------------------------------------------------------
-- usuario_roles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_roles (
    id               SERIAL      NOT NULL,
    usuario_id       INTEGER     NOT NULL,
    rol_id           INTEGER     NOT NULL,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ,
    asignado_por     INTEGER,
    estado           SMALLINT    NOT NULL DEFAULT 1,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       INTEGER,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by       INTEGER,
    deleted_at       TIMESTAMPTZ,
    deleted_by       INTEGER,
    CONSTRAINT pk_usuario_roles      PRIMARY KEY (id),
    CONSTRAINT uq_usuario_rol        UNIQUE (usuario_id, rol_id),
    CONSTRAINT fk_usuario_roles_user FOREIGN KEY (usuario_id)   REFERENCES usuarios(id),
    CONSTRAINT fk_usuario_roles_rol  FOREIGN KEY (rol_id)       REFERENCES roles(id),
    CONSTRAINT fk_usuario_roles_por  FOREIGN KEY (asignado_por) REFERENCES usuarios(id)
);

-- ----------------------------------------------------------
-- usuario_permisos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_permisos (
    id               SERIAL      NOT NULL,
    usuario_id       INTEGER     NOT NULL,
    permiso_id       INTEGER     NOT NULL,
    tipo             VARCHAR(10) DEFAULT 'CONCEDER',
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ,
    asignado_por     INTEGER,
    motivo           TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       INTEGER,
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_by       INTEGER,
    CONSTRAINT pk_usuario_permisos     PRIMARY KEY (id),
    CONSTRAINT chk_usuario_permisos_tipo CHECK (tipo IN ('CONCEDER','DENEGAR') OR tipo IS NULL)
);

-- ----------------------------------------------------------
-- radios_tetra
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS radios_tetra (
    id                    SERIAL      NOT NULL,
    radio_tetra_code      VARCHAR(10),
    descripcion           VARCHAR(50),
    personal_seguridad_id INTEGER,
    fecha_fabricacion     DATE,
    estado                BOOLEAN     DEFAULT TRUE,
    created_by            INTEGER,
    updated_by            INTEGER,
    deleted_by            INTEGER,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ,
    CONSTRAINT pk_radios_tetra     PRIMARY KEY (id),
    CONSTRAINT uq_radios_tetra_cod UNIQUE (radio_tetra_code),
    CONSTRAINT fk_radios_personal  FOREIGN KEY (personal_seguridad_id) REFERENCES personal_seguridad(id)
);

-- ----------------------------------------------------------
-- horarios_turnos
-- (PK es la columna turno, sin columna id)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_turnos (
    turno            VARCHAR(10)  NOT NULL,
    hora_inicio      TIME         NOT NULL,
    hora_fin         TIME         NOT NULL,
    cruza_medianoche SMALLINT     DEFAULT 0,
    nro_orden        INTEGER,
    estado           SMALLINT     DEFAULT 1,
    created_by       INTEGER,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by       INTEGER,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_by       INTEGER,
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT pk_horarios_turnos     PRIMARY KEY (turno),
    CONSTRAINT chk_horarios_turno     CHECK (turno IN ('MAÑANA','TARDE','NOCHE')),
    CONSTRAINT chk_horarios_cruce     CHECK (cruza_medianoche IN (0, 1))
);

-- ============================================================
-- GRUPO 5 — DEPENDEN DE GRUPOS 3-4
-- ============================================================

-- ----------------------------------------------------------
-- calles_cuadrantes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS calles_cuadrantes (
    id                   SERIAL      NOT NULL,
    calle_id             INTEGER     NOT NULL,
    cuadrante_id         INTEGER     NOT NULL,
    numero_inicio        INTEGER,
    numero_fin           INTEGER,
    lado                 VARCHAR(10) DEFAULT 'AMBOS',
    desde_interseccion   VARCHAR(200),
    hasta_interseccion   VARCHAR(200),
    prioridad            SMALLINT    DEFAULT 1,
    manzana              VARCHAR(10),
    observaciones        TEXT,
    estado               SMALLINT    DEFAULT 1,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by           INTEGER,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by           INTEGER,
    deleted_at           TIMESTAMPTZ,
    deleted_by           INTEGER,
    CONSTRAINT pk_calles_cuadrantes          PRIMARY KEY (id),
    CONSTRAINT uq_calle_cuadrante_num_lado   UNIQUE (calle_id, cuadrante_id, numero_inicio, lado),
    CONSTRAINT uq_calle_cuadrante_manzana    UNIQUE (calle_id, manzana),
    CONSTRAINT fk_cc_calle                   FOREIGN KEY (calle_id)     REFERENCES calles(id),
    CONSTRAINT fk_cc_cuadrante               FOREIGN KEY (cuadrante_id) REFERENCES cuadrantes(id),
    CONSTRAINT chk_cc_lado                   CHECK (lado IN ('AMBOS','PAR','IMPAR','TODOS')),
    CONSTRAINT chk_cc_estado                 CHECK (estado IN (0, 1))
);

-- ----------------------------------------------------------
-- direcciones
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS direcciones (
    id                    SERIAL       NOT NULL,
    direccion_code        VARCHAR(10)  NOT NULL,
    calle_id              INTEGER      NOT NULL,
    numero_municipal      VARCHAR(10),
    manzana               VARCHAR(10),
    lote                  VARCHAR(10),
    urbanizacion          VARCHAR(150),
    tipo_complemento      VARCHAR(10),
    numero_complemento    VARCHAR(20),
    referencia            VARCHAR(255),
    direccion_completa    VARCHAR(500),    -- generado por trigger
    cuadrante_id          INTEGER,
    sector_id             INTEGER,
    ubigeo_code           CHAR(6),
    latitud               NUMERIC(10,8),
    longitud              NUMERIC(11,8),
    geocodificada         SMALLINT     DEFAULT 0,
    location_type         VARCHAR(25),
    fuente_geocodificacion VARCHAR(50),
    verificada            SMALLINT     DEFAULT 0,
    fecha_verificacion    DATE,
    veces_usada           INTEGER      DEFAULT 0,
    ultima_vez_usada      TIMESTAMPTZ,
    observaciones         TEXT,
    estado                SMALLINT     DEFAULT 1,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by            INTEGER,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by            INTEGER,
    deleted_at            TIMESTAMPTZ,
    deleted_by            INTEGER,
    CONSTRAINT pk_direcciones              PRIMARY KEY (id),
    CONSTRAINT uq_direccion_code           UNIQUE (direccion_code),
    CONSTRAINT fk_dir_calle                FOREIGN KEY (calle_id)     REFERENCES calles(id),
    CONSTRAINT fk_dir_cuadrante            FOREIGN KEY (cuadrante_id) REFERENCES cuadrantes(id),
    CONSTRAINT fk_dir_sector               FOREIGN KEY (sector_id)    REFERENCES sectores(id),
    CONSTRAINT fk_dir_ubigeo               FOREIGN KEY (ubigeo_code)  REFERENCES ubigeo(ubigeo_code),
    CONSTRAINT chk_dir_complemento         CHECK (tipo_complemento IN
        ('DEPTO','OFICINA','PISO','INTERIOR','LOTE','MZ','BLOCK','TORRE','CASA') OR tipo_complemento IS NULL),
    CONSTRAINT chk_dir_location_type       CHECK (location_type IN
        ('ROOFTOP','RANGE_INTERPOLATED','GEOMETRIC_CENTER','APPROXIMATE') OR location_type IS NULL),
    CONSTRAINT chk_dir_geocodificada       CHECK (geocodificada IN (0, 1)),
    CONSTRAINT chk_dir_verificada          CHECK (verificada IN (0, 1)),
    CONSTRAINT chk_dir_estado              CHECK (estado IN (0, 1))
);

-- ----------------------------------------------------------
-- cuadrantes_vehiculo_asignado
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuadrantes_vehiculo_asignado (
    id           SERIAL      NOT NULL,
    cuadrante_id INTEGER     NOT NULL,
    vehiculo_id  INTEGER     NOT NULL,
    observaciones VARCHAR(500),
    estado       SMALLINT    DEFAULT 1,
    created_by   INTEGER     NOT NULL,
    updated_by   INTEGER,
    deleted_by   INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT pk_cuadrantes_veh_asig  PRIMARY KEY (id),
    CONSTRAINT uq_cuadrante_vehiculo   UNIQUE (cuadrante_id, vehiculo_id),
    CONSTRAINT fk_cva_cuadrante        FOREIGN KEY (cuadrante_id) REFERENCES cuadrantes(id),
    CONSTRAINT fk_cva_vehiculo         FOREIGN KEY (vehiculo_id)  REFERENCES vehiculos(id),
    CONSTRAINT chk_cva_estado          CHECK (estado IN (0, 1) OR estado IS NULL)
);

-- ----------------------------------------------------------
-- operativos_turno
-- NOTA: PK cambiada a BIGSERIAL (era INTEGER en MySQL) para
--       compatibilidad con operativos_personal.operativo_turno_id (BIGINT)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_turno (
    id               BIGSERIAL   NOT NULL,
    operador_id      INTEGER     NOT NULL,
    turno            VARCHAR(10) NOT NULL,
    fecha            DATE        NOT NULL,
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    fecha_hora_fin   TIMESTAMPTZ,
    supervisor_id    INTEGER     NOT NULL,
    sector_id        INTEGER     NOT NULL,
    estado           VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
    estado_registro  SMALLINT    NOT NULL DEFAULT 1,
    observaciones    VARCHAR(500),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,
    created_by       INTEGER,
    updated_by       INTEGER,
    deleted_by       INTEGER,
    CONSTRAINT pk_operativos_turno        PRIMARY KEY (id),
    CONSTRAINT fk_ot_operador             FOREIGN KEY (operador_id)  REFERENCES personal_seguridad(id),
    CONSTRAINT fk_ot_supervisor           FOREIGN KEY (supervisor_id) REFERENCES personal_seguridad(id),
    CONSTRAINT fk_ot_sector               FOREIGN KEY (sector_id)    REFERENCES sectores(id),
    CONSTRAINT chk_ot_turno               CHECK (turno  IN ('MAÑANA','TARDE','NOCHE')),
    CONSTRAINT chk_ot_estado              CHECK (estado IN ('ACTIVO','CERRADO','ANULADO'))
);

-- ============================================================
-- GRUPO 6 — TABLAS PRINCIPALES DE NEGOCIO
-- ============================================================

-- ----------------------------------------------------------
-- novedades_incidentes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS novedades_incidentes (
    id                          SERIAL       NOT NULL,
    novedad_code                VARCHAR(15)  NOT NULL,
    fecha_hora_ocurrencia       TIMESTAMPTZ  NOT NULL,
    fecha_hora_reporte          TIMESTAMPTZ  DEFAULT NOW(),
    tipo_novedad_id             INTEGER      NOT NULL,
    subtipo_novedad_id          INTEGER,
    estado_novedad_id           INTEGER      NOT NULL DEFAULT 1,
    sector_id                   INTEGER,
    cuadrante_id                INTEGER,
    direccion_id                INTEGER,
    localizacion                TEXT,
    referencia_ubicacion        VARCHAR(255),
    latitud                     NUMERIC(10,8),
    longitud                    NUMERIC(11,8),
    ubigeo_code                 CHAR(6),
    origen_llamada              VARCHAR(35)  DEFAULT 'TELEFONO_107',
    radio_tetra_id              INTEGER,
    reportante_nombre           VARCHAR(150),
    reportante_telefono         VARCHAR(20),
    reportante_doc_identidad    VARCHAR(30),
    es_anonimo                  SMALLINT,
    descripcion                 TEXT         NOT NULL,
    observaciones               TEXT,
    prioridad_actual            VARCHAR(10)  NOT NULL DEFAULT 'MEDIA',
    gravedad                    VARCHAR(10),
    usuario_registro            INTEGER,
    unidad_oficina_id           INTEGER,
    vehiculo_id                 INTEGER,
    personal_cargo_id           INTEGER,
    personal_seguridad2_id      INTEGER,
    personal_seguridad3_id      INTEGER,
    personal_seguridad4_id      INTEGER,
    fecha_despacho              TIMESTAMPTZ,
    usuario_despacho            INTEGER,
    fecha_llegada               TIMESTAMPTZ,
    fecha_cierre                TIMESTAMPTZ,
    km_inicial                  NUMERIC(8,2),
    km_final                    NUMERIC(8,2),
    tiempo_respuesta_min        INTEGER,
    tiempo_respuesta_min_operativo INTEGER,
    turno                       VARCHAR(10),
    parte_adjuntos              JSONB,
    fotos_adjuntas              JSONB,
    videos_adjuntos             JSONB,
    requiere_seguimiento        BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_proxima_revision      TIMESTAMPTZ,
    num_personas_afectadas      INTEGER      DEFAULT 0,
    perdidas_materiales_estimadas NUMERIC(10,2),
    estado                      SMALLINT     NOT NULL DEFAULT 1,
    created_by                  INTEGER,
    updated_by                  INTEGER,
    deleted_at                  TIMESTAMPTZ,
    deleted_by                  INTEGER,
    usuario_cierre              INTEGER,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_novedades           PRIMARY KEY (id),
    CONSTRAINT uq_novedad_code        UNIQUE (novedad_code),
    CONSTRAINT fk_nov_tipo            FOREIGN KEY (tipo_novedad_id)    REFERENCES tipos_novedad(id),
    CONSTRAINT fk_nov_subtipo         FOREIGN KEY (subtipo_novedad_id) REFERENCES subtipos_novedad(id),
    CONSTRAINT fk_nov_estado          FOREIGN KEY (estado_novedad_id)  REFERENCES estados_novedad(id),
    CONSTRAINT fk_nov_sector          FOREIGN KEY (sector_id)          REFERENCES sectores(id),
    CONSTRAINT fk_nov_cuadrante       FOREIGN KEY (cuadrante_id)       REFERENCES cuadrantes(id),
    CONSTRAINT fk_nov_direccion       FOREIGN KEY (direccion_id)       REFERENCES direcciones(id),
    CONSTRAINT fk_nov_ubigeo          FOREIGN KEY (ubigeo_code)        REFERENCES ubigeo(ubigeo_code),
    CONSTRAINT fk_nov_usuario_reg     FOREIGN KEY (usuario_registro)   REFERENCES usuarios(id),
    CONSTRAINT fk_nov_unidad          FOREIGN KEY (unidad_oficina_id)  REFERENCES unidades_oficina(id),
    CONSTRAINT fk_nov_vehiculo        FOREIGN KEY (vehiculo_id)        REFERENCES vehiculos(id),
    CONSTRAINT fk_nov_personal1       FOREIGN KEY (personal_cargo_id)      REFERENCES personal_seguridad(id),
    CONSTRAINT fk_nov_personal2       FOREIGN KEY (personal_seguridad2_id) REFERENCES personal_seguridad(id),
    CONSTRAINT fk_nov_personal3       FOREIGN KEY (personal_seguridad3_id) REFERENCES personal_seguridad(id),
    CONSTRAINT fk_nov_personal4       FOREIGN KEY (personal_seguridad4_id) REFERENCES personal_seguridad(id),
    CONSTRAINT fk_nov_radio           FOREIGN KEY (radio_tetra_id)     REFERENCES radios_tetra(id),
    CONSTRAINT chk_nov_origen         CHECK (origen_llamada IN (
        'TELEFONO_107','RADIO_TETRA','REDES_SOCIALES','BOTON_EMERGENCIA_ALERTA',
        'BOTON_DENUNCIA_VECINO_ALERTA','INTERVENCION_DIRECTA','VIDEO_CCO',
        'ANALITICA','APP_PODER_JUDICIAL','BOT') OR origen_llamada IS NULL),
    CONSTRAINT chk_nov_prioridad      CHECK (prioridad_actual IN ('ALTA','MEDIA','BAJA')),
    CONSTRAINT chk_nov_gravedad       CHECK (gravedad IN ('LEVE','MODERADA','GRAVE','MUY_GRAVE') OR gravedad IS NULL),
    CONSTRAINT chk_nov_turno          CHECK (turno IN ('MAÑANA','TARDE','NOCHE') OR turno IS NULL)
);

-- ----------------------------------------------------------
-- abastecimiento_combustible
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS abastecimiento_combustible (
    id                  SERIAL      NOT NULL,
    vehiculo_id         INTEGER     NOT NULL,
    personal_id         INTEGER     NOT NULL,
    fecha_hora          TIMESTAMPTZ NOT NULL,
    tipo_combustible    VARCHAR(20) NOT NULL,
    km_actual           NUMERIC(8,2) NOT NULL,
    cantidad            NUMERIC(6,2) NOT NULL,
    unidad              VARCHAR(10) NOT NULL DEFAULT 'LITROS',
    importe_total       NUMERIC(8,2) NOT NULL,
    precio_unitario     NUMERIC(6,2) NOT NULL,
    grifo_nombre        VARCHAR(100) NOT NULL,
    grifo_ruc           VARCHAR(11),
    factura_boleta      VARCHAR(50),
    moneda              VARCHAR(5)  NOT NULL DEFAULT 'PEN',
    observaciones       TEXT,
    comprobante_adjunto VARCHAR(255),
    estado              SMALLINT    NOT NULL DEFAULT 1,
    deleted_at          TIMESTAMPTZ,
    deleted_by          INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          INTEGER,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          INTEGER,
    CONSTRAINT pk_abastecimiento         PRIMARY KEY (id),
    CONSTRAINT fk_abast_vehiculo         FOREIGN KEY (vehiculo_id)  REFERENCES vehiculos(id),
    CONSTRAINT fk_abast_personal         FOREIGN KEY (personal_id)  REFERENCES personal_seguridad(id),
    CONSTRAINT chk_abast_combustible     CHECK (tipo_combustible IN (
        'GASOLINA_REGULAR','GASOLINA_PREMIUM','GASOHOL_REGULAR','GASOHOL_PREMIUM',
        'DIESEL_B2','DIESEL_B5','DIESEL_S50','GLP','GNV')),
    CONSTRAINT chk_abast_unidad          CHECK (unidad IN ('LITROS','GALONES')),
    CONSTRAINT chk_abast_moneda          CHECK (moneda IN ('PEN','USD'))
);

-- ----------------------------------------------------------
-- mantenimiento_vehiculos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantenimiento_vehiculos (
    id                        BIGSERIAL    NOT NULL,
    vehiculo_id               INTEGER      NOT NULL,
    unidad_oficina_id         INTEGER,
    taller_id                 INTEGER,
    tipo_mantenimiento        VARCHAR(15)  NOT NULL DEFAULT 'OTRO',
    prioridad                 VARCHAR(10)  NOT NULL DEFAULT 'MEDIA',
    tipo_documento            VARCHAR(20)  NOT NULL DEFAULT 'OTROS',
    numero_documento          VARCHAR(30)  NOT NULL,
    estado_mantenimiento      VARCHAR(15)  NOT NULL DEFAULT 'PROGRAMADO',
    fecha_programada          TIMESTAMPTZ,
    fecha_inicio              TIMESTAMPTZ,
    fecha_fin                 TIMESTAMPTZ,
    km_registro               NUMERIC(10,2),
    km_proximo_mantenimiento  NUMERIC(10,2),
    km_actual_al_finalizar    NUMERIC(10,2),
    descripcion_falla         TEXT,
    detalle_trabajos          TEXT,
    observaciones             TEXT,
    costo_mano_obra           NUMERIC(12,2),
    costo_repuestos           NUMERIC(12,2),
    costo_total               NUMERIC(12,2),
    moneda                    VARCHAR(3)   NOT NULL DEFAULT 'PEN',
    adjuntos                  JSONB,
    estado                    SMALLINT     NOT NULL DEFAULT 1,
    deleted_at                TIMESTAMPTZ,
    deleted_by                INTEGER,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by                INTEGER,
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by                INTEGER,
    CONSTRAINT pk_mantenimiento            PRIMARY KEY (id),
    CONSTRAINT uq_mant_doc_por_vehiculo    UNIQUE (vehiculo_id, tipo_documento, numero_documento),
    CONSTRAINT fk_mant_vehiculo            FOREIGN KEY (vehiculo_id)      REFERENCES vehiculos(id),
    CONSTRAINT fk_mant_unidad              FOREIGN KEY (unidad_oficina_id) REFERENCES unidades_oficina(id),
    CONSTRAINT fk_mant_taller              FOREIGN KEY (taller_id)        REFERENCES talleres(id),
    CONSTRAINT chk_mant_tipo               CHECK (tipo_mantenimiento IN ('PREVENTIVO','CORRECTIVO','INSPECCION','OTRO')),
    CONSTRAINT chk_mant_prioridad          CHECK (prioridad IN ('BAJA','MEDIA','ALTA','CRITICA')),
    CONSTRAINT chk_mant_tipo_doc           CHECK (tipo_documento IN ('ORDEN_TRABAJO','ORDEN_SERVICIO','FACTURA','BOLETA_VENTAS','OTROS')),
    CONSTRAINT chk_mant_estado_mant        CHECK (estado_mantenimiento IN ('PROGRAMADO','EN_TALLER','EN_PROCESO','FINALIZADO','CANCELADO'))
);

-- ============================================================
-- GRUPO 7 — TABLAS DE HISTORIAL Y AUDITORÍA
-- ============================================================

-- ----------------------------------------------------------
-- historial_desperfectos_vehiculo
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_desperfectos_vehiculo (
    id               BIGSERIAL    NOT NULL,
    vehiculo_id      INTEGER      NOT NULL,
    desperfecto_id   INTEGER      NOT NULL,
    mantenimiento_id BIGINT,
    fecha_reporte    TIMESTAMPTZ  DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ,
    estado           VARCHAR(15)  DEFAULT 'REPORTADO',
    descripcion      TEXT,
    prioridad_reparacion VARCHAR(10) DEFAULT 'MEDIA',
    created_by       INTEGER,
    updated_by       INTEGER,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_historial_desperfectos PRIMARY KEY (id),
    CONSTRAINT fk_hd_vehiculo            FOREIGN KEY (vehiculo_id)    REFERENCES vehiculos(id),
    CONSTRAINT fk_hd_desperfecto         FOREIGN KEY (desperfecto_id) REFERENCES catalogo_desperfectos(id),
    CONSTRAINT fk_hd_mantenimiento       FOREIGN KEY (mantenimiento_id) REFERENCES mantenimiento_vehiculos(id),
    CONSTRAINT chk_hd_estado             CHECK (estado IN ('REPORTADO','EN_REPARACION','RESUELTO','CANCELADO')),
    CONSTRAINT chk_hd_prioridad          CHECK (prioridad_reparacion IN ('ALTA','MEDIA','BAJA'))
);

-- ----------------------------------------------------------
-- historial_estado_novedades
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_estado_novedades (
    id                   SERIAL      NOT NULL,
    novedad_id           INTEGER     NOT NULL,
    estado_anterior_id   INTEGER,
    estado_nuevo_id      INTEGER     NOT NULL,
    usuario_id           INTEGER     NOT NULL,
    tiempo_en_estado_min INTEGER,
    observaciones        TEXT,
    fecha_cambio         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata             JSONB,
    created_by           INTEGER,
    updated_by           INTEGER,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_historial_estado_novedades PRIMARY KEY (id),
    CONSTRAINT fk_hen_novedad                FOREIGN KEY (novedad_id)         REFERENCES novedades_incidentes(id),
    CONSTRAINT fk_hen_estado_ant             FOREIGN KEY (estado_anterior_id) REFERENCES estados_novedad(id),
    CONSTRAINT fk_hen_estado_nuevo           FOREIGN KEY (estado_nuevo_id)    REFERENCES estados_novedad(id),
    CONSTRAINT fk_hen_usuario                FOREIGN KEY (usuario_id)         REFERENCES usuarios(id)
);

-- ----------------------------------------------------------
-- auditoria_acciones
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_acciones (
    id              BIGSERIAL    NOT NULL,
    usuario_id      INTEGER,
    accion          VARCHAR(100) NOT NULL,
    modulo          VARCHAR(50),
    entidad_tipo    VARCHAR(50)  NOT NULL,
    entidad_id      INTEGER,
    descripcion     TEXT,
    datos_anteriores JSONB,
    datos_nuevos    JSONB,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(255),
    resultado       VARCHAR(15)  DEFAULT 'EXITO',
    mensaje_error   TEXT,
    metadata        JSONB,
    severidad       VARCHAR(10)  NOT NULL DEFAULT 'BAJA',
    duracion_ms     INTEGER,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_auditoria_acciones  PRIMARY KEY (id),
    CONSTRAINT fk_audit_usuario       FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT chk_audit_resultado    CHECK (resultado  IN ('EXITO','FALLO','DENEGADO','SUCCESS','ERROR')),
    CONSTRAINT chk_audit_severidad    CHECK (severidad  IN ('BAJA','MEDIA','ALTA','CRITICA'))
);

-- ============================================================
-- GRUPO 8 — OPERATIVOS (JERARQUÍA COMPLETA)
-- ============================================================

-- ----------------------------------------------------------
-- operativos_personal
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_personal (
    id                   BIGSERIAL   NOT NULL,
    operativo_turno_id   BIGINT      NOT NULL,
    tipo_patrullaje      VARCHAR(15) NOT NULL DEFAULT 'SERENAZGO',
    personal_id          INTEGER     NOT NULL,
    sereno_id            INTEGER,
    radio_tetra_id       INTEGER,
    estado_operativo_id  INTEGER     NOT NULL,
    chaleco_balistico    BOOLEAN     DEFAULT FALSE,
    porra_policial       BOOLEAN     DEFAULT FALSE,
    esposas              BOOLEAN     DEFAULT FALSE,
    linterna             BOOLEAN     DEFAULT FALSE,
    kit_primeros_auxilios BOOLEAN    DEFAULT FALSE,
    hora_inicio          TIMESTAMPTZ NOT NULL,
    hora_fin             TIMESTAMPTZ,
    observaciones        VARCHAR(500),
    estado_registro      SMALLINT    DEFAULT 1,
    created_by           INTEGER     NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by           INTEGER,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by           INTEGER,
    deleted_at           TIMESTAMPTZ,
    CONSTRAINT pk_operativos_personal     PRIMARY KEY (id),
    CONSTRAINT fk_op_turno                FOREIGN KEY (operativo_turno_id) REFERENCES operativos_turno(id),
    CONSTRAINT fk_op_personal             FOREIGN KEY (personal_id)        REFERENCES personal_seguridad(id),
    CONSTRAINT fk_op_sereno               FOREIGN KEY (sereno_id)          REFERENCES personal_seguridad(id),
    CONSTRAINT fk_op_radio                FOREIGN KEY (radio_tetra_id)     REFERENCES radios_tetra(id),
    CONSTRAINT fk_op_estado_oper          FOREIGN KEY (estado_operativo_id) REFERENCES estados_operativo_recurso(id),
    CONSTRAINT chk_op_tipo_patrullaje     CHECK (tipo_patrullaje IN ('SERENAZGO','PPFF','GUARDIA','VIGILANTE','OTRO'))
);

-- ----------------------------------------------------------
-- operativos_vehiculos
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_vehiculos (
    id                       BIGSERIAL   NOT NULL,
    operativo_turno_id       BIGINT      NOT NULL,
    vehiculo_id              INTEGER     NOT NULL,
    conductor_id             INTEGER,
    copiloto_id              INTEGER,
    tipo_copiloto_id         INTEGER,
    radio_tetra_id           INTEGER,
    estado_operativo_id      INTEGER     NOT NULL,
    kilometraje_inicio       INTEGER     NOT NULL,
    hora_inicio              TIMESTAMPTZ NOT NULL,
    nivel_combustible_inicio VARCHAR(10),
    kilometraje_recarga      INTEGER,
    hora_recarga             TIMESTAMPTZ,
    combustible_litros       NUMERIC(8,2),
    importe_recarga          NUMERIC(10,2),
    nivel_combustible_recarga VARCHAR(10),
    kilometraje_fin          INTEGER,
    hora_fin                 TIMESTAMPTZ,
    nivel_combustible_fin    VARCHAR(10),
    observaciones            VARCHAR(500),
    estado_registro          SMALLINT    DEFAULT 1,
    created_by               INTEGER     NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by               INTEGER,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by               INTEGER,
    deleted_at               TIMESTAMPTZ,
    CONSTRAINT pk_operativos_vehiculos   PRIMARY KEY (id),
    CONSTRAINT uq_turno_conductor        UNIQUE (operativo_turno_id, conductor_id),
    CONSTRAINT fk_ov_turno               FOREIGN KEY (operativo_turno_id) REFERENCES operativos_turno(id),
    CONSTRAINT fk_ov_vehiculo            FOREIGN KEY (vehiculo_id)        REFERENCES vehiculos(id),
    CONSTRAINT fk_ov_conductor           FOREIGN KEY (conductor_id)       REFERENCES personal_seguridad(id),
    CONSTRAINT fk_ov_copiloto            FOREIGN KEY (copiloto_id)        REFERENCES personal_seguridad(id),
    CONSTRAINT fk_ov_tipo_copiloto       FOREIGN KEY (tipo_copiloto_id)   REFERENCES tipos_copiloto(id),
    CONSTRAINT fk_ov_radio               FOREIGN KEY (radio_tetra_id)     REFERENCES radios_tetra(id),
    CONSTRAINT fk_ov_estado_oper         FOREIGN KEY (estado_operativo_id) REFERENCES estados_operativo_recurso(id),
    CONSTRAINT chk_ov_nivel_ini          CHECK (nivel_combustible_inicio  IN ('LLENO','3/4','1/2','1/4','RESERVA') OR nivel_combustible_inicio  IS NULL),
    CONSTRAINT chk_ov_nivel_rec          CHECK (nivel_combustible_recarga IN ('LLENO','3/4','1/2','1/4','RESERVA') OR nivel_combustible_recarga IS NULL),
    CONSTRAINT chk_ov_nivel_fin          CHECK (nivel_combustible_fin     IN ('LLENO','3/4','1/2','1/4','RESERVA') OR nivel_combustible_fin     IS NULL)
);

-- ----------------------------------------------------------
-- operativos_personal_cuadrantes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_personal_cuadrantes (
    id                    BIGSERIAL   NOT NULL,
    operativo_personal_id BIGINT      NOT NULL,
    cuadrante_id          INTEGER     NOT NULL,
    hora_ingreso          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hora_salida           TIMESTAMPTZ,
    observaciones         VARCHAR(500),
    incidentes_reportados TEXT,
    estado_registro       SMALLINT    DEFAULT 1,
    created_by            INTEGER     NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by            INTEGER,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by            INTEGER,
    deleted_at            TIMESTAMPTZ,
    CONSTRAINT pk_op_personal_cuadrantes  PRIMARY KEY (id),
    CONSTRAINT fk_opc_personal            FOREIGN KEY (operativo_personal_id) REFERENCES operativos_personal(id),
    CONSTRAINT fk_opc_cuadrante           FOREIGN KEY (cuadrante_id)          REFERENCES cuadrantes(id)
);

-- ----------------------------------------------------------
-- operativos_vehiculos_cuadrantes
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_vehiculos_cuadrantes (
    id                     BIGSERIAL   NOT NULL,
    operativo_vehiculo_id  BIGINT      NOT NULL,
    cuadrante_id           INTEGER     NOT NULL,
    hora_ingreso           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hora_salida            TIMESTAMPTZ,
    observaciones          VARCHAR(500),
    incidentes_reportados  TEXT,
    estado_registro        SMALLINT    DEFAULT 1,
    created_by             INTEGER     NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by             INTEGER,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by             INTEGER,
    deleted_at             TIMESTAMPTZ,
    CONSTRAINT pk_op_vehiculos_cuadrantes PRIMARY KEY (id),
    CONSTRAINT fk_ovc_vehiculo            FOREIGN KEY (operativo_vehiculo_id) REFERENCES operativos_vehiculos(id),
    CONSTRAINT fk_ovc_cuadrante           FOREIGN KEY (cuadrante_id)          REFERENCES cuadrantes(id)
);

-- ============================================================
-- GRUPO 9 — HOJA DE ÁRBOL (DEPENDEN DE GRUPOS 7-8)
-- ============================================================

-- ----------------------------------------------------------
-- operativos_personal_novedades
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_personal_novedades (
    id                              BIGSERIAL   NOT NULL,
    operativo_personal_cuadrante_id BIGINT      NOT NULL,
    novedad_id                      INTEGER     NOT NULL,
    reportado                       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atendido                        TIMESTAMPTZ,
    prioridad                       VARCHAR(10) DEFAULT 'MEDIA',
    acciones_tomadas                TEXT,
    resultado                       VARCHAR(15) DEFAULT 'PENDIENTE',
    observaciones                   TEXT,
    estado_registro                 SMALLINT    NOT NULL DEFAULT 1,
    created_by                      INTEGER     NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by                      INTEGER,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by                      INTEGER,
    deleted_at                      TIMESTAMPTZ,
    CONSTRAINT pk_op_personal_novedades     PRIMARY KEY (id),
    CONSTRAINT uq_cuadrante_personal_nov    UNIQUE (operativo_personal_cuadrante_id, novedad_id),
    CONSTRAINT fk_opn_cuadrante             FOREIGN KEY (operativo_personal_cuadrante_id) REFERENCES operativos_personal_cuadrantes(id),
    CONSTRAINT fk_opn_novedad               FOREIGN KEY (novedad_id) REFERENCES novedades_incidentes(id),
    CONSTRAINT chk_opn_prioridad            CHECK (prioridad IN ('BAJA','MEDIA','ALTA','URGENTE') OR prioridad IS NULL),
    CONSTRAINT chk_opn_resultado            CHECK (resultado IN ('PENDIENTE','RESUELTO','ESCALADO','CANCELADO') OR resultado IS NULL)
);

-- ----------------------------------------------------------
-- operativos_vehiculos_novedades
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS operativos_vehiculos_novedades (
    id                             BIGSERIAL   NOT NULL,
    operativo_vehiculo_cuadrante_id BIGINT     NOT NULL,
    novedad_id                     INTEGER     NOT NULL,
    reportado                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atendido                       TIMESTAMPTZ,
    estado                         SMALLINT    DEFAULT 1,
    prioridad                      VARCHAR(10) NOT NULL DEFAULT 'MEDIA',
    observaciones                  TEXT,
    acciones_tomadas               TEXT,
    resultado                      VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE',
    created_by                     INTEGER     NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by                     INTEGER,
    updated_at                     TIMESTAMPTZ DEFAULT NOW(),
    deleted_by                     INTEGER,
    deleted_at                     TIMESTAMPTZ,
    CONSTRAINT pk_op_vehiculos_novedades    PRIMARY KEY (id),
    CONSTRAINT fk_ovn_cuadrante             FOREIGN KEY (operativo_vehiculo_cuadrante_id) REFERENCES operativos_vehiculos_cuadrantes(id),
    CONSTRAINT fk_ovn_novedad               FOREIGN KEY (novedad_id) REFERENCES novedades_incidentes(id),
    CONSTRAINT chk_ovn_prioridad            CHECK (prioridad IN ('BAJA','MEDIA','ALTA','URGENTE')),
    CONSTRAINT chk_ovn_resultado            CHECK (resultado IN ('PENDIENTE','RESUELTO','ESCALADO','CANCELADO'))
);

-- ============================================================
-- GRUPO 10 — TRACKING GPS
-- ============================================================

-- ----------------------------------------------------------
-- tracking_vehiculos (snapshot posición actual)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_vehiculos (
    id                  SERIAL      NOT NULL,
    vehiculo_id         INTEGER     NOT NULL,
    personal_id         INTEGER,
    operativo_id        BIGINT,
    lat                 NUMERIC(10,8) NOT NULL,
    lng                 NUMERIC(11,8) NOT NULL,
    velocidad           NUMERIC(5,2),
    precision_gps       NUMERIC(6,2),
    bateria_dispositivo SMALLINT,
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_tracking_vehiculos  PRIMARY KEY (id),
    CONSTRAINT uq_tracking_vehiculo   UNIQUE (vehiculo_id),
    CONSTRAINT fk_tv_vehiculo         FOREIGN KEY (vehiculo_id)   REFERENCES vehiculos(id),
    CONSTRAINT fk_tv_personal         FOREIGN KEY (personal_id)   REFERENCES personal_seguridad(id),
    CONSTRAINT fk_tv_operativo        FOREIGN KEY (operativo_id)  REFERENCES operativos_turno(id)
);

-- ----------------------------------------------------------
-- tracking_historial (historial completo de posiciones GPS)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracking_historial (
    id              BIGSERIAL    NOT NULL,
    vehiculo_id     INTEGER      NOT NULL,
    lat             NUMERIC(10,8) NOT NULL,
    lng             NUMERIC(11,8) NOT NULL,
    velocidad       NUMERIC(5,2),
    registrado_at   TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_tracking_historial PRIMARY KEY (id),
    CONSTRAINT fk_th_vehiculo        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

-- ============================================================
-- FK CIRCULARES — ALTER TABLE (después de crear todas las tablas)
-- PostgreSQL no admite ADD CONSTRAINT IF NOT EXISTS; se usa el
-- bloque DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL $$
-- para que el script sea idempotente (re-ejecutable sin error).
-- ============================================================

-- personal_seguridad.vehiculo_id → vehiculos
DO $$ BEGIN
    ALTER TABLE citysecure.personal_seguridad
        ADD CONSTRAINT fk_personal_vehiculo
        FOREIGN KEY (vehiculo_id) REFERENCES citysecure.vehiculos(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- vehiculos.conductor_asignado_id → personal_seguridad
DO $$ BEGIN
    ALTER TABLE citysecure.vehiculos
        ADD CONSTRAINT fk_vehiculos_conductor
        FOREIGN KEY (conductor_asignado_id) REFERENCES citysecure.personal_seguridad(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- sectores.supervisor_id → personal_seguridad
DO $$ BEGIN
    ALTER TABLE citysecure.sectores
        ADD CONSTRAINT fk_sectores_supervisor
        FOREIGN KEY (supervisor_id) REFERENCES citysecure.personal_seguridad(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- usuarios.personal_seguridad_id → personal_seguridad
DO $$ BEGIN
    ALTER TABLE citysecure.usuarios
        ADD CONSTRAINT fk_usuarios_personal
        FOREIGN KEY (personal_seguridad_id) REFERENCES citysecure.personal_seguridad(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TRIGGERS PL/pgSQL
-- ============================================================

-- ----------------------------------------------------------
-- Trigger: calles.nombre_completo
-- Genera "Av. Ejército" desde tipo_via.abreviatura + nombre_via
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_nombre_completo()
RETURNS TRIGGER AS $$
DECLARE
    v_abreviatura VARCHAR(10);
BEGIN
    SELECT abreviatura INTO v_abreviatura
    FROM citysecure.tipos_via
    WHERE id = NEW.tipo_via_id;

    IF v_abreviatura IS NOT NULL THEN
        NEW.nombre_completo := v_abreviatura || ' ' || NEW.nombre_via;
    ELSE
        NEW.nombre_completo := NEW.nombre_via;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calles_nombre_completo ON calles;
CREATE TRIGGER trg_calles_nombre_completo
    BEFORE INSERT OR UPDATE OF tipo_via_id, nombre_via
    ON calles
    FOR EACH ROW
    EXECUTE FUNCTION generate_nombre_completo();

-- ----------------------------------------------------------
-- Trigger: direcciones.direccion_completa
-- Genera la dirección legible completa desde sus componentes
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_direccion_completa()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_calle VARCHAR(250);
    v_resultado    VARCHAR(500);
BEGIN
    SELECT nombre_completo INTO v_nombre_calle
    FROM citysecure.calles
    WHERE id = NEW.calle_id;

    v_resultado := COALESCE(v_nombre_calle, '');

    IF NEW.numero_municipal IS NOT NULL THEN
        v_resultado := v_resultado || ' N° ' || NEW.numero_municipal;
    END IF;

    IF NEW.manzana IS NOT NULL THEN
        v_resultado := v_resultado || ' Mz. ' || NEW.manzana;
    END IF;

    IF NEW.lote IS NOT NULL THEN
        v_resultado := v_resultado || ' Lt. ' || NEW.lote;
    END IF;

    IF NEW.tipo_complemento IS NOT NULL AND NEW.numero_complemento IS NOT NULL THEN
        v_resultado := v_resultado || ' ' || NEW.tipo_complemento || '. ' || NEW.numero_complemento;
    END IF;

    IF NEW.urbanizacion IS NOT NULL THEN
        v_resultado := v_resultado || ' - ' || NEW.urbanizacion;
    END IF;

    IF NEW.referencia IS NOT NULL THEN
        v_resultado := v_resultado || ' (' || NEW.referencia || ')';
    END IF;

    NEW.direccion_completa := TRIM(v_resultado);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_direcciones_completa ON direcciones;
CREATE TRIGGER trg_direcciones_completa
    BEFORE INSERT OR UPDATE
    ON direcciones
    FOR EACH ROW
    EXECUTE FUNCTION generate_direccion_completa();

-- ============================================================
-- ÍNDICES SECUNDARIOS
-- CREATE INDEX IF NOT EXISTS — todos al final para claridad
-- ============================================================

-- ubigeo
CREATE INDEX IF NOT EXISTS idx_ubigeo_departamento ON ubigeo(departamento);
CREATE INDEX IF NOT EXISTS idx_ubigeo_provincia     ON ubigeo(provincia);
CREATE INDEX IF NOT EXISTS idx_ubigeo_distrito      ON ubigeo(distrito);
CREATE INDEX IF NOT EXISTS idx_ubigeo_full          ON ubigeo(departamento, provincia, distrito);

-- tipos_via
CREATE INDEX IF NOT EXISTS idx_tipos_via_codigo_estado ON tipos_via(codigo, estado);
CREATE INDEX IF NOT EXISTS idx_tipos_via_estado        ON tipos_via(estado);

-- cargos
CREATE INDEX IF NOT EXISTS idx_cargo_categoria ON cargos(categoria);
CREATE INDEX IF NOT EXISTS idx_cargo_nivel     ON cargos(nivel_jerarquico);
CREATE INDEX IF NOT EXISTS idx_cargo_estado    ON cargos(estado, deleted_at);

-- roles
CREATE INDEX IF NOT EXISTS idx_roles_jerarquia ON roles(nivel_jerarquia);
CREATE INDEX IF NOT EXISTS idx_roles_estado    ON roles(estado);

-- permisos
CREATE INDEX IF NOT EXISTS idx_permisos_modulo  ON permisos(modulo);
CREATE INDEX IF NOT EXISTS idx_permisos_recurso ON permisos(recurso);
CREATE INDEX IF NOT EXISTS idx_permisos_estado  ON permisos(estado);

-- subtipos_novedad
CREATE INDEX IF NOT EXISTS idx_subtipos_tipo     ON subtipos_novedad(tipo_novedad_id);
CREATE INDEX IF NOT EXISTS idx_subtipos_prioridad ON subtipos_novedad(prioridad);
CREATE INDEX IF NOT EXISTS idx_subtipos_estado   ON subtipos_novedad(estado, orden);

-- unidades_oficina
CREATE INDEX IF NOT EXISTS idx_unidades_tipo    ON unidades_oficina(tipo_unidad);
CREATE INDEX IF NOT EXISTS idx_unidades_ubigeo  ON unidades_oficina(ubigeo);
CREATE INDEX IF NOT EXISTS idx_unidades_coords  ON unidades_oficina(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_unidades_estado  ON unidades_oficina(estado);

-- personal_seguridad
CREATE INDEX IF NOT EXISTS idx_personal_cargo        ON personal_seguridad(cargo_id);
CREATE INDEX IF NOT EXISTS idx_personal_ubigeo       ON personal_seguridad(ubigeo_code);
CREATE INDEX IF NOT EXISTS idx_personal_vehiculo     ON personal_seguridad(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_personal_status       ON personal_seguridad(status);
CREATE INDEX IF NOT EXISTS idx_personal_estado       ON personal_seguridad(estado);
CREATE INDEX IF NOT EXISTS idx_personal_nombres      ON personal_seguridad(apellido_paterno, apellido_materno, nombres);
CREATE INDEX IF NOT EXISTS idx_personal_activos      ON personal_seguridad(estado, deleted_at, status);
CREATE INDEX IF NOT EXISTS idx_personal_disponibles  ON personal_seguridad(status, vehiculo_id, estado, deleted_at);
CREATE INDEX IF NOT EXISTS idx_personal_conductores  ON personal_seguridad(licencia, vigencia, status);

-- sectores
CREATE INDEX IF NOT EXISTS idx_sectores_zona    ON sectores(zona_code);
CREATE INDEX IF NOT EXISTS idx_sectores_estado  ON sectores(estado);
CREATE INDEX IF NOT EXISTS idx_sectores_ubigeo  ON sectores(ubigeo);
CREATE INDEX IF NOT EXISTS idx_sectores_activos ON sectores(estado, deleted_at);

-- subsectores
CREATE INDEX IF NOT EXISTS idx_subsectores_sector  ON subsectores(sector_id);
CREATE INDEX IF NOT EXISTS idx_subsectores_estado  ON subsectores(estado);
CREATE INDEX IF NOT EXISTS idx_subsectores_activos ON subsectores(estado, deleted_at);

-- cuadrantes
CREATE INDEX IF NOT EXISTS idx_cuadrantes_sector    ON cuadrantes(sector_id);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_zona      ON cuadrantes(zona_code);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_estado    ON cuadrantes(estado);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_coords    ON cuadrantes(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_activos   ON cuadrantes(estado, deleted_at);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_subsector ON cuadrantes(subsector_id);
CREATE INDEX IF NOT EXISTS idx_cuadrantes_super     ON cuadrantes(personal_supervisor_id);

-- calles
CREATE INDEX IF NOT EXISTS idx_calles_ubigeo       ON calles(ubigeo_code);
CREATE INDEX IF NOT EXISTS idx_calles_urbanizacion ON calles(urbanizacion);
CREATE INDEX IF NOT EXISTS idx_calles_zona         ON calles(zona);
CREATE INDEX IF NOT EXISTS idx_calles_estado       ON calles(estado);
CREATE INDEX IF NOT EXISTS idx_calles_nombre       ON calles(nombre_via);
CREATE INDEX IF NOT EXISTS idx_calles_principal    ON calles(es_principal);

-- calles_cuadrantes
CREATE INDEX IF NOT EXISTS idx_cc_cuadrante    ON calles_cuadrantes(cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_cc_estado       ON calles_cuadrantes(estado);
CREATE INDEX IF NOT EXISTS idx_cc_numero_rango ON calles_cuadrantes(calle_id, lado, numero_inicio);
CREATE INDEX IF NOT EXISTS idx_cc_calle_id     ON calles_cuadrantes(calle_id);

-- direcciones
CREATE INDEX IF NOT EXISTS idx_dir_calle         ON direcciones(calle_id);
CREATE INDEX IF NOT EXISTS idx_dir_cuadrante     ON direcciones(cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_dir_sector        ON direcciones(sector_id);
CREATE INDEX IF NOT EXISTS idx_dir_ubigeo        ON direcciones(ubigeo_code);
CREATE INDEX IF NOT EXISTS idx_dir_urbanizacion  ON direcciones(urbanizacion);
CREATE INDEX IF NOT EXISTS idx_dir_geocodificada ON direcciones(geocodificada);
CREATE INDEX IF NOT EXISTS idx_dir_verificada    ON direcciones(verificada);
CREATE INDEX IF NOT EXISTS idx_dir_coords        ON direcciones(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_dir_manzana_lote  ON direcciones(manzana, lote);

-- usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado, email_verified_at);

-- vehiculos
CREATE INDEX IF NOT EXISTS idx_vehiculos_tipo           ON vehiculos(tipo_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_unidad         ON vehiculos(unidad_oficina_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_conductor      ON vehiculos(conductor_asignado_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado_oper    ON vehiculos(estado_operativo);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado         ON vehiculos(estado);

-- novedades_incidentes
CREATE INDEX IF NOT EXISTS idx_novedad_fecha          ON novedades_incidentes(fecha_hora_ocurrencia);
CREATE INDEX IF NOT EXISTS idx_novedad_estado         ON novedades_incidentes(estado_novedad_id);
CREATE INDEX IF NOT EXISTS idx_novedad_tipo_subtipo   ON novedades_incidentes(tipo_novedad_id, subtipo_novedad_id);
CREATE INDEX IF NOT EXISTS idx_novedad_usuario        ON novedades_incidentes(usuario_registro);
CREATE INDEX IF NOT EXISTS idx_novedad_usuario_cierre ON novedades_incidentes(usuario_cierre);
CREATE INDEX IF NOT EXISTS idx_novedad_creacion       ON novedades_incidentes(created_by);

-- abastecimiento_combustible
CREATE INDEX IF NOT EXISTS idx_abast_vehiculo_fecha ON abastecimiento_combustible(vehiculo_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_abast_fecha          ON abastecimiento_combustible(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_abast_grifo_nombre   ON abastecimiento_combustible(grifo_nombre);
CREATE INDEX IF NOT EXISTS idx_abast_grifo_ruc      ON abastecimiento_combustible(grifo_ruc);

-- mantenimiento_vehiculos
CREATE INDEX IF NOT EXISTS idx_mant_vehiculo    ON mantenimiento_vehiculos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_mant_estado      ON mantenimiento_vehiculos(estado_mantenimiento);
CREATE INDEX IF NOT EXISTS idx_mant_deleted_at  ON mantenimiento_vehiculos(deleted_at);

-- historial_desperfectos_vehiculo
CREATE INDEX IF NOT EXISTS idx_hd_vehiculo ON historial_desperfectos_vehiculo(vehiculo_id);

-- auditoria_acciones
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario       ON auditoria_acciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion        ON auditoria_acciones(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo        ON auditoria_acciones(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha         ON auditoria_acciones(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_resultado     ON auditoria_acciones(resultado);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON auditoria_acciones(usuario_id, created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad       ON auditoria_acciones(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_severidad     ON auditoria_acciones(severidad);

-- historial_usuarios
CREATE INDEX IF NOT EXISTS idx_historial_usuario      ON historial_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_accion       ON historial_usuarios(accion);
CREATE INDEX IF NOT EXISTS idx_historial_fecha        ON historial_usuarios(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_historial_realizado    ON historial_usuarios(realizado_por);

-- operativos_turno
CREATE INDEX IF NOT EXISTS idx_ot_sector     ON operativos_turno(sector_id);
CREATE INDEX IF NOT EXISTS idx_ot_fecha      ON operativos_turno(fecha);
CREATE INDEX IF NOT EXISTS idx_ot_estado     ON operativos_turno(estado);

-- operativos_personal
CREATE INDEX IF NOT EXISTS idx_op_turno          ON operativos_personal(operativo_turno_id);
CREATE INDEX IF NOT EXISTS idx_op_personal       ON operativos_personal(personal_id);
CREATE INDEX IF NOT EXISTS idx_op_sereno         ON operativos_personal(sereno_id);
CREATE INDEX IF NOT EXISTS idx_op_tipo_patrol    ON operativos_personal(tipo_patrullaje);
CREATE INDEX IF NOT EXISTS idx_op_estado_oper    ON operativos_personal(estado_operativo_id);

-- operativos_personal con índice parcial (solo activos — soportado nativamente en PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_turno_personal
    ON operativos_personal(operativo_turno_id, personal_id)
    WHERE estado_registro = 1;

-- operativos_vehiculos
CREATE INDEX IF NOT EXISTS idx_ov_turno   ON operativos_vehiculos(operativo_turno_id);

-- operativos_personal_cuadrantes
CREATE INDEX IF NOT EXISTS idx_opc_personal   ON operativos_personal_cuadrantes(operativo_personal_id);
CREATE INDEX IF NOT EXISTS idx_opc_cuadrante  ON operativos_personal_cuadrantes(cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_opc_ingreso    ON operativos_personal_cuadrantes(hora_ingreso);

CREATE UNIQUE INDEX IF NOT EXISTS uq_personal_cuadrante
    ON operativos_personal_cuadrantes(operativo_personal_id, cuadrante_id)
    WHERE estado_registro = 1;

-- operativos_vehiculos_cuadrantes
CREATE INDEX IF NOT EXISTS idx_ovc_vehiculo  ON operativos_vehiculos_cuadrantes(operativo_vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_ovc_cuadrante ON operativos_vehiculos_cuadrantes(cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_ovc_ingreso   ON operativos_vehiculos_cuadrantes(hora_ingreso);

-- operativos_personal_novedades
CREATE INDEX IF NOT EXISTS idx_opn_cuadrante ON operativos_personal_novedades(operativo_personal_cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_opn_novedad   ON operativos_personal_novedades(novedad_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cuadrante_personal_novedad
    ON operativos_personal_novedades(operativo_personal_cuadrante_id, novedad_id)
    WHERE estado_registro = 1;

-- operativos_vehiculos_novedades
CREATE INDEX IF NOT EXISTS idx_ovn_cuadrante ON operativos_vehiculos_novedades(operativo_vehiculo_cuadrante_id);
CREATE INDEX IF NOT EXISTS idx_ovn_novedad   ON operativos_vehiculos_novedades(novedad_id);

-- tracking_vehiculos
CREATE INDEX IF NOT EXISTS idx_tracking_operativo  ON tracking_vehiculos(operativo_id);
CREATE INDEX IF NOT EXISTS idx_tracking_activo     ON tracking_vehiculos(activo);
CREATE INDEX IF NOT EXISTS idx_tracking_updated_at ON tracking_vehiculos(updated_at);

-- tracking_historial
CREATE INDEX IF NOT EXISTS idx_historial_vehiculo_tiempo ON tracking_historial(vehiculo_id, registrado_at);
CREATE INDEX IF NOT EXISTS idx_historial_registrado_at   ON tracking_historial(registrado_at);

-- login_intentos
CREATE INDEX IF NOT EXISTS idx_login_usuario    ON login_intentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_login_username   ON login_intentos(username_or_email);
CREATE INDEX IF NOT EXISTS idx_login_ip         ON login_intentos(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_exitoso    ON login_intentos(intento_exitoso);
CREATE INDEX IF NOT EXISTS idx_login_fecha      ON login_intentos(created_at);

-- radios_tetra
CREATE INDEX IF NOT EXISTS idx_radios_personal ON radios_tetra(personal_seguridad_id);
CREATE INDEX IF NOT EXISTS idx_radios_estado   ON radios_tetra(estado);

-- rol_estados_novedad
CREATE INDEX IF NOT EXISTS idx_rn_rol       ON rol_estados_novedad(rol_id);
CREATE INDEX IF NOT EXISTS idx_rn_estado_n  ON rol_estados_novedad(estado_novedad_id);

-- usuario_roles
CREATE INDEX IF NOT EXISTS idx_ur_usuario    ON usuario_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ur_rol        ON usuario_roles(rol_id);
CREATE INDEX IF NOT EXISTS idx_ur_expiracion ON usuario_roles(fecha_expiracion);

-- horarios_turnos
CREATE INDEX IF NOT EXISTS idx_ht_estado     ON horarios_turnos(estado);
CREATE INDEX IF NOT EXISTS idx_ht_hora_ini   ON horarios_turnos(hora_inicio);
CREATE INDEX IF NOT EXISTS idx_ht_deleted_at ON horarios_turnos(deleted_at);

-- historial_estado_novedades
CREATE INDEX IF NOT EXISTS idx_hen_novedad  ON historial_estado_novedades(novedad_id);
CREATE INDEX IF NOT EXISTS idx_hen_fecha    ON historial_estado_novedades(fecha_cambio);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
