
import { useEffect, useState } from "react";
import { Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../api";

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function MonthlyBudget({ month, refreshKey }) {
    const [data, setData] = useState(null);
    const [amount, setAmount] = useState("");
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError("");
        setData(null);
        setEditing(false);

        api.getBudget(month)
            .then((result) => {
                if (!active) return;
                setData(result.data);
                setAmount(
                    result.data.budget === null
                        ? ""
                        : String(result.data.budget)
                );
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [month, refreshKey]);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await api.saveBudget({ month, amount });
            const result = await api.getBudget(month);
            setData(result.data);
            setEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const percentage = data?.percentage ?? 0;
    const status = data?.status || "not_set";

    return (
        <section className="card budget-card">
            <div className="budget-header">
                <div className="budget-heading">
                    <div className="budget-icon">
                        <Wallet size={22} />
                    </div>
                    <div>
                        <h2>Monthly Budget</h2>
                        <p>Manage your spending limit</p>
                    </div>
                </div>

                {data?.budget !== null && data && !editing && (
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditing(true)}
                    >
                        Edit Budget
                    </button>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
                <p>Loading budget...</p>
            ) : data?.budget === null || editing ? (
                <form className="budget-form" onSubmit={handleSave}>
                    <label>
                        Budget Amount (BDT)
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            placeholder="Enter monthly budget"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </label>

                    <div className="budget-buttons">
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Budget"}
                        </button>

                        {editing && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <>
                    <div className="budget-stats">
                        <div>
                            <span>Monthly Limit</span>
                            <strong>{money(data.budget)}</strong>
                        </div>
                        <div>
                            <span>Spent</span>
                            <strong>{money(data.spent)}</strong>
                        </div>
                        <div>
                            <span>Remaining</span>
                            <strong className={data.remaining < 0 ? "negative" : "positive"}>
                                {money(data.remaining)}
                            </strong>
                        </div>
                    </div>

                    <div className="budget-progress-info">
                        <span>Budget Used</span>
                        <strong>{percentage.toFixed(1)}%</strong>
                    </div>

                    <div className="budget-progress">
                        <div
                            className={`budget-progress-fill ${status}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>

                    <div className={`budget-message ${status}`}>
                        {status === "exceeded" ? (
                            <>
                                <AlertTriangle size={18} />
                                Budget limit reached or exceeded.
                            </>
                        ) : status === "warning" ? (
                            <>
                                <AlertTriangle size={18} />
                                You have used at least 80% of your budget.
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                You are within your monthly budget.
                            </>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
