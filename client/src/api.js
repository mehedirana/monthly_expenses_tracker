
const API_URL = "http://localhost:5001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return result;
}

export const api = {
  // Authentication
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request("/auth/me"),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  // Categories
  categories: () => request("/categories"),

  // Transactions
  transactions: (month) =>
    request(`/transactions?month=${encodeURIComponent(month)}`),

  summary: (month) =>
    request(
      `/transactions/summary?month=${encodeURIComponent(month)}`
    ),

  create: (data) =>
    request("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    request(`/transactions/${id}`, {
      method: "DELETE",
    }),

  // Monthly Budget
  getBudget: (month) =>
    request(`/budgets?month=${encodeURIComponent(month)}`),

  saveBudget: (data) =>
    request("/budgets", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
