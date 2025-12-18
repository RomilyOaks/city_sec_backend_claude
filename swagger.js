import swaggerAutogen from "swagger-autogen";

import fs from "fs";

const outputFile = "./swagger_output.json";
const endpointsFiles = [
  "./src/app.js",
  "./src/routes/auth.routes.js",
  "./src/routes/usuarios.routes.js",
  "./src/routes/roles.routes.js",
  "./src/routes/permisos.routes.js",
  "./src/routes/catalogos.routes.js",
  "./src/routes/novedades.routes.js",
  "./src/routes/personal.routes.js",
  "./src/routes/sectores.routes.js",
  "./src/routes/vehiculos.routes.js",
  "./src/routes/cuadrantes.routes.js",
  "./src/routes/auditoriaAcciones.routes.js",
  "./src/routes/abastecimientos.routes.js",
  "./src/routes/mantenimientos.routes.js",
  "./src/routes/talleres.routes.js",
  "./src/routes/reportes.routes.js",
  "./src/routes/cargos.routes.js",
  "./src/routes/tipo-novedad.routes.js",
  "./src/routes/subtipo-novedad.routes.js",
  "./src/routes/estado-novedad.routes.js",
  "./src/routes/unidad-oficina.routes.js",
];

const swaggerServerUrl = process.env.SWAGGER_SERVER_URL;

