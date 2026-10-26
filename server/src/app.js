require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const helmet = require("helmet");

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const expenseRoutes = require("./routes/expenseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();

const PORT = process.env.PORT || 5001;
const CLIENT_ORIGIN = "http://localhost:5173";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters");
}

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

// Basic CSRF protection for cookie-authenticated requests.
// Reject unsafe requests originating outside our frontend.
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (req.get("Origin") !== CLIENT_ORIGIN) {
    return res.status(403).json({
      message: "Invalid request origin",
    });
  }

  next();
});

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,

  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
  createDatabaseTable: false,
});

sessionStore.on("error", (error) => {
  console.error("SESSION STORE ERROR:", error);
});

app.use(
  session({
    name: "expenseflow.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Authentication endpoints
app.use("/api/auth", authRoutes);

// Existing APIs: authentication required
app.use("/api/expenses", requireAuth, expenseRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/budgets", requireAuth, budgetRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ExpenseFlow API is running" });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});