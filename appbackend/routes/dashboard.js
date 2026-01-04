const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

async function ensureUserExists(prisma, userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

// WEEKLY SUMMARY
router.get('/weekly', authMiddleware, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.userId;

  const now = new Date();
  const startOfWeek = new Date(now);

  // getDay(): Sunday = 0, Monday = 1, ... Saturday = 6
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // if Sunday -> go back 6 days, else back to Monday

  startOfWeek.setDate(now.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);

  try {
    const user = await ensureUserExists(prisma, userId);
    if (!user) return res.status(401).json({ error: "Invalid user token" });

    // Load user's business profile (contains weeklyTargetIncome)
    const profile = await prisma.businessProfile.findUnique({
      where: { userId }
    });

    const weeklyTarget = profile?.weeklyTargetIncome || 0;

    // Load weekly income
    const income = await prisma.incomeEntry.findMany({
      where: {
        userId,
        date: { gte: startOfWeek }
      }
    });

    // Load weekly expenses
    const expenses = await prisma.expenseEntry.findMany({
      where: {
        userId,
        date: { gte: startOfWeek }
      }
    });

    // Calculate totals
    const totalIncome = income.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const net = totalIncome - totalExpenses;

    // Calculate remaining to target
    const remainingToTarget = Math.max(weeklyTarget - net, 0);

    return res.json({
      weekStart: startOfWeek,
      totalIncome,
      totalExpenses,
      net,
      weeklyTarget: weeklyTarget, // ✅ FIXED
      remainingToTarget,
      incomeEntries: income,
      expenseEntries: expenses
    });

  } catch (err) {
    console.error("Dashboard weekly error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
