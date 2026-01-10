const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authLimiter } = require("../middleware/rateLimit");
const router = express.Router();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

/* ======================
   REGISTER
====================== */
router.post("/register", async (req, res) => {
  const prisma = req.app.locals.prisma;

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const businessName = req.body.businessName?.trim();
  const tradeType = req.body.tradeType?.trim();

  if (!email || !password || !businessName || !tradeType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password too short" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          passwordHash,
          businessProfile: {
            create: {
              businessName,
              tradeType,
              weeklyTargetIncome: 0,
              taxRate: 0.2,
              fixedWeeklyCosts: 0,
            },
          },
        },
      });
    });

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "User registered",
      token,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", authLimiter, async (req, res) => {
  const prisma = req.app.locals.prisma;

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/*=======================
  PASSWORD RESET
=======================*/

router.post("/password-reset/request", authLimiter, async (req, res) => {
  const prisma = req.app.locals.prisma;

  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Do not reveal whether user exists
    if (!user) {
      return res.json({ ok: true });
    }

    const crypto = require("crypto");

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
      },
    });

  const resetLink = `https://jobadmin.co.uk/password-reset/${token}`;

await resend.emails.send({
  from: "JobAdmin <no-reply@jobadmin.co.uk>",
  to: email,
  subject: "Reset your JobAdmin password",
  html: `
    <p>You requested a password reset.</p>
    <p>
      <a href="${resetLink}">Click here to reset your password</a>
    </p>
    <p>This link expires in 30 minutes.</p>
  `,
});

res.json({ ok: true });
  } catch (err) {
    console.error("PASSWORD RESET REQUEST ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/password-reset/confirm", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or password" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password too short" });
  }

  try {
    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const reset = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("PASSWORD RESET CONFIRM ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;