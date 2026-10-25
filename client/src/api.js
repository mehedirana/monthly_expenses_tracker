
const API_URL = "http://127.0.0.1:5001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}

export const api = {
  categories: () => request("/categories"),

  transactions: (month) =>
    request(`/transactions?month=${encodeURIComponent(month)}`),

  summary: (month) =>
    request(`/transactions/summary?month=${encodeURIComponent(month)}`),

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
};
