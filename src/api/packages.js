import apiClient, { API_BASE } from "./client";

export async function getPublicPackages(params = {}) {
  const response = await apiClient.get("/packages", { params });
  return response.data;
}

export async function getPackageById(id) {
  const response = await apiClient.get(`/packages/${id}`);
  return response.data;
}

export async function getAllPackagesAdmin() {
  const response = await apiClient.get("/packages/admin/all");
  return response.data;
}

export async function createPackageAdmin(data) {
  const response = await apiClient.post("/packages/admin", data);
  return response.data;
}

export async function updatePackageAdmin(id, data) {
  const response = await apiClient.put(`/packages/admin/${id}`, data);
  return response.data;
}

export async function deletePackageAdmin(id) {
  const response = await apiClient.delete(`/packages/admin/${id}`);
  return response.data;
}

export async function addPackageService(packageId, data) {
  const response = await apiClient.post(`/packages/admin/${packageId}/services`, data);
  return response.data;
}

export async function deletePackageService(serviceId) {
  const response = await apiClient.delete(`/packages/admin/services/${serviceId}`);
  return response.data;
}

const packagesApi = {
  getPublicPackages,
  getPackageById,
  getAllPackagesAdmin,
  createPackageAdmin,
  updatePackageAdmin,
  deletePackageAdmin,
  addPackageService,
  deletePackageService
};

export default packagesApi;
