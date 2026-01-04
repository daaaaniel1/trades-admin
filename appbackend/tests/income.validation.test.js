const test = require("node:test");
const assert = require("node:assert/strict");

const incomeRouter = require("../routes/income");

function getRouteHandler(router, path, method) {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("POST / income rejects zero amount", async () => {
  const handler = getRouteHandler(incomeRouter, "/", "post");
  const req = {
    body: { amount: 0, date: "2025-01-01" },
    app: { locals: { prisma: {} } },
  };
  const res = createRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, "Amount and date are required");
});

test("PUT /:id income rejects zero amount", async () => {
  const handler = getRouteHandler(incomeRouter, "/:id", "put");
  const req = {
    params: { id: "1" },
    body: { amount: 0, date: "2025-01-01" },
    app: { locals: { prisma: {} } },
  };
  const res = createRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, "Amount and date are required");
});

test("PUT /:id income rejects invalid id", async () => {
  const handler = getRouteHandler(incomeRouter, "/:id", "put");
  const req = {
    params: { id: "not-a-number" },
    body: { amount: 10, date: "2025-01-01" },
    app: { locals: { prisma: {} } },
  };
  const res = createRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, "Invalid income id");
});
