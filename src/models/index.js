/**
 * src/models/index.js
 * Configuración de Modelos Sequelize
 * Define todos los modelos y sus relaciones
 */

const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/copy.database");

// Inicializar Sequelize con la configuración
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    timezone: "-05:00", // Zona horaria de Perú
  }
);

// Objeto para almacenar todos los modelos
const db = {};

// ==================== DEFINICIÓN DE MODELOS ====================

/**
 * Modelo: Ubigeo
 * Tabla de división geográfica (departamento, provincia, distrito)
 */
db.Ubigeo = sequelize.define(
  "Ubigeo",
  {
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      primaryKey: true,
      allowNull: false,
    },
    departamento: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    provincia: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    distrito: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "ubigeo",
    timestamps: false,
  }
);

/**
 * Modelo: Cargo
 * Cargos del personal de seguridad
 */
db.Cargo = sequelize.define(
  "Cargo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "cargos",
    timestamps: false,
  }
);

/**
 * Modelo: TipoVehiculo
 */
db.TipoVehiculo = sequelize.define(
  "TipoVehiculo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    descripcion: DataTypes.STRING(255),
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "tipos_vehiculo",
    timestamps: false,
  }
);

/**
 * Modelo: Vehiculo
 */
db.Vehiculo = sequelize.define(
  "Vehiculo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigo_vehiculo: {
      type: DataTypes.STRING(10),
      unique: true,
    },
    nombre: DataTypes.STRING(100),
    placa: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    marca: DataTypes.STRING(50),
    soat: DataTypes.STRING(50),
    fec_soat: DataTypes.DATE,
    fec_manten: DataTypes.DATE,
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "vehiculos",
    timestamps: false,
  }
);

/**
 * Modelo: PersonalSeguridad
 */
db.PersonalSeguridad = sequelize.define(
  "PersonalSeguridad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doc_tipo: {
      type: DataTypes.ENUM("DNI", "Carnet Extranjeria", "Pasaporte", "PTP"),
      defaultValue: "DNI",
    },
    doc_numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    apellido_paterno: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    apellido_materno: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    nombres: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    sexo: DataTypes.ENUM("Masculino", "Femenino"),
    fecha_nacimiento: DataTypes.DATE,
    nacionalidad: DataTypes.STRING(50),
    direccion: DataTypes.STRING(150),
    ubigeo_code: DataTypes.CHAR(6),
    cargo_id: DataTypes.INTEGER,
    fecha_ingreso: DataTypes.DATE,
    fecha_baja: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM("Activo", "Inactivo", "Suspendido", "Retirado"),
      defaultValue: "Activo",
    },
    licencia: DataTypes.STRING(20),
    categoria: DataTypes.STRING(20),
    vigencia: DataTypes.DATE,
    regimen: DataTypes.ENUM(
      "256",
      "276",
      "728",
      "1057 CAS",
      "Orden Servicio",
      "Practicante"
    ),
    vehiculo_id: DataTypes.INTEGER,
    codigo_acceso: DataTypes.STRING(45),
    foto: DataTypes.STRING(255),
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "personal_seguridad",
    timestamps: false,
  }
);

/**
 * Modelo: Sector
 */
db.Sector = sequelize.define(
  "Sector",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sector_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: DataTypes.TEXT,
    ubigeo: DataTypes.CHAR(6),
    zona_code: DataTypes.STRING(20),
    poligono_json: DataTypes.JSON,
    color_mapa: {
      type: DataTypes.STRING(7),
      defaultValue: "#3B82F6",
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "sectores",
    timestamps: false,
  }
);

/**
 * Modelo: Cuadrante
 */
db.Cuadrante = sequelize.define(
  "Cuadrante",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cuadrante_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    zona_code: DataTypes.STRING(20),
    latitud: DataTypes.DECIMAL(10, 8),
    longitud: DataTypes.DECIMAL(11, 8),
    poligono_json: DataTypes.JSON,
    radio_metros: DataTypes.INTEGER,
    color_mapa: {
      type: DataTypes.STRING(7),
      defaultValue: "#10B981",
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "cuadrantes",
    timestamps: false,
  }
);

/**
 * Modelo: UnidadOficina
 */
db.UnidadOficina = sequelize.define(
  "UnidadOficina",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipo_unidad: {
      type: DataTypes.ENUM(
        "SERENAZGO",
        "PNP",
        "BOMBEROS",
        "AMBULANCIA",
        "DEFENSA_CIVIL",
        "TRANSITO",
        "OTROS"
      ),
      allowNull: false,
    },
    telefono: DataTypes.STRING(20),
    email: DataTypes.STRING(100),
    direccion: DataTypes.STRING(255),
    ubigeo: DataTypes.CHAR(6),
    latitud: DataTypes.DECIMAL(10, 8),
    longitud: DataTypes.DECIMAL(11, 8),
    radio_cobertura_km: DataTypes.DECIMAL(5, 2),
    activo_24h: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    horario_inicio: DataTypes.TIME,
    horario_fin: DataTypes.TIME,
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "unidades_oficina",
    timestamps: false,
  }
);

