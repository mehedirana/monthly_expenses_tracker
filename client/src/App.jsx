
import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

const localDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = (month) => ({
  type: "expense",
  category_id: "",
  amount: "",
  note: "",
  transaction_date: localDate().startsWith(month)
    ? localDate()
    : `${month}-01`,
});

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function App() {
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    income: 0, expense: 0, balance: 0,
  });

  const [form, setForm] = useState(() =>
    emptyForm(localDate().slice(0, 7))
  );
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (selectedMonth) => {
    setLoading(true);
    try {
      const [tx, totals] = await Promise.all([
        api.transactions(selectedMonth),
        api.summary(selectedMonth),
      ]);
      setTransactions(tx.data);
      setSummary(totals.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.categories()
      .then((result) => setCategories(result.data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadData(month);
    setEditingId(null);
    setForm(emptyForm(month));
  }, [month]);

  const availableCategories = categories.filter(
    (category) => category.type === form.type
  );

  const changeType = (type) => {
    setForm((previous) => ({
      ...previous,
      type,
      category_id: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.transaction_date.startsWith(month)) {
      setError("Transaction date must be in the selected month.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId !== null) {
        await api.update(editingId, form);
      } else {
        await api.create(form);
      }

      setEditingId(null);
      setForm(emptyForm(month));
      await loadData(month);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setForm({
      type: transaction.type,
      category_id: String(transaction.category_id),
      amount: String(transaction.amount),
      note: transaction.note || "",
      transaction_date: transaction.transaction_date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction permanently?")) return;

    try {
      setError("");
      await api.remove(id);

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm(month));
      }

      await loadData(month);
    } catch (err) {
      setError(err.message);
    }
  };

  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((result, t) => {
      result[t.category] =
        (result[t.category] || 0) + Number(t.amount);
      return result;
    }, {});

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>ExpenseFlow</h1>
          <p>Monthly Income & Expense Tracker</p>
        </div>

        <label>
          Select Month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="dashboard">
        <div className="stat income">
          <p>Monthly Income</p>
          <h2>{money(summary.income)}</h2>
        </div>

        <div className="stat expense">
          <p>Monthly Expense</p>
          <h2>{money(summary.expense)}</h2>
        </div>

        <div className="stat balance">
          <p>Remaining Balance</p>
          <h2>{money(summary.balance)}</h2>
        </div>
      </section>

      <section className="card">
        <h2>{editingId !== null
          ? "Edit Transaction"
          : "Add Transaction"}</h2>

        <div className="type-switch">
          <button
            type="button"
            className={form.type === "expense" ? "active" : "secondary"}
            onClick={() => changeType("expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={form.type === "income" ? "active" : "secondary"}
            onClick={() => changeType("income")}
          >
            Income / Salary
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Category
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({
                ...form, category_id: e.target.value,
              })}
            >
              <option value="">Select Category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount (BDT)
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({
                ...form, amount: e.target.value,
              })}
            />
          </label>

          <label>
            Transaction Date
            <input
              type="date"
              required
              min={`${month}-01`}
              max={`${month}-${new Date(
                Number(month.slice(0, 4)),
                Number(month.slice(5, 7)),
                0
              ).getDate()}`}
              value={form.transaction_date}
              onChange={(e) => setForm({
                ...form, transaction_date: e.target.value,
              })}
            />
          </label>

          <label>
            Note
            <input
              type="text"
              maxLength="255"
              placeholder="Salary, groceries, rent..."
              value={form.note}
              onChange={(e) => setForm({
                ...form, note: e.target.value,
              })}
            />
          </label>

          <div className="form-actions">
            <button disabled={saving} type="submit">
              {saving ? "Saving..." :
                editingId !== null ? "Update" : "Save Transaction"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm(month));
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Expense by Category</h2>
        {Object.keys(expenseByCategory).length === 0 ? (
          <p>No expenses for this month.</p>
        ) : (
          Object.entries(expenseByCategory).map(([name, amount]) => (
            <div className="category-row" key={name}>
              <span>{name}</span>
              <strong>{money(amount)}</strong>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Transactions — {month}</h2>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found for this month.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.transaction_date}</td>
                    <td>
                      <span className={`pill ${t.type}`}>
                        {t.type}
                      </span>
                    </td>
                    <td>{t.category}</td>
                    <td>{t.note || "-"}</td>
                    <td className={t.type === "income"
                      ? "positive" : "negative"}>
                      {t.type === "income" ? "+" : "-"}
                      {money(t.amount)}
                    </td>
                    <td className="actions">
                      <button className="edit"
                        onClick={() => handleEdit(t)}>
                        Edit
                      </button>
                      <button className="delete"
                        onClick={() => handleDelete(t.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
