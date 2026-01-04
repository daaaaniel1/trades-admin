const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");

async function ensureUserExists(prisma, userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * GET business settings
 * (If missing, create defaults to avoid weird “new user” issues)
 */
router.get("/business", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const profile = await prisma.businessProfile.upsert({
      where: { userId: req.userId },
      update: {},
      create: {
        userId: req.userId,
        businessName: "My Business",
        tradeType: "Unknown",
        weeklyTargetIncome: 0,
        taxRate: 0.2,
        fixedWeeklyCosts: 0,
      },
    });

    return res.json(profile);
  } catch (err) {
    console.error("BUSINESS SETTINGS GET ERROR:", err);
    return res.status(500).json({ error: "Failed to load business settings" });
  }
});

/**
 * PUT business settings
 */
router.put("/business", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { businessName, tradeType, weeklyTargetIncome, taxRate, fixedWeeklyCosts } =
    req.body;

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const profile = await prisma.businessProfile.upsert({
      where: { userId: req.userId },
      update: {
        ...(businessName !== undefined && { businessName }),
        ...(tradeType !== undefined && { tradeType }),
        ...(weeklyTargetIncome !== undefined && {
          weeklyTargetIncome: Number(weeklyTargetIncome),
        }),
        ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
        ...(fixedWeeklyCosts !== undefined && {
          fixedWeeklyCosts: Number(fixedWeeklyCosts),
        }),
      },
      create: {
        userId: req.userId,
        businessName: businessName ?? "My Business",
        tradeType: tradeType ?? "Unknown",
        weeklyTargetIncome: weeklyTargetIncome !== undefined ? Number(weeklyTargetIncome) : 0,
        taxRate: taxRate !== undefined ? Number(taxRate) : 0.2,
        fixedWeeklyCosts: fixedWeeklyCosts !== undefined ? Number(fixedWeeklyCosts) : 0,
      },
    });

    return res.json(profile);
  } catch (err) {
    console.error("BUSINESS SETTINGS PUT ERROR:", err);
    return res.status(500).json({ error: "Failed to save business settings" });
  }
});

/**
 * UPDATE EMAIL
 */
router.put("/email", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { newEmail, password } = req.body;

  if (!newEmail || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const normalizedEmail = newEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return res.json({ message: "Email updated", user: updated });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * UPDATE PASSWORD
 */
router.put("/password", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Both passwords required" });
  }

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect old password" });

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newHash },
    });

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
