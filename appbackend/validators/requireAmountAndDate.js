module.exports = function requireAmountAndDate(req, res, next) {
  const { amount, date } = req.body;

  if (!Number.isFinite(Number(amount))) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: "Invalid date" });
  }

  next();
};