const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

async function ensureUserExists(prisma, userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * ADD expense
 */
router.post("/", authMiddleware, async (req, res) => {
  console.log("EXPENSE POST BODY:", req.body);
  const { amount, supplierName, description, date } = req.body;
  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !date) {
    return res.status(400).json({ error: "Amount and date are required" });
  }

  try {
    const prisma = req.app.locals.prisma;
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const entry = await prisma.expenseEntry.create({
      data: {
        userId: req.userId,
        amount: amountNumber,
        date: new Date(date),
        supplierName: supplierName || null,
        description: description || null, // ✅ SAVE DESCRIPTION
      },
    });

    res.json({ message: "Expense added", entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

/**
 * GET all expenses for logged-in user
 */
router.get("/", authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const expenses = await prisma.expenseEntry.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load expenses" });
  }
});

/**
 * EDIT expense
 */
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid expense id" });
  }
  const { amount, supplierName, date, description } = req.body;

  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !date) {
    return res.status(400).json({ error: "Amount and date are required" });
  }

  try {
    const prisma = req.app.locals.prisma;
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const existing = await prisma.expenseEntry.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const updated = await prisma.expenseEntry.update({
      where: { id },
      data: {
        amount: amountNumber,
        date: new Date(date),
        supplierName: supplierName || null,
        description: description || null,
      },
    });

    res.json({ entry: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});
/**
 * DELETE expense by id
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  try {
    const prisma = req.app.locals.prisma;
    const user = await ensureUserExists(prisma, req.userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    const existing = await prisma.expenseEntry.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await prisma.expenseEntry.delete({
      where: { id },
    });

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

module.exports = router;
