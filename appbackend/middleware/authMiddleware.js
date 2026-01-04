const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7).trim(); // remove "Bearer "

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;