/**
 * Modelo: TipoNovedad
 */
db.TipoNovedad = sequelize.define(
  "TipoNovedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: DataTypes.TEXT,
    icono: DataTypes.STRING(50),
    color_hex: {
      type: DataTypes.STRING(7),
      defaultValue: "#6B7280",
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    requiere_unidad: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "tipos_novedad",
    timestamps: false,
  }
);

/**
 * Modelo: SubtipoNovedad
 */
db.SubtipoNovedad = sequelize.define(
  "SubtipoNovedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtipo_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: DataTypes.TEXT,
    prioridad: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      defaultValue: "MEDIA",
    },
    tiempo_respuesta_min: DataTypes.INTEGER,
    requiere_ambulancia: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    requiere_bomberos: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    requiere_pnp: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "subtipos_novedad",
    timestamps: false,
  }
);

/**
 * Modelo: EstadoNovedad
 */
db.EstadoNovedad = sequelize.define(
  "EstadoNovedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    descripcion: DataTypes.STRING(255),
    color_hex: {
      type: DataTypes.STRING(7),
      defaultValue: "#6B7280",
    },
    icono: DataTypes.STRING(50),
    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    es_inicial: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    es_final: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    requiere_unidad: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "estados_novedad",
    timestamps: false,
  }
);

/**
 * Modelo: Novedad (Novedades/Incidentes)
 */
db.Novedad = sequelize.define(
  "Novedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    novedad_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tipo_icono_novedad: DataTypes.STRING(50),
    tipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtipo_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado_novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sector_id: DataTypes.INTEGER,
    cuadrante_id: DataTypes.INTEGER,
    localizacion: DataTypes.TEXT,
    referencia: DataTypes.STRING(255),
    latitud: DataTypes.DECIMAL(10, 8),
    longitud: DataTypes.DECIMAL(11, 8),
    ubigeo: DataTypes.CHAR(6),
    origen_llamada: {
      type: DataTypes.ENUM(
        "TELEFONO_107",
        "BOTON_PANICO",
        "CAMARA",
        "PATRULLAJE",
        "CIUDADANO",
        "INTERVENCION_DIRECTA",
        "OTROS"
      ),
      defaultValue: "TELEFONO_107",
    },
    reportante_nombre: DataTypes.STRING(150),
    reportante_telefono: DataTypes.STRING(20),
    reportante_dni: DataTypes.STRING(20),
    descripcion: DataTypes.TEXT,
    observaciones: DataTypes.TEXT,
    unidad_oficina_id: DataTypes.INTEGER,
    vehiculo_id: DataTypes.INTEGER,
    personal_cargo_id: DataTypes.INTEGER,
    fecha_despacho: DataTypes.DATE,
    fecha_llegada: DataTypes.DATE,
    fecha_cierre: DataTypes.DATE,
    km_inicial: DataTypes.DECIMAL(8, 2),
    km_final: DataTypes.DECIMAL(8, 2),
    tiempo_respuesta_min: DataTypes.INTEGER,
    turno: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
    parte_adjunto: DataTypes.STRING(255),
    fotos_adjuntas: DataTypes.JSON,
    videos_adjuntos: DataTypes.JSON,
    prioridad_actual: {
      type: DataTypes.ENUM("ALTA", "MEDIA", "BAJA"),
      defaultValue: "MEDIA",
    },
    requiere_seguimiento: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "novedades_incidentes",
    timestamps: false,
  }
);

/**
 * Modelo: HistorialEstadoNovedad
 */
db.HistorialEstadoNovedad = sequelize.define(
  "HistorialEstadoNovedad",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    novedad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado_anterior_id: DataTypes.INTEGER,
    estado_nuevo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: DataTypes.INTEGER,
    fecha_cambio: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    observaciones: DataTypes.TEXT,
    tiempo_en_estado_min: DataTypes.INTEGER,
  },
  {
    tableName: "historial_estados_novedad",
    timestamps: false,
  }
);

/**
 * Modelo: AbastecimientoCombustible
 */
db.AbastecimientoCombustible = sequelize.define(
  "AbastecimientoCombustible",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tipo_combustible: {
      type: DataTypes.ENUM(
        "GASOLINA_84",
        "GASOLINA_90",
        "GASOLINA_95",
        "GASOLINA_97",
        "DIESEL_B5",
        "DIESEL_B20",
        "GLP",
        "GNV"
      ),
      allowNull: false,
    },
    km_llegada: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    unidad: {
      type: DataTypes.ENUM("LITROS", "GALONES"),
      defaultValue: "LITROS",
    },
    importe: DataTypes.DECIMAL(8, 2),
    precio_unitario: DataTypes.DECIMAL(6, 2),
    grifo_nombre: DataTypes.STRING(100),
    grifo_ruc: DataTypes.STRING(11),
    factura_boleta: DataTypes.STRING(50),
    moneda: {
      type: DataTypes.ENUM("PEN", "USD"),
      defaultValue: "PEN",
    },
    personal_id: DataTypes.INTEGER,
    observaciones: DataTypes.TEXT,
    comprobante_adjunto: DataTypes.STRING(255),
    estado: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    deleted_at: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    created_by: DataTypes.INTEGER,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_by: DataTypes.INTEGER,
  },
  {
    tableName: "abastecimiento_combustible",
    timestamps: false,
  }
);

