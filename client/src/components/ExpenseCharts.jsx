
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";

import { ChartPie, ChartColumn } from "lucide-react";

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#f43f5e",
    "#06b6d4",
    "#64748b",
];

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    })}`;

export default function ExpenseCharts({ transactions, summary }) {
    const categoryTotals = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((result, transaction) => {
            const category = transaction.category;

            result[category] =
                (result[category] || 0) + Number(transaction.amount);

            return result;
        }, {});

    const pieData = Object.entries(categoryTotals).map(
        ([name, value]) => ({
            name,
            value,
        })
    );

    const barData = [
        {
            name: "Selected Month",
            Income: Number(summary.income || 0),
            Expense: Number(summary.expense || 0),
        },
    ];

    const expensePercentage =
        Number(summary.income) > 0
            ? (Number(summary.expense) / Number(summary.income)) * 100
            : null;

    return (
        <div className="charts-grid">
            <section className="card chart-card">
                <div className="chart-heading">
                    <div className="chart-icon purple">
                        <ChartPie size={21} />
                    </div>
                    <div>
                        <h2>Expense by Category</h2>
                        <p>Where your money goes</p>
                    </div>
                </div>

                {pieData?.length === 0 ? (
                    <div className="chart-empty">
                        No expenses found for this month.
                    </div>
                ) : (
                    <>
                        <div className="donut-wrapper">
                            <ResponsiveContainer width="100%" height={270}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={108}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {pieData.map((item, index) => (
                                            <Cell
                                                key={item.name}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => money(value)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="donut-center">
                                <small>Total Expense</small>
                                <strong>{money(summary.expense)}</strong>
                            </div>
                        </div>

                        <div className="chart-legend">
                            {pieData?.map((item, index) => (
                                <div className="legend-row" key={item.name}>
                                    <span
                                        className="legend-dot"
                                        style={{
                                            background: COLORS[index % COLORS.length],
                                        }}
                                    />
                                    <span className="legend-name">{item.name}</span>
                                    <strong>{money(item.value)}</strong>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <section className="card chart-card">
                <div className="chart-heading">
                    <div className="chart-icon blue">
                        <ChartColumn size={21} />
                    </div>
                    <div>
                        <h2>Income vs Expense</h2>
                        <p>Selected month comparison</p>
                    </div>
                </div>

                <div className="bar-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} barGap={20}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                            />
                            <XAxis dataKey="name" />
                            <YAxis
                                tickFormatter={(value) =>
                                    value >= 1000 ? `${value / 1000}k` : value
                                }
                            />
                            <Tooltip formatter={(value) => money(value)} />
                            <Legend />
                            <Bar
                                dataKey="Income"
                                fill="#10b981"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={65}
                            />
                            <Bar
                                dataKey="Expense"
                                fill="#f43f5e"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={65}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="spending-insight">
                    <p>Income Spent</p>
                    <h3>
                        {expensePercentage === null
                            ? "N/A"
                            : `${expensePercentage.toFixed(1)}%`}
                    </h3>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${expensePercentage === null
                                        ? 0
                                        : Math.min(expensePercentage, 100)
                                    }%`,
                            }}
                        />
                    </div>
                    <small>
                        {expensePercentage === null
                            ? "Add income to calculate spending percentage."
                            : expensePercentage > 100
                                ? "Expenses exceed income this month."
                                : "Percentage of monthly income spent."}
                    </small>
                </div>
            </section>
        </div>
    );
}
