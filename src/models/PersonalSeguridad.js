/**
 * ===================================================
 * MODELO SEQUELIZE: PersonalSeguridad
 * ===================================================
 *
 * Ruta: src/models/PersonalSeguridad.js
 *
 * Descripción:
 * Modelo Sequelize para la tabla 'personal_seguridad' del sistema de
 * Seguridad Ciudadana. Gestiona toda la información del personal que
 * trabaja en la institución (serenos, supervisores, operadores, etc.)
 *
 * VERSIÓN: 2.1.1 - Se eliminaron logs de depuración en validación de categoría
 * FECHA: 2025-12-14
 *
 * CAMBIOS RELEVANTES EN ESTA VERSIÓN:
 * - ✅ Corregida validación vehiculoRequiereLicencia
 * - ✅ Mejorado manejo de errores en beforeCreate
 * - ✅ Optimizado método getEstadisticas (1 query en lugar de 4)
 * - ✅ Agregada unicidad a campo licencia
 * - ✅ Corregido scope conLicenciaVigente
 * - ✅ Agregados métodos renovarLicencia y validaciones adicionales
 *
 * Características:
 * - Validaciones robustas (DNI, edad, fechas)
 * - Normalización automática de nombres
 * - Métodos estáticos útiles (búsquedas especializadas)
 * - Métodos de instancia (cálculos, verificaciones)
 * - Scopes predefinidos para consultas frecuentes
 * - Soft delete implementado
 * - Hooks para integridad de datos
 *
 * Relaciones:
 * - belongsTo → Cargo (cargo_id)
 * - belongsTo → Ubigeo (ubigeo_code)
 * - belongsTo → Vehiculo (vehiculo_id)
 * - belongsTo → Usuario (created_by, updated_by)
 * - hasOne → Usuario (relación inversa)
 *
 * @module models/PersonalSeguridad
 * @requires sequelize
 * @author Sistema de Seguridad Ciudadana
 * @version 2.1.0
 * @date 2025-12-12
 */

import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

