
const db = require("../config/db");

const validMonth = (month) =>
  typeof month === "string" &&
  /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

const validDate = (date) => {
  if (typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
};

const monthRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${year + (m === 12 ? 1 : 0)}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
  return [start, end];
};

async function validateTransaction(body) {
  const { category_id, type, amount, transaction_date, note } = body;

  const id = Number(category_id);
  const value = Number(amount);

  if (
    !Number.isSafeInteger(id) || id <= 0 ||
    !["income", "expense"].includes(type) ||
    amount === "" || amount === null || amount === undefined ||
    !Number.isFinite(value) || value <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(String(amount)) ||
    value > 9999999999.99 ||
    !validDate(transaction_date) ||
    (note != null && (typeof note !== "string" || note.length > 255))
  ) {
    return { error: "Invalid transaction data" };
  }

  const [categories] = await db.execute(
    "SELECT id FROM categories WHERE id = ? AND type = ?",
    [id, type]
  );

  if (!categories.length) {
    return { error: "Category does not match transaction type" };
  }

  return {
    data: {
      category_id: id,
      type,
      amount: String(amount),
      note: note || null,
      transaction_date,
    },
  };
}

// GET /api/transactions?month=2026-10
exports.getAll = async (req, res) => {
  try {
    const { month } = req.query;

    if (!validMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month required: YYYY-MM",
      });
    }

    const [start, end] = monthRange(month);

    const [rows] = await db.execute(
      `SELECT t.id, t.category_id, c.name AS category,
              t.type, t.amount, t.note,
              DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.transaction_date >= ?
         AND t.transaction_date < ?
       ORDER BY t.transaction_date DESC, t.id DESC`,
      [start, end]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/transactions/summary?month=2026-10
exports.getSummary = async (req, res) => {
  try {
    const { month } = req.query;

    if (!validMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month required: YYYY-MM",
      });
    }

    const [start, end] = monthRange(month);

    const [rows] = await db.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'
           THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense'
           THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE transaction_date >= ?
         AND transaction_date < ?`,
      [start, end]
    );

    const income = Number(rows[0].income);
    const expense = Number(rows[0].expense);

    res.json({
      success: true,
      data: {
        month,
        income,
        expense,
        balance: income - expense,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/transactions
exports.create = async (req, res) => {
  try {
    const { error, data } = await validateTransaction(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const [result] = await db.execute(
      `INSERT INTO transactions
       (category_id, type, amount, note, transaction_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.category_id, data.type, data.amount,
        data.note, data.transaction_date,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Transaction created",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/transactions/:id
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false, message: "Invalid ID",
      });
    }

    const { error, data } = await validateTransaction(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const [result] = await db.execute(
      `UPDATE transactions
       SET category_id = ?, type = ?, amount = ?,
           note = ?, transaction_date = ?
       WHERE id = ?`,
      [
        data.category_id, data.type, data.amount,
        data.note, data.transaction_date, id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false, message: "Transaction not found",
      });
    }

    res.json({ success: true, message: "Transaction updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/transactions/:id
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false, message: "Invalid ID",
      });
    }

    const [result] = await db.execute(
      "DELETE FROM transactions WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false, message: "Transaction not found",
      });
    }

    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
