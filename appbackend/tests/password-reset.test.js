const { test, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const bcrypt = require("bcrypt");

const server = require("../index");
const prisma = server.prisma;

test("password reset confirm updates password", async () => {
  // 1. create user
  const passwordHash = await bcrypt.hash("oldpass123", 10);
  const user = await prisma.user.create({
    data: {
      email: `reset+${Date.now()}@test.com`,
      passwordHash,
    },
  });

  // 2. create reset token
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });

  // 3. call reset confirm
  const res = await request(server)
    .post("/auth/password-reset/confirm")
    .send({
      token,
      newPassword: "newpass123",
    });

  assert.strictEqual(res.status, 200);

  // 4. verify password changed
  const updated = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const ok = await bcrypt.compare("newpass123", updated.passwordHash);
  assert.strictEqual(ok, true);
});

after(async () => {
  await prisma.$disconnect();
  server.close();
});