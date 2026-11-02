import apiClient from "./client";

export async function getAllPartners(params = {}) {
  const response = await apiClient.get("/partners", { params });
  return response.data;
}

export async function getPartnerById(id) {
  const response = await apiClient.get(`/partners/${id}`);
  return response.data;
}

export async function createPartner(data) {
  const response = await apiClient.post("/partners", data);
  return response.data;
}

export async function updatePartner(id, data) {
  const response = await apiClient.put(`/partners/${id}`, data);
  return response.data;
}

export async function deletePartner(id) {
  const response = await apiClient.delete(`/partners/${id}`);
  return response.data;
}

const partnersApi = {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
};

export default partnersApi;
