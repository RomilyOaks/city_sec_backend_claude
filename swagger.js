import swaggerAutogen from "swagger-autogen";

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
  },
  security: [{ bearerAuth: [] }],
};
swaggerAutogen()(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log("Swagger documentation generated successfully.");
  })
  .catch((error) => {
    console.error("Error generating Swagger documentation:", error);
    process.exit(1);
  });
