
import { useState } from "react";
import { api } from "../api";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api.login({
        email: email.trim(),
        password,
      });

      // Confirm session is available before opening dashboard.
      const session = await api.me();

      onLogin(session.user || result.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">৳</div>
          <h1>ExpenseFlow</h1>
          <p>Manage your income, expenses and monthly budget.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          Your personal finance dashboard
        </p>
      </section>
    </main>
  );
}
