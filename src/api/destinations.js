import axios from "axios";
import { API_BASE } from "./client.js";

const API_URL = `${API_BASE}/destinations`;

function getAuthConfig() {
  const token = localStorage.getItem("roamly-token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

// Pass page, limit, search and filters to the backend.
export async function getDestinations(params = {}) {
  const response = await axios.get(API_URL, { params });
  return response.data;
}

export async function getDestination(id) {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
}

export async function createDestination(destination) {
  const response = await axios.post(
    API_URL,
    destination,
    getAuthConfig()
  );

  return response.data;
}

export async function updateDestination(id, destination) {
  const response = await axios.put(
    `${API_URL}/${id}`,
    destination,
    getAuthConfig()
  );

  return response.data;
}

export async function deleteDestination(id) {
  const response = await axios.delete(
    `${API_URL}/${id}`,
    getAuthConfig()
  );

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
