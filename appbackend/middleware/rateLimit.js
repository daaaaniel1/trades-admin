const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                 // 20 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,

  // REQUIRED when behind Caddy / reverse proxy
  trustProxy: true,
});

module.exports = { authLimiter };