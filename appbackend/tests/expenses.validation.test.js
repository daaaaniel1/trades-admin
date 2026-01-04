const test = require("node:test");
const assert = require("node:assert/strict");

const expensesRouter = require("../routes/expenses");

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

test("POST / expenses rejects zero amount", async () => {
  const handler = getRouteHandler(expensesRouter, "/", "post");
  const req = {
    body: { amount: 0, date: "2025-01-01" },
  };
  const res = createRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, "Amount and date are required");
});

test("PUT /:id expenses rejects invalid id", async () => {
  const handler = getRouteHandler(expensesRouter, "/:id", "put");
  const req = {
    params: { id: "nope" },
    body: { amount: 10, date: "2025-01-01" },
  };
  const res = createRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body?.error, "Invalid expense id");
});
