import swaggerAutogen from "swagger-autogen";

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./src/app.js"];

const doc = {
  info: {
    title: "API Documentation for Citizen Security System",
    description:
      "API Backend para Sistema de Seguridad Ciudadana con autenticación JWT y RBAC",
  },
  host: "localhost:3000",
  schemes: ["http"],
};
swaggerAutogen()(outputFile, endpointsFiles, doc)
  .then(async () => {
    await import("./src/app.js");
    console.log("Swagger documentation generated successfully.");
  })
  .catch((error) => {
    console.error("Error generating Swagger documentation:", error);
    process.exit(1);
  });
