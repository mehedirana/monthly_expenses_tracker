
const db = require("../config/db");

// Validate actual calendar date: YYYY-MM-DD
const isValidDate = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
};

// Validate expense request
const validateExpense = async (body) => {
  const {
    category_id,
    amount,
    note,
    transaction_date,
  } = body || {};

  const categoryId = Number(category_id);
  const amountValue = Number(amount);

  if (
    !Number.isSafeInteger(categoryId) ||
    categoryId <= 0 ||
    amount === null ||
    amount === undefined ||
    amount === "" ||
    !Number.isFinite(amountValue) ||
    amountValue <= 0 ||
    amountValue > 9999999999.99 ||
    !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
    !isValidDate(transaction_date) ||
    (note != null &&
      (typeof note !== "string" || note.length > 255))
  ) {
    return {
      error: "Invalid expense data",
    };
  }

  const [categories] = await db.execute(
    `SELECT id
     FROM categories
     WHERE id = ? AND type = 'expense'`,
    [categoryId]
  );

  if (!categories.length) {
    return {
      error: "Invalid expense category",
    };
  }

  return {
    data: {
      category_id: categoryId,
      amount: String(amount),
      note: note || null,
      transaction_date,
    },
  };
};

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const userId = req.session.userId;

    const [rows] = await db.execute(
      `SELECT
         t.id,
         t.category_id,
         c.name AS category,
         t.type,
         t.amount,
         t.note,
         DATE_FORMAT(t.transaction_date, '%Y-%m-%d')
           AS transaction_date
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense'
         AND t.user_id = ?
       ORDER BY t.transaction_date DESC, t.id DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const userId = req.session.userId;

    const { error, data } = await validateExpense(
      req.body
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const [result] = await db.execute(
      `INSERT INTO transactions
       (
         user_id,
         category_id,
         type,
         amount,
         note,
         transaction_date
       )
       VALUES (?, ?, 'expense', ?, ?, ?)`,
      [
        userId,
        data.category_id,
        data.amount,
        data.note,
        data.transaction_date,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Expense created",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.session.userId;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const { error, data } = await validateExpense(
      req.body
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const [result] = await db.execute(
      `UPDATE transactions
       SET
         category_id = ?,
         amount = ?,
         note = ?,
         transaction_date = ?
       WHERE id = ?
         AND type = 'expense'
         AND user_id = ?`,
      [
        data.category_id,
        data.amount,
        data.note,
        data.transaction_date,
        id,
        userId,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.json({
      success: true,
      message: "Expense updated",
    });
  } catch (error) {
    console.error("Update expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.session.userId;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const [result] = await db.execute(
      `DELETE FROM transactions
       WHERE id = ?
         AND type = 'expense'
         AND user_id = ?`,
      [id, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.json({
      success: true,
      message: "Expense deleted",
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
