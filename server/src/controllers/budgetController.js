
const db = require("../config/db");

const isValidMonth = (month) => {
  return (
    typeof month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
  );
};

const getMonthRange = (month) => {
  const [year, m] = month.split("-").map(Number);

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? year + 1 : year;

  const start = `${month}-01`;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return [start, end];
};

// GET /api/budgets?month=2026-10
const getBudget = async (req, res) => {
  try {
    const { month } = req.query;

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month required (YYYY-MM)",
      });
    }

    const [start, end] = getMonthRange(month);

    const [budgetRows] = await db.execute(
      `SELECT amount
       FROM monthly_budgets
       WHERE budget_month = ?`,
      [month]
    );

    const [expenseRows] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = 'expense'
         AND transaction_date >= ?
         AND transaction_date < ?`,
      [start, end]
    );

    const budget = budgetRows.length
      ? Number(budgetRows[0].amount)
      : null;

    const spent = Number(expenseRows[0].total);

    const remaining =
      budget === null ? null : budget - spent;

    const percentage =
      budget === null ? null : (spent / budget) * 100;

    let status = "not_set";

    if (budget !== null) {
      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      } else {
        status = "safe";
      }
    }

    return res.json({
      success: true,
      data: {
        month,
        budget,
        spent,
        remaining,
        percentage,
        status,
      },
    });
  } catch (error) {
    console.error("Get Budget Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch budget",
    });
  }
};

// PUT /api/budgets
const saveBudget = async (req, res) => {
  try {
    const { month, amount } = req.body || {};

    const budget = Number(amount);

    if (
      !isValidMonth(month) ||
      amount === null ||
      amount === undefined ||
      String(amount).trim() === "" ||
      !Number.isFinite(budget) ||
      budget <= 0 ||
      budget > 9999999999.99 ||
      !/^\d+(\.\d{1,2})?$/.test(String(amount))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid month and positive budget amount",
      });
    }

    await db.execute(
      `INSERT INTO monthly_budgets (budget_month, amount)
       VALUES (?, ?) AS new_budget
       ON DUPLICATE KEY UPDATE
       amount = new_budget.amount`,
      [month, String(amount)]
    );

    return res.json({
      success: true,
      message: "Monthly budget saved successfully",
    });
  } catch (error) {
    console.error("Save Budget Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save budget",
    });
  }
};

module.exports = {
  getBudget,
  saveBudget,
};
