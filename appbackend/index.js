require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

/**
 * Make Prisma available everywhere
 */
app.locals.prisma = prisma;

/**
 * Middleware
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local frontend
      // add Hetzner frontend domain later, e.g.
      // "https://trades.yourdomain.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * Routes
 */
app.use("/auth", require("./routes/auth"));
app.use("/income", require("./routes/income"));
app.use("/expenses", require("./routes/expenses"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/settings", require("./routes/settings"));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * Start server LAST
 */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log("Shutting down...");
  server.close(() => {
    prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Expose app + prisma for tests without changing the default export type.
server.app = app;
server.prisma = prisma;

module.exports = server;