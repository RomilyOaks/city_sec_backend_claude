import request from "supertest";
import bcrypt from "bcryptjs";

import app from "../../src/app.js";
import sequelize from "../../src/config/database.js";

import models from "../../src/models/index.js";

const API_VERSION = process.env.API_VERSION || "v1";

function extractToken(res) {
  return (
    res.body?.token ||
    res.body?.data?.token ||
    res.body?.accessToken ||
    res.body?.data?.accessToken
  );
}

describe("Seguridad/RBAC - integración", () => {
  let adminToken;
  let consultaUser;
  let consultaToken;
  let rolConsulta;

  beforeAll(async () => {
    // Login admin
    const username_or_email = process.env.TEST_USERNAME || "admin";
    const password = process.env.TEST_PASSWORD || "Admin123!";

    const loginRes = await request(app)
      .post(`/api/${API_VERSION}/auth/login`)
      .send({ username_or_email, password });

    adminToken = extractToken(loginRes);

    // Crear usuario temporal (rol consulta) para validar 403
    rolConsulta = await models.Rol.findOne({ where: { slug: "consulta" } });

    const password_hash = await bcrypt.hash("Test12345!", 10);

    const uniq = Date.now();
    consultaUser = await models.Usuario.create(
      {
        username: `jest_consulta_${uniq}`,
        email: `jest_consulta_${uniq}@example.com`,
        password_hash,
        estado: "ACTIVO",
        oauth_provider: "LOCAL",
      },
      {
        // Evita que los hooks de auditoría intenten insertar en historial_usuarios
        // con realizado_por NULL.
        hooks: false,
      }
    );

    if (rolConsulta) {
      await consultaUser.addRoles([rolConsulta]);
    }

    const consultaLoginRes = await request(app)
      .post(`/api/${API_VERSION}/auth/login`)
      .send({ username_or_email: consultaUser.username, password: "Test12345!" });

    consultaToken = extractToken(consultaLoginRes);
  });

  afterAll(async () => {
    try {
      if (consultaUser) {
        await models.Usuario.update(
          { deleted_at: new Date(), deleted_by: null },
          { where: { id: consultaUser.id } }
        );
      }
    } catch (e) {
      // noop
    }

    try {
      await sequelize.close();
    } catch (e) {
      // noop
    }
  });

  test("Admin login devuelve token", () => {
    expect(typeof adminToken).toBe("string");
    expect(adminToken.length).toBeGreaterThan(20);
  });

  test("Usuario consulta login devuelve token", () => {
    expect(typeof consultaToken).toBe("string");
    expect(consultaToken.length).toBeGreaterThan(20);
  });

  test("GET /roles sin token => 401", async () => {
    const res = await request(app).get(`/api/${API_VERSION}/roles`);
    expect(res.status).toBe(401);
  });

  test("GET /roles con token rol consulta => 403", async () => {
    const res = await request(app)
      .get(`/api/${API_VERSION}/roles`)
      .set("Authorization", `Bearer ${consultaToken}`);

    expect(res.status).toBe(403);
  });

  test("GET /roles con token admin => 200", async () => {
    const res = await request(app)
      .get(`/api/${API_VERSION}/roles?limit=5`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success");
  });

  test("GET /permisos sin token => 401", async () => {
    const res = await request(app).get(`/api/${API_VERSION}/permisos`);
    expect(res.status).toBe(401);
  });

  test("GET /permisos con token rol consulta => 403", async () => {
    const res = await request(app)
      .get(`/api/${API_VERSION}/permisos`)
      .set("Authorization", `Bearer ${consultaToken}`);

    expect(res.status).toBe(403);
  });

  test("GET /permisos con token admin => 200", async () => {
    const res = await request(app)
      .get(`/api/${API_VERSION}/permisos?limit=5`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success");
  });

  test("/permisos no permite escritura (POST/PUT/DELETE/PATCH) => 404", async () => {
    const headers = { Authorization: `Bearer ${adminToken}` };

    const postRes = await request(app)
      .post(`/api/${API_VERSION}/permisos`)
      .set(headers)
      .send({ modulo: "test", recurso: "test", accion: "read" });

    const putRes = await request(app)
      .put(`/api/${API_VERSION}/permisos/1`)
      .set(headers)
      .send({ descripcion: "x" });

    const delRes = await request(app)
      .delete(`/api/${API_VERSION}/permisos/1`)
      .set(headers);

    const patchRes = await request(app)
      .patch(`/api/${API_VERSION}/permisos/1/estado`)
      .set(headers)
      .send({ estado: false });

    expect([404, 405]).toContain(postRes.status);
    expect([404, 405]).toContain(putRes.status);
    expect([404, 405]).toContain(delRes.status);
    expect([404, 405]).toContain(patchRes.status);
  });

  test("Smoke modelos features seguridad: tablas accesibles", async () => {
    // Validar que los modelos nuevos consultan sin error.
    const results = await Promise.all([
      models.EmailVerification.count().catch(() => null),
      models.PasswordReset.count().catch(() => null),
      models.PasswordHistorial.count().catch(() => null),
      models.Sesion.count().catch(() => null),
      models.TokenAcceso.count().catch(() => null),
      models.UsuarioPermiso.count().catch(() => null),
      models.RolPermiso.count().catch(() => null),
    ]);

    // Si alguna tabla no existe o no es accesible, count() daría error y caería a null
    expect(results.every((x) => typeof x === "number")).toBe(true);
  });
});