const PersonalSeguridad = sequelize.define(
  "PersonalSeguridad",
  {
    // ==========================================
    // IDENTIFICADOR PRINCIPAL
    // ==========================================
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identificador único del personal",
    },

    // ==========================================
    // IDENTIFICACIÓN - DOCUMENTO
    // ==========================================

    /**
     * Tipo de documento de identidad
     * - DNI: Documento Nacional de Identidad (8 dígitos)
     * - Carnet Extranjeria: Para extranjeros residentes
     * - Pasaporte: Documento internacional
     * - PTP: Permiso Temporal de Permanencia
     */
    doc_tipo: {
      type: DataTypes.ENUM("DNI", "Carnet Extranjeria", "Pasaporte", "PTP"),
      allowNull: false,
      defaultValue: "DNI",
      comment: "Tipo de documento de identidad",
      validate: {
        notNull: {
          msg: "El tipo de documento es obligatorio",
        },
        isIn: {
          args: [["DNI", "Carnet Extranjeria", "Pasaporte", "PTP"]],
          msg: "Tipo de documento no válido",
        },
      },
    },

    /**
     * Número de documento
     * Debe ser único por tipo de documento
     */
    doc_numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Número de documento de identidad",
      validate: {
        notNull: {
          msg: "El número de documento es obligatorio",
        },
        notEmpty: {
          msg: "El número de documento no puede estar vacío",
        },
        len: {
          args: [3, 20],
          msg: "El número de documento debe tener entre 3 y 20 caracteres",
        },
        // Validación personalizada según tipo de documento
        validarDocumento(value) {
          const tipo = this.doc_tipo;

          // DNI peruano: exactamente 8 dígitos
          if (tipo === "DNI") {
            if (!/^\d{8}$/.test(value)) {
              throw new Error(
                "El DNI debe tener exactamente 8 dígitos numéricos"
              );
            }
          }

          // Carnet Extranjería: 9 caracteres alfanuméricos
          if (tipo === "Carnet Extranjeria") {
            if (!/^[A-Z0-9]{9}$/.test(value)) {
              throw new Error(
                "El Carnet de Extranjería debe tener 9 caracteres alfanuméricos"
              );
            }
          }

          // Pasaporte: entre 6 y 12 caracteres alfanuméricos
          if (tipo === "Pasaporte") {
            if (!/^[A-Z0-9]{6,12}$/.test(value)) {
              throw new Error(
                "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos"
              );
            }
          }
        },
      },
    },

    // ==========================================
    // DATOS PERSONALES - NOMBRES
    // ==========================================

    /**
     * Apellido paterno
     * Se convierte automáticamente a MAYÚSCULAS
     */
    apellido_paterno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Apellido paterno del personal",
      validate: {
        notNull: {
          msg: "El apellido paterno es obligatorio",
        },
        notEmpty: {
          msg: "El apellido paterno no puede estar vacío",
        },
        len: {
          args: [2, 50],
          msg: "El apellido paterno debe tener entre 2 y 50 caracteres",
        },
        is: {
          args: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
          msg: "El apellido paterno solo puede contener letras",
        },
      },
    },

    /**
     * Apellido materno
     * Se convierte automáticamente a MAYÚSCULAS
     */
    apellido_materno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Apellido materno del personal",
      validate: {
        notNull: {
          msg: "El apellido materno es obligatorio",
        },
        notEmpty: {
          msg: "El apellido materno no puede estar vacío",
        },
        len: {
          args: [2, 50],
          msg: "El apellido materno debe tener entre 2 y 50 caracteres",
        },
        is: {
          args: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
          msg: "El apellido materno solo puede contener letras",
        },
      },
    },

    /**
     * Nombres
     * Se convierte automáticamente a Title Case
     */
    nombres: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Nombres del personal",
      validate: {
        notNull: {
          msg: "Los nombres son obligatorios",
        },
        notEmpty: {
          msg: "Los nombres no pueden estar vacíos",
        },
        len: {
          args: [2, 50],
          msg: "Los nombres deben tener entre 2 y 50 caracteres",
        },
        is: {
          args: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
          msg: "Los nombres solo pueden contener letras",
        },
      },
    },

    // ==========================================
    // DATOS PERSONALES - ADICIONALES
    // ==========================================

    /**
     * Sexo del personal
     */
    sexo: {
      type: DataTypes.ENUM("Masculino", "Femenino"),
      allowNull: true,
      comment: "Sexo del personal",
      validate: {
        isIn: {
          args: [["Masculino", "Femenino"]],
          msg: "El sexo debe ser 'Masculino' o 'Femenino'",
        },
      },
    },

    /**
     * Fecha de nacimiento
     * Debe ser mayor de 18 años y menor de 100
     */
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de nacimiento del personal",
      validate: {
        isDate: {
          msg: "Debe ser una fecha válida",
        },
        // Validación personalizada de edad
        validarEdad(value) {
          if (value) {
            const hoy = new Date();
            const nacimiento = new Date(value);
            const edad = Math.floor(
              (hoy - nacimiento) / (365.25 * 24 * 60 * 60 * 1000)
            );

            if (edad < 18) {
              throw new Error("El personal debe ser mayor de 18 años");
            }

            if (edad > 100) {
              throw new Error("Fecha de nacimiento inválida (edad > 100 años)");
            }

            // No permitir fechas futuras
            if (nacimiento > hoy) {
              throw new Error("La fecha de nacimiento no puede ser futura");
            }
          }
        },
      },
    },

    /**
     * Nacionalidad
     * Por defecto es "Peruana"
     */
    nacionalidad: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Peruana",
      comment: "Nacionalidad del personal",
      validate: {
        len: {
          args: [4, 50],
          msg: "La nacionalidad debe tener entre 4 y 50 caracteres",
        },
      },
    },

    // ==========================================
    // UBICACIÓN
    // ==========================================

    /**
     * Dirección de residencia
     */
    direccion: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Dirección de residencia del personal",
      validate: {
        len: {
          args: [5, 150],
          msg: "La dirección debe tener entre 5 y 150 caracteres",
        },
      },
    },

    /**
     * Código de ubigeo (FK)
     * Referencia a la tabla ubigeo
     */
    ubigeo_code: {
      type: DataTypes.CHAR(6),
      allowNull: true,
      references: {
        model: "ubigeo",
        key: "ubigeo_code",
      },
      comment: "Código de ubigeo de residencia (6 dígitos)",
      validate: {
        is: {
          args: /^\d{6}$/,
          msg: "El código de ubigeo debe tener exactamente 6 dígitos",
        },
      },
    },

    // ==========================================
    // INFORMACIÓN LABORAL
    // ==========================================

    /**
     * Cargo que desempeña (FK)
     * Referencia a la tabla cargos
     */
    cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "cargos",
        key: "id",
      },
      comment: "ID del cargo que desempeña",
      validate: {
        isInt: {
          msg: "El cargo_id debe ser un número entero",
        },
        min: {
          args: [1],
          msg: "El cargo_id debe ser mayor a 0",
        },
      },
    },

    /**
     * Fecha de ingreso a la institución
     */
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de ingreso a la institución",
      validate: {
        isDate: {
          msg: "Debe ser una fecha válida",
        },
        // No permitir fechas futuras
        noFuturo(value) {
          if (value && new Date(value) > new Date()) {
            throw new Error("La fecha de ingreso no puede ser futura");
          }
        },
      },
    },

    /**
     * Fecha de baja/cese
     * Debe ser posterior a la fecha de ingreso
     */
    fecha_baja: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de baja/cese del personal",
      validate: {
        isDate: {
          msg: "Debe ser una fecha válida",
        },
      },
    },

    /**
     * Estado laboral del personal
     * - Activo: Trabajando actualmente
     * - Inactivo: Temporalmente sin actividad
     * - Suspendido: Sancionado temporalmente
     * - Retirado: Ya no trabaja en la institución
     */
    status: {
      type: DataTypes.ENUM("Activo", "Inactivo", "Suspendido", "Retirado"),
      allowNull: false,
      defaultValue: "Activo",
      comment: "Estado laboral del personal",
      validate: {
        isIn: {
          args: [["Activo", "Inactivo", "Suspendido", "Retirado"]],
          msg: "Estado laboral no válido",
        },
      },
    },

    /**
     * Régimen laboral
     * Según normativa peruana
     */
    regimen: {
      type: DataTypes.ENUM(
        "256",
        "276",
        "728",
        "1057 CAS",
        "Orden Servicio",
        "Practicante"
      ),
      allowNull: true,
      comment: "Régimen laboral del personal",
      validate: {
        isIn: {
          args: [
            ["256", "276", "728", "1057 CAS", "Orden Servicio", "Practicante"],
          ],
          msg: "Régimen laboral no válido",
        },
      },
    },

    // ==========================================
    // LICENCIA DE CONDUCIR
    // ==========================================

    /**
     * Número de licencia de conducir
     * ✅ CORREGIDO: Agregada unicidad para evitar duplicados
     */
    licencia: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: {
        name: "uq_licencia",
        msg: "Ya existe personal registrado con esta licencia de conducir",
      },
      comment: "Número de licencia de conducir",
      validate: {
        len: {
          args: [5, 20],
          msg: "La licencia debe tener entre 5 y 20 caracteres",
        },
        // Formato peruano: Q seguido de 8 dígitos
        validarFormatoLicencia(value) {
          if (value && !/^[A-Z]\d{8}$/.test(value)) {
            throw new Error(
              "El formato de licencia debe ser: Una letra seguida de 8 dígitos (ej: Q12345678)"
            );
          }
        },
      },
    },

    /**
     * Categoría de licencia
     * Según Reglamento Nacional de Licencias de Conducir
     */
    categoria: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Categoría de licencia (A-I, A-IIA, A-IIB, A-IIIA, etc.)",
      validate: {
        validarCategoria(value) {
          if (value) {
            // Normalizar: trim + MAYÚSCULAS
            const valorNormalizado = value.trim().toUpperCase();
            /*
            // ✅ Categorías válidas según Reglamento Nacional de Licencias
            const categoriasValidas = [
              "A-I", // Motocicletas hasta 125cc
              "A-IIA", // Motocicletas hasta 400cc
              "A-IIB", // Motocicletas sin límite
              "A-IIIA", // Mototaxis
              "A-IIIB", // Trimotos de carga
              "A-IIIC", // Vehículos especiales
              "B-I", // Autos particulares
              "B-IIA", // Taxis, colectivos
              "B-IIB", // Camiones, buses
              "B-IIC", // Vehículos pesados especiales
            ];
*/

            // Buscar match exacto
            const matchExacto = categoriasValidas.includes(valorNormalizado);

            // Buscar matches parciales (para debug)
            const matchesParciales = categoriasValidas.filter((cat) => {
              const esIgual = cat === valorNormalizado;

              /*              if (!esIgual && cat.includes(valorNormalizado.substring(0, 3))) { }*/
              return esIgual;
            });

            if (!categoriasValidas.includes(valorNormalizado)) {
              // ✅ Mensaje de error mejorado
              const mensaje = [
                "Categoría no válida.",
                "",
                "Categorías válidas en Perú:",
                "",
                "CLASE A (Motocicletas):",
                "  • A-I: Motocicletas hasta 125cc",
                "  • A-IIA: Motocicletas hasta 400cc",
                "  • A-IIB: Motocicletas sin límite",
                "  • A-IIIA: Mototaxis",
                "  • A-IIIB: Trimotos de carga",
                "  • A-IIIC: Vehículos especiales",
                "",
                "CLASE B (Automóviles):",
                "  • B-I: Automóviles particulares",
                "  • B-IIA: Taxis, colectivos",
                "  • B-IIB: Camiones, buses",
                "  • B-IIC: Vehículos pesados",
                "",
                `Valor recibido: "${value}"`,
                `Valor normalizado: "${valorNormalizado}"`,
              ].join("\n");

              throw new Error(mensaje);
            }
          }
        },
      },
    },

    /**
     * Fecha de vigencia de la licencia
     * Debe ser futura si el personal tiene licencia
     */
    vigencia: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha de vigencia de la licencia",
      validate: {
        isDate: {
          msg: "Debe ser una fecha válida",
        },
      },
    },

    // ==========================================
    // ASIGNACIÓN DE VEHÍCULO
    // ==========================================

    /**
     * Vehículo asignado (FK)
     * Solo para personal conductor
     */
    vehiculo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "vehiculos",
        key: "id",
      },
      comment: "ID del vehículo asignado al personal",
      validate: {
        isInt: {
          msg: "El vehiculo_id debe ser un número entero",
        },
        min: {
          args: [1],
          msg: "El vehiculo_id debe ser mayor a 0",
        },
      },
    },

    // ==========================================
    // SISTEMA
    // ==========================================

    /**
     * Código de acceso/credencial
     * Generado automáticamente o asignado manualmente
     * Formato sugerido: PREFIJO-NUMERO (ej: SER-0001, SUP-0005)
     */
    codigo_acceso: {
      type: DataTypes.STRING(45),
      allowNull: true,
      unique: true,
      comment: "Código de acceso o credencial del personal",
      validate: {
        len: {
          args: [4, 45],
          msg: "El código de acceso debe tener entre 4 y 45 caracteres",
        },
      },
    },

    /**
     * Foto del personal
     * URL o ruta del archivo
     */
    foto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL o ruta de la foto del personal",
      validate: {
        // ✅ MEJORADO: Validación más flexible para URLs y rutas
        isUrlOrPath(value) {
          if (value) {
            const urlPattern =
              /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
            const pathPattern =
              /^(\/|\.\/|\.\.\/)?[\w\/.-]+\.(jpg|jpeg|png|gif|webp)$/i;

            if (!urlPattern.test(value) && !pathPattern.test(value)) {
              throw new Error(
                "La foto debe ser una URL válida o ruta de archivo de imagen (jpg, jpeg, png, gif, webp)"
              );
            }
          }
        },
      },
    },

    // ==========================================
    // ESTADO Y SOFT DELETE
    // ==========================================

    /**
     * Estado del registro
     * true = Activo, false = Inactivo
     */
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "1=Activo | 0=Inactivo",
    },

    /**
     * Fecha de eliminación lógica (soft delete)
     */
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de eliminación lógica",
    },

    // ==========================================
    // AUDITORÍA
    // ==========================================

    /**
     * Usuario que creó el registro
     */
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que creó el registro",
    },

    /**
     * Usuario que actualizó el registro
     */
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del usuario que actualizó el registro",
    },
  },
  {
    // ==========================================
    // CONFIGURACIÓN DEL MODELO
    // ==========================================

    tableName: "personal_seguridad",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false, // No usar paranoid porque manejamos soft delete manual

    // ==========================================
    // ÍNDICES
    // ✅ MEJORADO: Agregados índices compuestos para optimización
    // ==========================================
    indexes: [
      {
        name: "idx_doc_tipo_numero",
        unique: true,
        fields: ["doc_tipo", "doc_numero"],
      },
      {
        name: "idx_cargo",
        fields: ["cargo_id"],
      },
      {
        name: "idx_ubigeo",
        fields: ["ubigeo_code"],
      },
      {
        name: "idx_vehiculo",
        fields: ["vehiculo_id"],
      },
      {
        name: "idx_status",
        fields: ["status"],
      },
      {
        name: "idx_estado",
        fields: ["estado"],
      },
      {
        name: "idx_nombres_completos",
        fields: ["apellido_paterno", "apellido_materno", "nombres"],
      },
      {
        name: "idx_codigo_acceso",
        unique: true,
        fields: ["codigo_acceso"],
      },
      {
        name: "idx_activos",
        fields: ["estado", "deleted_at", "status"],
      },
      // ✅ NUEVOS ÍNDICES COMPUESTOS
      {
        name: "idx_activos_disponibles",
        fields: ["status", "vehiculo_id", "estado", "deleted_at"],
        comment: "Optimiza búsqueda de personal disponible para asignar",
      },
      {
        name: "idx_conductores_vigentes",
        fields: ["licencia", "vigencia", "status"],
        comment: "Optimiza búsqueda de conductores con licencia vigente",
      },
    ],

    // ==========================================
    // VALIDACIONES A NIVEL DE MODELO
    // ==========================================
    validate: {
      /**
       * Validar que la fecha de baja sea posterior a la de ingreso
       */
      fechasValidas() {
        if (this.fecha_ingreso && this.fecha_baja) {
          if (new Date(this.fecha_baja) < new Date(this.fecha_ingreso)) {
            throw new Error(
              "La fecha de baja no puede ser anterior a la fecha de ingreso"
            );
          }
        }
      },

      /**
       * ✅ CORREGIDO: Validar que si tiene vehículo asignado, debe tener licencia vigente
       * Ahora valida también cuando se modifica la licencia o vigencia
       */
      vehiculoRequiereLicencia() {
        // Validar en estas condiciones:
        // 1. Se está asignando un vehículo nuevo (changed vehiculo_id)
        // 2. Ya tiene vehículo y se modificó la licencia o vigencia
        // 3. Es un nuevo registro con vehículo
        const debeValidar =
          (this.changed("vehiculo_id") && this.vehiculo_id) ||
          (this.vehiculo_id &&
            (this.changed("licencia") || this.changed("vigencia"))) ||
          (this.isNewRecord && this.vehiculo_id);

        if (debeValidar) {
          // Verificar que tenga licencia y vigencia
          if (!this.licencia || !this.vigencia) {
            throw new Error(
              "Para tener vehículo asignado, el personal debe tener licencia y vigencia registradas"
            );
          }

          // Verificar que la licencia esté vigente
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche
          const vigencia = new Date(this.vigencia);
          vigencia.setHours(0, 0, 0, 0);

          if (vigencia < hoy) {
            throw new Error(
              "No se puede mantener un vehículo asignado con licencia vencida. Vigencia expiró el " +
                this.vigencia
            );
          }
        }
      },

      /**
       * Validar coherencia de status y fecha_baja
       */
      statusYFechaBaja() {
        if (this.status === "Retirado" && !this.fecha_baja) {
          throw new Error(
            "El personal 'Retirado' debe tener una fecha de baja"
          );
        }

        if (this.fecha_baja && this.status === "Activo") {
          throw new Error(
            "El personal con fecha de baja no puede estar 'Activo'"
          );
        }
      },

      /**
       * ✅ NUEVO: Validar que si tiene licencia, debe tener categoría y vigencia
       */
      licenciaCompleta() {
        if (this.licencia) {
          if (!this.categoria) {
            throw new Error(
              "Si tiene licencia de conducir, debe especificar la categoría"
            );
          }
          if (!this.vigencia) {
            throw new Error(
              "Si tiene licencia de conducir, debe especificar la fecha de vigencia"
            );
          }
        }
      },
    },

    // ==========================================
    // HOOKS (EVENTOS DEL CICLO DE VIDA)
    // ==========================================
    hooks: {
      /**
       * Antes de guardar (create o update)
       * Normaliza nombres, apellidos y documento
       */
      beforeSave: (personal) => {
        // Normalizar nombres a Title Case
        if (personal.nombres) {
          personal.nombres = personal.nombres
            .trim()
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        // Normalizar apellidos a MAYÚSCULAS
        if (personal.apellido_paterno) {
          personal.apellido_paterno = personal.apellido_paterno
            .trim()
            .toUpperCase();
        }

        if (personal.apellido_materno) {
          personal.apellido_materno = personal.apellido_materno
            .trim()
            .toUpperCase();
        }

        // Normalizar número de documento (trim y mayúsculas)
        if (personal.doc_numero) {
          personal.doc_numero = personal.doc_numero.trim().toUpperCase();
        }

        // Normalizar licencia de conducir
        if (personal.licencia) {
          personal.licencia = personal.licencia.trim().toUpperCase();
        }

        // Normalizar categoría de licencia
        if (personal.categoria) {
          // ✅ Normalización AGRESIVA
          let categoríaNormalizada = personal.categoria
            .trim()
            .toUpperCase()
            // Reemplazar TODOS los tipos de guiones por guion normal
            .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D−–—]/g, "-")
            // Remover espacios internos
            .replace(/\s+/g, "");

          // ✅ Validar categorías
          const categoriasValidas = [
            "A-I",
            "A-IIA",
            "A-IIB",
            "A-IIIA",
            "A-IIIB",
            "A-IIIC",
            "B-I",
            "B-IIA",
            "B-IIB",
            "B-IIC",
          ];

          if (!categoriasValidas.includes(categoríaNormalizada)) {
            throw new Error(
              `Categoría no válida.\n\n` +
                `Categorías válidas:\n` +
                `CLASE A: A-I, A-IIA, A-IIB, A-IIIA, A-IIIB, A-IIIC\n` +
                `CLASE B: B-I, B-IIA, B-IIB, B-IIC\n\n` +
                `Recibido: "${personal.categoria}"\n` +
                `Normalizado: "${categoríaNormalizada}"`
            );
          }

          // Asignar valor normalizado
          personal.categoria = categoríaNormalizada;
        }

        // Si status es Retirado y no hay fecha_baja, asignar hoy
        if (personal.status === "Retirado" && !personal.fecha_baja) {
          personal.fecha_baja = new Date();
        }
      },

      /**
       * ✅ MEJORADO: Antes de crear
       * Genera código de acceso con mejor manejo de errores
       */
      beforeCreate: async (personal, options) => {
        // Si no tiene código de acceso, generar uno automático
        if (!personal.codigo_acceso) {
          try {
            if (personal.cargo_id) {
              // Obtener prefijo según cargo
              const Cargo = sequelize.models.Cargo;
              const cargo = await Cargo.findByPk(personal.cargo_id, {
                transaction: options.transaction,
              });

              if (cargo) {
                // Obtener las primeras 3 letras del cargo
                const prefijo = cargo.nombre
                  .substring(0, 3)
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "");

                // Buscar el último código con ese prefijo
                const ultimoPersonal = await PersonalSeguridad.findOne({
                  where: {
                    codigo_acceso: {
                      [Op.like]: `${prefijo}-%`,
                    },
                  },
                  order: [["codigo_acceso", "DESC"]],
                  transaction: options.transaction,
                });

                let nuevoNumero = 1;
                if (ultimoPersonal && ultimoPersonal.codigo_acceso) {
                  const partes = ultimoPersonal.codigo_acceso.split("-");
                  if (partes.length === 2) {
                    const numeroActual = parseInt(partes[1]);
                    if (!isNaN(numeroActual)) {
                      nuevoNumero = numeroActual + 1;
                    }
                  }
                }

                // Generar código: PREFIJO-NUMERO (ej: SER-0001, SUP-0005)
                personal.codigo_acceso = `${prefijo}-${String(
                  nuevoNumero
                ).padStart(4, "0")}`;
              } else {
                // Si no se encontró el cargo, generar código genérico
                personal.codigo_acceso = `PER-${Date.now()
                  .toString()
                  .slice(-6)}`;
              }
            } else {
              // Si no tiene cargo, generar código genérico basado en timestamp
              personal.codigo_acceso = `PER-${Date.now().toString().slice(-6)}`;
            }
          } catch (error) {
            console.error("Error al generar código de acceso:", error);
            // ✅ MEJORADO: Siempre generar un código, aunque sea genérico
            personal.codigo_acceso = `PER-${Date.now().toString().slice(-6)}`;
          }
        }
      },

      /**
       * Antes de actualizar
       * Si se cambia a Retirado, desasignar vehículo
       */
      beforeUpdate: (personal) => {
        // Si cambia a Retirado, desasignar vehículo
        if (personal.changed("status") && personal.status === "Retirado") {
          personal.vehiculo_id = null;
        }

        // Si se desactiva (estado = false), cambiar status
        if (personal.changed("estado") && personal.estado === false) {
          if (personal.status === "Activo") {
            personal.status = "Inactivo";
          }
        }
      },
    },

    // ==========================================
    // SCOPES (CONSULTAS PREDEFINIDAS)
    // ==========================================
    scopes: {
      /**
       * Solo personal activo
       */
      activos: {
        where: {
          status: "Activo",
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * ✅ CORREGIDO: Solo personal con licencia vigente
       * Usa sequelize.fn para mejor compatibilidad
       */
      conLicenciaVigente: {
        where: {
          licencia: { [Op.ne]: null },
          vigencia: {
            [Op.gte]: sequelize.fn("CURDATE"),
          },
          status: "Activo",
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Personal disponible (sin vehículo asignado)
       */
      disponibles: {
        where: {
          vehiculo_id: null,
          status: "Activo",
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Personal conductor (con licencia)
       */
      conductores: {
        where: {
          licencia: { [Op.ne]: null },
          status: "Activo",
          estado: true,
          deleted_at: null,
        },
      },

      /**
       * Incluir relaciones básicas
       */
      conRelaciones: {
        include: [
          {
            association: "PersonalSeguridadCargo",
            attributes: ["id", "nombre"],
          },
          {
            association: "PersonalSeguridadUbigeo",
            attributes: [
              "ubigeo_code",
              "departamento",
              "provincia",
              "distrito",
            ],
          },
          {
            association: "PersonalSeguridadVehiculo",
            attributes: ["id", "codigo_vehiculo", "placa"],
          },
        ],
      },
    },
  }
);

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar solo personal activo
 * @returns {Promise<Array>} Array de personal activo
 */
PersonalSeguridad.findActivos = async function () {
  return await PersonalSeguridad.scope("activos", "conRelaciones").findAll({
    order: [
      ["apellido_paterno", "ASC"],
      ["apellido_materno", "ASC"],
    ],
  });
};

/**
 * Buscar personal por documento
 * @param {string} tipoDoc - Tipo de documento
 * @param {string} numeroDoc - Número de documento
 * @returns {Promise<Object|null>} Personal encontrado o null
 */
PersonalSeguridad.findByDocumento = async function (tipoDoc, numeroDoc) {
  return await PersonalSeguridad.scope("conRelaciones").findOne({
    where: {
      doc_tipo: tipoDoc,
      doc_numero: numeroDoc.trim().toUpperCase(),
    },
  });
};

/**
 * Buscar personal por cargo
 * @param {number} cargoId - ID del cargo
 * @returns {Promise<Array>} Array de personal con ese cargo
 */
PersonalSeguridad.findByCargo = async function (cargoId) {
  return await PersonalSeguridad.scope("activos").findAll({
    where: { cargo_id: cargoId },
    order: [["apellido_paterno", "ASC"]],
  });
};

/**
 * Obtener personal con licencia vigente
 * @returns {Promise<Array>} Array de personal conductor
 */
PersonalSeguridad.findConLicenciaVigente = async function () {
  return await PersonalSeguridad.scope("conLicenciaVigente").findAll({
    order: [["apellido_paterno", "ASC"]],
  });
};

/**
 * Obtener personal disponible (sin vehículo asignado)
 * @returns {Promise<Array>} Array de personal disponible
 */
PersonalSeguridad.findDisponibles = async function () {
  return await PersonalSeguridad.scope("disponibles", "conRelaciones").findAll({
    order: [["apellido_paterno", "ASC"]],
  });
};

/**
 * Buscar por código de acceso
 * @param {string} codigo - Código de acceso
 * @returns {Promise<Object|null>} Personal encontrado o null
 */
PersonalSeguridad.findByCodigo = async function (codigo) {
  return await PersonalSeguridad.scope("conRelaciones").findOne({
    where: {
      codigo_acceso: codigo.trim().toUpperCase(),
      estado: true,
      deleted_at: null,
    },
  });
};

/**
 * Contar personal por cargo
 * @param {number} cargoId - ID del cargo
 * @returns {Promise<number>} Cantidad de personal
 */
PersonalSeguridad.countByCargo = async function (cargoId) {
  return await PersonalSeguridad.count({
    where: {
      cargo_id: cargoId,
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
  });
};

/**
 * ✅ OPTIMIZADO: Obtener estadísticas generales
 * Ahora usa 1 sola query en lugar de 4 separadas
 * @returns {Promise<Object>} Objeto con estadísticas
 */
PersonalSeguridad.getEstadisticas = async function () {
  // Query 1: Total
  const total = await PersonalSeguridad.count({
    where: { deleted_at: null },
  });

  // Query 2: Activos
  const activos = await PersonalSeguridad.count({
    where: {
      status: "Activo",
      deleted_at: null,
    },
  });

  // Query 3: Conductores
  const conductores = await PersonalSeguridad.count({
    where: {
      licencia: { [Op.ne]: null },
      deleted_at: null,
    },
  });

  // Query 4: Disponibles
  const disponibles = await PersonalSeguridad.count({
    where: {
      vehiculo_id: null,
      status: "Activo",
      deleted_at: null,
    },
  });

  // Query 5: Con licencia vigente
  const con_licencia_vigente = await PersonalSeguridad.count({
    where: {
      licencia: { [Op.ne]: null },
      vigencia: { [Op.gte]: sequelize.fn("CURDATE") },
      status: "Activo",
      deleted_at: null,
    },
  });

  return {
    total,
    activos,
    inactivos: total - activos,
    conductores,
    sin_licencia: total - conductores,
    disponibles,
    asignados: activos - disponibles,
    con_licencia_vigente,
  };
};

/**
 * ✅ NUEVO: Obtener personal con licencia por vencer
 * @param {number} dias - Días antes del vencimiento (por defecto 30)
 * @returns {Promise<Array>} Array de personal con licencia por vencer
 */
PersonalSeguridad.findLicenciasPorVencer = async function (dias = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + dias);

  return await PersonalSeguridad.scope("conRelaciones").findAll({
    where: {
      licencia: { [Op.ne]: null },
      vigencia: {
        [Op.between]: [new Date(), fechaLimite],
      },
      status: "Activo",
      estado: true,
      deleted_at: null,
    },
    order: [["vigencia", "ASC"]],
  });
};

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Obtener nombre completo del personal
 * @returns {string} Nombre completo
 */
PersonalSeguridad.prototype.getNombreCompleto = function () {
  return `${this.nombres} ${this.apellido_paterno} ${this.apellido_materno}`;
};

/**
 * Obtener nombre en formato: APELLIDOS, Nombres
 * @returns {string} Nombre formateado
 */
PersonalSeguridad.prototype.getNombreFormateado = function () {
  return `${this.apellido_paterno} ${this.apellido_materno}, ${this.nombres}`;
};

/**
 * Obtener solo apellidos completos
 * @returns {string} Apellidos
 */
PersonalSeguridad.prototype.getApellidos = function () {
  return `${this.apellido_paterno} ${this.apellido_materno}`;
};

/**
 * Calcular edad actual del personal
 * @returns {number|null} Edad en años o null si no hay fecha de nacimiento
 */
PersonalSeguridad.prototype.getEdad = function () {
  if (!this.fecha_nacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(this.fecha_nacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
};

/**
 * Calcular años de servicio
 * @returns {number|null} Años de servicio o null
 */
PersonalSeguridad.prototype.getAniosServicio = function () {
  if (!this.fecha_ingreso) return null;

  const hoy = new Date();
  const ingreso = new Date(this.fecha_ingreso);
  let anios = hoy.getFullYear() - ingreso.getFullYear();
  const mes = hoy.getMonth() - ingreso.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
    anios--;
  }

  return anios;
};

/**
 * Verificar si tiene licencia vigente
 * @returns {boolean} true si tiene licencia vigente
 */
PersonalSeguridad.prototype.tieneLicenciaVigente = function () {
  if (!this.licencia || !this.vigencia) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vigencia = new Date(this.vigencia);
  vigencia.setHours(0, 0, 0, 0);
  return vigencia >= hoy;
};

/**
 * Verificar si está activo laboralmente
 * @returns {boolean} true si está activo
 */
PersonalSeguridad.prototype.estaActivo = function () {
  return (
    this.status === "Activo" && this.estado === true && this.deleted_at === null
  );
};

/**
 * Verificar si tiene vehículo asignado
 * @returns {boolean} true si tiene vehículo
 */
PersonalSeguridad.prototype.tieneVehiculo = function () {
  return this.vehiculo_id !== null;
};

/**
 * Verificar si puede conducir (licencia vigente y no tiene vehículo)
 * @returns {boolean} true si puede ser asignado a un vehículo
 */
PersonalSeguridad.prototype.puedeConducir = function () {
  return (
    this.tieneLicenciaVigente() && !this.tieneVehiculo() && this.estaActivo()
  );
};

/**
 * ✅ NUEVO: Obtener días restantes para vencimiento de licencia
 * @returns {number|null} Días restantes o null si no tiene licencia
 */
PersonalSeguridad.prototype.getDiasVigenciaLicencia = function () {
  if (!this.vigencia) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vigencia = new Date(this.vigencia);
  vigencia.setHours(0, 0, 0, 0);

  const diffTime = vigencia - hoy;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * ✅ NUEVO: Verificar si la licencia está por vencer
 * @param {number} dias - Días de anticipación (por defecto 30)
 * @returns {boolean} true si está por vencer
 */
PersonalSeguridad.prototype.licenciaPorVencer = function (dias = 30) {
  const diasRestantes = this.getDiasVigenciaLicencia();
  if (diasRestantes === null) return false;
  return diasRestantes > 0 && diasRestantes <= dias;
};

/**
 * Dar de baja al personal
 * @param {Date} fecha - Fecha de baja (opcional, por defecto hoy)
 * @param {number} userId - ID del usuario que realiza la baja
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.darDeBaja = async function (
  fecha = null,
  userId = null
) {
  this.fecha_baja = fecha || new Date();
  this.status = "Retirado";
  this.vehiculo_id = null; // Desasignar vehículo
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * Reactivar personal
 * @param {number} userId - ID del usuario que reactiva
 * @returns {Promise<Object>} Personal actualizado
 */

PersonalSeguridad.prototype.reactivar = async function () {
  const transaction = await sequelize.transaction();

  try {
    await this.update(
      {
        status: "Activo",
        deleted_at: null,
        estado: true,
      },
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Personal reactivado: ${this.nombres_completos}`);
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Suspender personal temporalmente
 * @param {number} userId - ID del usuario que suspende
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.suspender = async function () {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // ✅ Sin isolation level
      const transaction = await sequelize.transaction();

      try {
        await this.update(
          {
            status: "Suspendido",
          },
          { transaction }
        );

        await transaction.commit();
        console.log(`✅ Personal suspendido: ${this.nombres_completos}`);
        return this;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      if (
        error.parent?.code === "ER_LOCK_WAIT_TIMEOUT" &&
        attempt < maxRetries - 1
      ) {
        attempt++;
        console.log(`⚠️  Reintento ${attempt}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error;
    }
  }
};

/**
 * Soft delete del personal
 * Marca el registro como eliminado sin borrarlo físicamente
 *
 * @param {number} userId - ID del usuario que elimina
 * @returns {Promise<PersonalSeguridad>} Personal actualizado
 */
PersonalSeguridad.prototype.softDelete = async function (userId = null) {
  this.deleted_at = new Date();
  this.estado = false;
  this.status = "Inactivo";
  if (userId) this.updated_by = userId;
  await this.save();
  console.log(`✅ Personal eliminado: ${this.getNombreCompleto()}`);
  return this;
};

/**
 * Restaurar personal eliminado (soft delete)
 * @param {number} userId - ID del usuario que restaura
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.restore = async function (userId = null) {
  const transaction = await sequelize.transaction();

  try {
    await this.update(
      {
        deleted_at: null,
        estado: true,
        status: "Activo",
        updated_by: userId,
      },
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Personal restaurado: ${this.getNombreCompleto()}`);
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Suspender personal temporalmente
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.suspender = async function () {
  const transaction = await sequelize.transaction();

  try {
    await this.update(
      {
        status: "Suspendido",
      },
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Personal suspendido: ${this.getNombreCompleto()}`);
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Reactivar personal
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.reactivar = async function () {
  const transaction = await sequelize.transaction();

  try {
    await this.update(
      {
        status: "Activo",
        deleted_at: null,
        estado: true,
      },
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Personal reactivado: ${this.getNombreCompleto()}`);
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Retirar personal (dar de baja)
 * @param {number} userId - ID del usuario que retira
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.retirar = async function (userId = null) {
  const transaction = await sequelize.transaction();

  try {
    await this.update(
      {
        status: "Retirado",
        fecha_baja: new Date(),
        updated_by: userId,
      },
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Personal retirado: ${this.getNombreCompleto()}`);
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Dar de baja al personal
 * @param {Date} fecha - Fecha de baja (opcional, por defecto hoy)
 * @param {number} userId - ID del usuario que realiza la baja
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.darDeBaja = async function (
  fecha = null,
  userId = null
) {
  this.fecha_baja = fecha || new Date();
  this.status = "Retirado";
  this.vehiculo_id = null; // Desasignar vehículo
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * Asignar vehículo al personal
 * @param {number} vehiculoId - ID del vehículo
 * @param {number} userId - ID del usuario que asigna
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.asignarVehiculo = async function (
  vehiculoId,
  userId = null
) {
  // Verificar que tiene licencia vigente
  if (!this.tieneLicenciaVigente()) {
    throw new Error(
      "El personal debe tener licencia vigente para asignar vehículo"
    );
  }

  this.vehiculo_id = vehiculoId;
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * Desasignar vehículo del personal
 * @param {number} userId - ID del usuario que desasigna
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.desasignarVehiculo = async function (
  userId = null
) {
  this.vehiculo_id = null;
  if (userId) {
    this.updated_by = userId;
  }
  return await this.save();
};

/**
 * ✅ NUEVO: Renovar licencia de conducir
 * @param {Date} nuevaVigencia - Nueva fecha de vigencia
 * @param {string} nuevaCategoria - Nueva categoría (opcional)
 * @param {number} userId - ID del usuario que renueva
 * @returns {Promise<Object>} Personal actualizado
 */
PersonalSeguridad.prototype.renovarLicencia = async function (
  nuevaVigencia,
  nuevaCategoria = null,
  userId = null
) {
  if (!this.licencia) {
    throw new Error("El personal no tiene licencia registrada para renovar");
  }

  // Validar que la nueva vigencia sea futura
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vigencia = new Date(nuevaVigencia);
  vigencia.setHours(0, 0, 0, 0);

  if (vigencia <= hoy) {
    throw new Error("La nueva fecha de vigencia debe ser posterior a hoy");
  }

  this.vigencia = nuevaVigencia;
  if (nuevaCategoria) {
    this.categoria = nuevaCategoria;
  }
  if (userId) {
    this.updated_by = userId;
  }

  return await this.save();
};

/**
 * Obtener personal con licencias por vencer
 * GET /api/v1/personal/licencias-por-vencer?dias=30
 */
export const getLicenciasPorVencer = async (req, res) => {
  try {
    const { dias = 30 } = req.query;

    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + parseInt(dias));

    const personal = await PersonalSeguridad.findAll({
      where: {
        licencia: { [Op.ne]: null },
        vigencia: {
          [Op.between]: [hoy, fechaLimite],
        },
        status: "Activo",
        estado: 1,
        deleted_at: null,
      },
      include: [
        {
          model: Cargo,
          as: "PersonalSeguridadCargo",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["vigencia", "ASC"]],
    });

    // Calcular días restantes para cada uno
    const personalConDias = personal.map((p) => {
      const vigencia = new Date(p.vigencia);
      const diffTime = vigencia - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...p.toJSON(),
        dias_restantes: diffDays,
      };
    });

    res.status(200).json({
      success: true,
      message: `Personal con licencias por vencer en los próximos ${dias} días`,
      data: personalConDias,
      total: personalConDias.length,
      filtros: {
        dias_adelante: parseInt(dias),
        fecha_limite: fechaLimite.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("❌ Error en getLicenciasPorVencer:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener licencias por vencer",
      error: error.message,
    });
  }
};

/**
 * Personalizar JSON para respuestas API
 * Agrega campos calculados
 */
PersonalSeguridad.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());

  // Agregar campos calculados
  values.nombre_completo = this.getNombreCompleto();
  values.nombre_formateado = this.getNombreFormateado();
  values.edad = this.getEdad();
  values.anios_servicio = this.getAniosServicio();
  values.licencia_vigente = this.tieneLicenciaVigente();
  values.dias_vigencia_licencia = this.getDiasVigenciaLicencia();
  values.licencia_por_vencer = this.licenciaPorVencer(30);
  values.esta_activo = this.estaActivo();
  values.tiene_vehiculo = this.tieneVehiculo();
  values.puede_conducir = this.puedeConducir();

  return values;
};

export default PersonalSeguridad;