const doc = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation for Citizen Security System",
    description:
      "API Backend para Sistema de Seguridad Ciudadana con autenticación JWT y RBAC",
  },
  ...(swaggerServerUrl
    ? {
        servers: [
          {
            url: swaggerServerUrl,
            description: process.env.NODE_ENV || "development",
          },
        ],
      }
    : {}),
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error" },
          code: { type: "string", nullable: true, example: "INTERNAL_ERROR" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", example: "jperez" },
          email: { type: "string", example: "jperez@example.com" },
          password: { type: "string", example: "SecurePass123!" },
          nombres: { type: "string", nullable: true, example: "Juan" },
          apellidos: { type: "string", nullable: true, example: "Pérez" },
          telefono: { type: "string", nullable: true, example: "+593999999999" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["password"],
        properties: {
          username_or_email: { type: "string", example: "admin" },
          username: { type: "string", example: "admin" },
          email: { type: "string", example: "admin@example.com" },
          password: { type: "string", example: "Admin123!" },
        },
      },
      TokenRefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
      },
      AuthTokensResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login exitoso" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              usuario: { $ref: "#/components/schemas/UsuarioPublic" },
            },
          },
        },
      },
      UsuarioPublic: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          username: { type: "string", example: "admin" },
          email: { type: "string", example: "admin@example.com" },
          nombres: { type: "string", nullable: true },
          apellidos: { type: "string", nullable: true },
          foto_perfil: { type: "string", nullable: true },
          roles: {
            type: "array",
            items: { $ref: "#/components/schemas/Rol" },
          },
          permisos: {
            type: "array",
            items: { type: "string", example: "usuarios.roles.read" },
          },
        },
      },
      Rol: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "Super Administrador" },
          slug: { type: "string", example: "super_admin" },
          descripcion: { type: "string", nullable: true },
          nivel_jerarquia: { type: "integer", nullable: true, example: 1 },
          color: { type: "string", nullable: true, example: "#6B7280" },
        },
      },
      RolCreateRequest: {
        type: "object",
        required: ["nombre", "slug"],
        properties: {
          nombre: { type: "string", example: "Auditor" },
          slug: { type: "string", example: "auditor" },
          descripcion: { type: "string", nullable: true },
          nivel_jerarquia: { type: "integer", nullable: true, example: 5 },
          color: { type: "string", nullable: true, example: "#6B7280" },
          permisos: { type: "array", items: { type: "integer" }, nullable: true },
        },
      },
      RolUpdateRequest: {
        type: "object",
        properties: {
          nombre: { type: "string", nullable: true },
          descripcion: { type: "string", nullable: true },
          nivel_jerarquia: { type: "integer", nullable: true },
          color: { type: "string", nullable: true },
        },
      },
      RoleAssignPermisosRequest: {
        type: "object",
        required: ["permisos"],
        properties: {
          permisos: { type: "array", items: { type: "integer" }, example: [1, 2, 3] },
        },
      },
      Permiso: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          slug: { type: "string", example: "usuarios.roles.read" },
          modulo: { type: "string", example: "usuarios" },
          recurso: { type: "string", example: "roles" },
          accion: { type: "string", example: "read" },
          descripcion: { type: "string", nullable: true },
          estado: { type: "boolean", example: true },
        },
      },

      UsuarioAdminCreateRequest: {
        type: "object",
        required: ["username", "email", "password", "nombres", "apellidos"],
        properties: {
          username: { type: "string", example: "jdoe" },
          email: { type: "string", example: "jdoe@example.com" },
          password: { type: "string", example: "SecurePass123" },
          nombres: { type: "string", example: "John" },
          apellidos: { type: "string", example: "Doe" },
          telefono: { type: "string", nullable: true, example: "0999999999" },
          roles: { type: "array", items: { type: "integer" }, nullable: true, example: [1, 2] },
        },
      },
      UsuarioAdminUpdateRequest: {
        type: "object",
        properties: {
          username: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          nombres: { type: "string", nullable: true },
          apellidos: { type: "string", nullable: true },
          telefono: { type: "string", nullable: true },
          roles: { type: "array", items: { type: "integer" }, nullable: true },
          estado: { type: "integer", nullable: true, example: 1 },
        },
      },
      UsuarioResetPasswordRequest: {
        type: "object",
        required: ["newPassword"],
        properties: {
          newPassword: { type: "string", example: "NewPass123" },
        },
      },
      UsuarioCambiarEstadoRequest: {
        type: "object",
        required: ["estado"],
        properties: {
          estado: { type: "integer", enum: [0, 1], example: 1 },
          motivo: { type: "string", nullable: true, example: "Reactivación" },
        },
      },
      UsuarioAssignRolesRequest: {
        type: "object",
        required: ["roles"],
        properties: {
          roles: { type: "array", items: { type: "integer" }, example: [2, 3] },
          es_principal: { type: "integer", nullable: true, example: 2 },
        },
      },
      UsuarioPermisosConsolidadosResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              usuario_id: { type: "integer", example: 1 },
              username: { type: "string", example: "admin" },
              total_permisos: { type: "integer", example: 73 },
              permisos: { type: "array", items: { $ref: "#/components/schemas/Permiso" } },
            },
          },
        },
      },

      VehiculoCreateRequest: {
        type: "object",
        required: ["tipo_id", "unidad_oficina_id", "placa"],
        properties: {
          tipo_id: { type: "integer", example: 1 },
          unidad_oficina_id: { type: "integer", example: 1 },
          placa: { type: "string", example: "ABC-123" },
          codigo_vehiculo: { type: "string", nullable: true, example: "VH-001" },
          nombre_vehiculo: { type: "string", nullable: true, example: "Patrullero 01" },
          marca_vehiculo: { type: "string", nullable: true, example: "Toyota" },
          modelo_vehiculo: { type: "string", nullable: true, example: "Hilux" },
          anio_vehiculo: { type: "integer", nullable: true, example: 2022 },
          color_vehiculo: { type: "string", nullable: true, example: "Blanco" },
          numero_motor: { type: "string", nullable: true },
          numero_chasis: { type: "string", nullable: true },
          kilometraje_inicial: { type: "number", nullable: true, example: 0 },
          capacidad_combustible: { type: "number", nullable: true, example: 15 },
          conductor_asignado: { type: "integer", nullable: true, example: 10 },
          estado_operativo: { type: "string", nullable: true, example: "OPERATIVO" },
          soat: { type: "string", nullable: true },
          fecha_soat: { type: "string", nullable: true, example: "2025-12-31" },
          fecha_mantenimiento: { type: "string", nullable: true, example: "2025-01-10" },
          observaciones: { type: "string", nullable: true },
        },
      },
      VehiculoUpdateRequest: {
        type: "object",
        properties: {
          tipo_id: { type: "integer", nullable: true },
          unidad_oficina_id: { type: "integer", nullable: true },
          placa: { type: "string", nullable: true },
          codigo_vehiculo: { type: "string", nullable: true },
          nombre_vehiculo: { type: "string", nullable: true },
          marca_vehiculo: { type: "string", nullable: true },
          modelo_vehiculo: { type: "string", nullable: true },
          anio_vehiculo: { type: "integer", nullable: true },
          color_vehiculo: { type: "string", nullable: true },
          numero_motor: { type: "string", nullable: true },
          numero_chasis: { type: "string", nullable: true },
          conductor_asignado: { type: "integer", nullable: true },
          estado_operativo: { type: "string", nullable: true },
          soat: { type: "string", nullable: true },
          fecha_soat: { type: "string", nullable: true },
          fecha_mantenimiento: { type: "string", nullable: true },
          observaciones: { type: "string", nullable: true },
        },
      },
      VehiculoKilometrajeRequest: {
        type: "object",
        required: ["kilometraje_nuevo"],
        properties: {
          kilometraje_nuevo: { type: "number", example: 12345 },
          observaciones: { type: "string", nullable: true, example: "Actualización por mantenimiento" },
        },
      },
      VehiculoEstadoRequest: {
        type: "object",
        required: ["estado_operativo"],
        properties: {
          estado_operativo: { type: "string", example: "OPERATIVO" },
          observaciones: { type: "string", nullable: true },
        },
      },
      VehiculoAbastecimientoRequest: {
        type: "object",
        required: ["fecha_hora", "tipo_combustible", "cantidad_galones"],
        properties: {
          fecha_hora: { type: "string", example: "2025-12-18T12:00:00.000Z" },
          tipo_combustible: { type: "string", example: "GASOLINA" },
          cantidad_galones: { type: "number", example: 5 },
          precio_galon: { type: "number", nullable: true, example: 4.5 },
          km_actual: { type: "number", nullable: true, example: 12345 },
          grifo: { type: "string", nullable: true, example: "Primax" },
          observaciones: { type: "string", nullable: true },
        },
      },

      PersonalCreateRequest: {
        type: "object",
        required: ["doc_tipo", "doc_numero", "apellido_paterno", "apellido_materno", "nombres"],
        properties: {
          doc_tipo: { type: "string", example: "DNI" },
          doc_numero: { type: "string", example: "12345678" },
          apellido_paterno: { type: "string", example: "Perez" },
          apellido_materno: { type: "string", example: "Gomez" },
          nombres: { type: "string", example: "Juan" },
          sexo: { type: "string", nullable: true, example: "Masculino" },
          fecha_nacimiento: { type: "string", nullable: true, example: "1990-01-01" },
          nacionalidad: { type: "string", nullable: true, example: "Peruana" },
          direccion: { type: "string", nullable: true },
          ubigeo_code: { type: "string", nullable: true, example: "150101" },
          cargo_id: { type: "integer", nullable: true, example: 1 },
          fecha_ingreso: { type: "string", nullable: true, example: "2025-01-01" },
          status: { type: "string", nullable: true, example: "Activo" },
          regimen: { type: "string", nullable: true, example: "276" },
          licencia: { type: "string", nullable: true, example: "Q12345678" },
          categoria: { type: "string", nullable: true, example: "B-IIB" },
          vigencia: { type: "string", nullable: true, example: "2026-01-01" },
          vehiculo_id: { type: "integer", nullable: true, example: 1 },
          codigo_acceso: { type: "string", nullable: true },
          foto: { type: "string", nullable: true },
        },
      },
      PersonalUpdateRequest: {
        type: "object",
        properties: {
          apellido_paterno: { type: "string", nullable: true },
          apellido_materno: { type: "string", nullable: true },
          nombres: { type: "string", nullable: true },
          sexo: { type: "string", nullable: true },
          fecha_nacimiento: { type: "string", nullable: true },
          cargo_id: { type: "integer", nullable: true },
          status: { type: "string", nullable: true },
        },
      },
      PersonalCambiarStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", example: "Activo" },
          observaciones: { type: "string", nullable: true },
        },
      },
      PersonalAsignarVehiculoRequest: {
        type: "object",
        required: ["vehiculo_id"],
        properties: {
          vehiculo_id: { type: "integer", example: 1 },
        },
      },
      PersonalActualizarLicenciaRequest: {
        type: "object",
        properties: {
          licencia: { type: "string", nullable: true, example: "Q12345678" },
          categoria: { type: "string", nullable: true, example: "B-IIB" },
          vigencia: { type: "string", nullable: true, example: "2026-01-01" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};
swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(() => {
    try {
      const raw = fs.readFileSync(outputFile, "utf8");
      const json = JSON.parse(raw);

      if (swaggerServerUrl) {
        json.servers = [{ url: swaggerServerUrl }];
      } else {
        delete json.servers;
      }

      fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));
    } catch (e) {
      console.error("Error post-processing Swagger output:", e);
      process.exit(1);
    }

    console.log("Swagger documentation generated successfully.");
  })
  .catch((error) => {
    console.error("Error generating Swagger documentation:", error);
    process.exit(1);
  });