// ==================== RELACIONES ====================

// Vehículo <-> TipoVehiculo
db.Vehiculo.belongsTo(db.TipoVehiculo, {
  foreignKey: "tipo_id",
  as: "tipo",
});
db.TipoVehiculo.hasMany(db.Vehiculo, {
  foreignKey: "tipo_id",
  as: "vehiculos",
});

// PersonalSeguridad <-> Cargo
db.PersonalSeguridad.belongsTo(db.Cargo, {
  foreignKey: "cargo_id",
  as: "cargo",
});
db.Cargo.hasMany(db.PersonalSeguridad, {
  foreignKey: "cargo_id",
  as: "personal",
});

// PersonalSeguridad <-> Ubigeo
db.PersonalSeguridad.belongsTo(db.Ubigeo, {
  foreignKey: "ubigeo_code",
  as: "ubigeo",
});

// PersonalSeguridad <-> Vehiculo
db.PersonalSeguridad.belongsTo(db.Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo_asignado",
});
db.Vehiculo.hasOne(db.PersonalSeguridad, {
  foreignKey: "vehiculo_id",
  as: "personal_asignado",
});

// Sector <-> Ubigeo
db.Sector.belongsTo(db.Ubigeo, {
  foreignKey: "ubigeo",
  as: "ubigeo_rel",
});

// Cuadrante <-> Sector
db.Cuadrante.belongsTo(db.Sector, {
  foreignKey: "sector_id",
  as: "sector",
});
db.Sector.hasMany(db.Cuadrante, {
  foreignKey: "sector_id",
  as: "cuadrantes",
});

// UnidadOficina <-> Ubigeo
db.UnidadOficina.belongsTo(db.Ubigeo, {
  foreignKey: "ubigeo",
  as: "ubigeo_rel",
});

// SubtipoNovedad <-> TipoNovedad
db.SubtipoNovedad.belongsTo(db.TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "tipo",
});
db.TipoNovedad.hasMany(db.SubtipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "subtipos",
});

// Novedad <-> TipoNovedad
db.Novedad.belongsTo(db.TipoNovedad, {
  foreignKey: "tipo_novedad_id",
  as: "tipo",
});

// Novedad <-> SubtipoNovedad
db.Novedad.belongsTo(db.SubtipoNovedad, {
  foreignKey: "subtipo_novedad_id",
  as: "subtipo",
});

// Novedad <-> EstadoNovedad
db.Novedad.belongsTo(db.EstadoNovedad, {
  foreignKey: "estado_novedad_id",
  as: "estado",
});

// Novedad <-> Sector
db.Novedad.belongsTo(db.Sector, {
  foreignKey: "sector_id",
  as: "sector",
});

// Novedad <-> Cuadrante
db.Novedad.belongsTo(db.Cuadrante, {
  foreignKey: "cuadrante_id",
  as: "cuadrante",
});

// Novedad <-> UnidadOficina
db.Novedad.belongsTo(db.UnidadOficina, {
  foreignKey: "unidad_oficina_id",
  as: "unidad",
});

// Novedad <-> Vehiculo
db.Novedad.belongsTo(db.Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo",
});

// Novedad <-> PersonalSeguridad
db.Novedad.belongsTo(db.PersonalSeguridad, {
  foreignKey: "personal_cargo_id",
  as: "personal",
});

// Novedad <-> Ubigeo
db.Novedad.belongsTo(db.Ubigeo, {
  foreignKey: "ubigeo",
  as: "ubigeo_rel",
});

// HistorialEstadoNovedad <-> Novedad
db.HistorialEstadoNovedad.belongsTo(db.Novedad, {
  foreignKey: "novedad_id",
  as: "novedad",
});
db.Novedad.hasMany(db.HistorialEstadoNovedad, {
  foreignKey: "novedad_id",
  as: "historial",
});

// HistorialEstadoNovedad <-> EstadoNovedad
db.HistorialEstadoNovedad.belongsTo(db.EstadoNovedad, {
  foreignKey: "estado_anterior_id",
  as: "estado_anterior",
});
db.HistorialEstadoNovedad.belongsTo(db.EstadoNovedad, {
  foreignKey: "estado_nuevo_id",
  as: "estado_nuevo",
});

// AbastecimientoCombustible <-> Vehiculo
db.AbastecimientoCombustible.belongsTo(db.Vehiculo, {
  foreignKey: "vehiculo_id",
  as: "vehiculo",
});
db.Vehiculo.hasMany(db.AbastecimientoCombustible, {
  foreignKey: "vehiculo_id",
  as: "abastecimientos",
});

// AbastecimientoCombustible <-> PersonalSeguridad
db.AbastecimientoCombustible.belongsTo(db.PersonalSeguridad, {
  foreignKey: "personal_id",
  as: "personal",
});

// Agregar sequelize y Sequelize al objeto db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
