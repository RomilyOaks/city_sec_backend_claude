import request from "supertest";
import app from "../../src/app.js";
import sequelize from "../../src/config/database.js";

const API_VERSION = process.env.API_VERSION || "v1";

describe("Smoke tests", () => {
  afterAll(async () => {
    try {
      await sequelize.close();
    } catch (e) {
      // noop
    }
  });

  test("GET /api/v1/health responde 200 o 503", async () => {
    const res = await request(app).get(`/api/${API_VERSION}/health`);

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });

  test("POST /api/v1/auth/login devuelve token", async () => {
    const username_or_email = process.env.TEST_USERNAME || "admin";
    const password = process.env.TEST_PASSWORD || "Admin123!";

    const res = await request(app)
      .post(`/api/${API_VERSION}/auth/login`)
      .send({ username_or_email, password });

    expect([200, 201]).toContain(res.status);

    const token =
      res.body?.token ||
      res.body?.data?.token ||
      res.body?.accessToken ||
      res.body?.data?.accessToken;

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  test("GET /api/v1/reportes/vehiculos-en-mantenimiento requiere auth y responde 200 con token", async () => {
    const username_or_email = process.env.TEST_USERNAME || "admin";
    const password = process.env.TEST_PASSWORD || "Admin123!";

    const loginRes = await request(app)
      .post(`/api/${API_VERSION}/auth/login`)
      .send({ username_or_email, password });

    const token =
      loginRes.body?.token ||
      loginRes.body?.data?.token ||
      loginRes.body?.accessToken ||
      loginRes.body?.data?.accessToken;

    expect(typeof token).toBe("string");

    const res = await request(app)
      .get(`/api/${API_VERSION}/reportes/vehiculos-en-mantenimiento`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 403]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });
});
