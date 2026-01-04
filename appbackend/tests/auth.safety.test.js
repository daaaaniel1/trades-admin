const { test, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const server = require("../index");

test("blocks access to dashboard without token", async () => {
  const res = await request(server).get("/dashboard/weekly");
  assert.strictEqual(res.status, 401);
});
test("allows access to dashboard with valid token", async () => {
  const email = "test@example.com";
  const password = "Password123!";

  // ensure user exists (ignore error if already registered)
  await request(server)
    .post("/auth/register")
    .send({
      email,
      password,
      businessName: "Test Business",
      tradeType: "Plumber",
    });

  // login to get a real token
  const loginRes = await request(server)
    .post("/auth/login")
    .send({ email, password });

  const token = loginRes.body.token;

  // access protected route with valid token
  const res = await request(server)
    .get("/dashboard/weekly")
    .set("Authorization", `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
});
after(() => {
  server.close();
});