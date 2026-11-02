import apiClient, { API_BASE } from "./client.js";

// Pass page, limit, search and filters to the backend.
export async function getDestinations(params = {}) {
  const response = await apiClient.get("/destinations", { params });
  return response.data;
}

export async function getDestination(id) {
  const response = await apiClient.get(`/destinations/${id}`);
  return response.data;
}

export async function createDestination(destination) {
  const response = await apiClient.post("/destinations", destination);
  return response.data;
}

export async function updateDestination(id, destination) {
  const response = await apiClient.put(`/destinations/${id}`, destination);
  return response.data;
}

export async function deleteDestination(id) {
  const response = await apiClient.delete(`/destinations/${id}`);
  return response.data;
}

const destinationsApi = {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
};

export default destinationsApi;
