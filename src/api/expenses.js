import apiClient from "./client";

export async function getAllExpenses(params = {}) {
  const response = await apiClient.get("/expenses", { params });
  return response.data;
}

export async function createExpense(data) {
  const response = await apiClient.post("/expenses", data);
  return response.data;
}

export async function updateExpense(id, data) {
  const response = await apiClient.put(`/expenses/${id}`, data);
  return response.data;
}

export async function deleteExpense(id) {
  const response = await apiClient.delete(`/expenses/${id}`);
  return response.data;
}

const expensesApi = {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};

export default expensesApi;
