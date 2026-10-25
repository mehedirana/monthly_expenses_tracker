const express = require('express');
const expenseRoutes = require("./routes/expenseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const app = express();

app.use(cors({
    origin: "*",
}));

app.use(express.json());
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.get('/', (req, res) => {
    res.json({
        message: 'Monthly Expense API is running',
    })
})

app.get('/api/health', async (req, res) => {
    try{
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
        })
    } catch (error) {
        console.error("Database connection failed:", error.message);

        res.status(503).json({
            status: 'error',
            database: 'disconnected',
        })
    }
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});