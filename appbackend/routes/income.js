const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAmountAndDate = require("../validators/requireAmountAndDate");
async function ensureUserExists(prisma, userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * GET all income for logged-in user
 */
router.get("/", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const income = await prisma.incomeEntry.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    return res.json(income);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load income" });
  }
});

/**
 * ADD income
 */
router.post("/", authMiddleware, requireAmountAndDate, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { amount, date, customerName, description } = req.body;

  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !date) {
    return res.status(400).json({ error: "Amount and date are required" });
  }

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const entry = await prisma.incomeEntry.create({
      data: {
        userId: req.userId,
        amount: amountNumber,
        date: new Date(date),
        customerName: customerName || null,
        description: description || null,
      },
    });

    return res.json({ message: "Income added", entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add income" });
  }
});

/**
 * EDIT income
 */
router.put("/:id", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const id = Number(req.params.id);
  const { amount, date, customerName, description } = req.body;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid income id" });
  }

  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !date) {
    return res.status(400).json({ error: "Amount and date are required" });
  }

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const existing = await prisma.incomeEntry.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Income entry not found" });
    }

    const updated = await prisma.incomeEntry.update({
      where: { id }, // unique selector
      data: {
        amount: amountNumber,
        date: new Date(date),
        customerName: customerName || null,
        description: description || null,
      },
    });

    return res.json({ message: "Income updated", entry: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update income" });
  }
});

/**
 * DELETE income
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid income id" });
  }

  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const existing = await prisma.incomeEntry.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Income entry not found" });
    }

    await prisma.incomeEntry.delete({ where: { id } });

    return res.json({ message: "Income deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete income" });
  }
});

module.exports = router;
