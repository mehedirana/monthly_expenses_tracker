
const db = require("../config/db");

// GET /api/expenses
exports.getExpenses = async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT
        t.id,
        t.category_id,
        c.name AS category,
        t.type,
        t.amount,
        t.note,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
      ORDER BY t.transaction_date DESC, t.id DESC
    `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
    try {
        const { category_id, amount, note, transaction_date } = req.body;

        if (
            !Number.isSafeInteger(Number(category_id)) ||
            Number(category_id) <= 0 ||
            amount === null ||
            amount === undefined ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date || "")
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid category, amount and YYYY-MM-DD date required",
            });
        }

        const [categories] = await db.execute(
            "SELECT id FROM categories WHERE id = ? AND type = 'expense'",
            [Number(category_id)]
        );

        if (!categories.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category",
            });
        }

        const [result] = await db.execute(
            `INSERT INTO transactions
       (category_id, type, amount, note, transaction_date)
       VALUES (?, 'expense', ?, ?, ?)`,
            [Number(category_id), Number(amount), note || null, transaction_date]
        );

        res.status(201).json({
            success: true,
            message: "Expense created",
            id: result.insertId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { category_id, amount, note, transaction_date } = req.body;

        if (
            !Number.isSafeInteger(id) || id <= 0 ||
            !Number.isSafeInteger(Number(category_id)) ||
            Number(category_id) <= 0 ||
            amount === null || amount === undefined || amount === "" ||
            !Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
            !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date || "")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense data",
            });
        }

        const [categories] = await db.execute(
            "SELECT id FROM categories WHERE id = ? AND type = 'expense'",
            [Number(category_id)]
        );

        if (!categories.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category",
            });
        }

        const [result] = await db.execute(
            `UPDATE transactions
       SET category_id = ?, amount = ?, note = ?, transaction_date = ?
       WHERE id = ? AND type = 'expense'`,
            [Number(category_id), Number(amount), note || null, transaction_date, id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({ success: true, message: "Expense updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense ID",
            });
        }

        const [result] = await db.execute(
            "DELETE FROM transactions WHERE id = ? AND type = 'expense'",
            [id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.json({ success: true, message: "Expense deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
