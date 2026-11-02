import apiClient, { API_BASE } from "./client.js";

export async function getFinancialOverview() {
  const response = await apiClient.get("/financials/overview");
  return response.data;
}

export async function getPackageProfitability() {
  const response = await apiClient.get("/financials/package-profitability");
  return response.data;
}

export async function getBookingFinancialsLedger(params = {}) {
  const response = await apiClient.get("/financials/booking-ledger", { params });
  return response.data;
}

export async function getPartnerLiabilities() {
  const response = await apiClient.get("/financials/partner-liabilities");
  return response.data;
}

export function getExportPackagesCsvUrl() {
  const token = localStorage.getItem("roamly-token");
  return `${API_BASE}/financials/export/packages-csv?token=${encodeURIComponent(token || "")}`;
}

export function getExportBookingsCsvUrl() {
  const token = localStorage.getItem("roamly-token");
  return `${API_BASE}/financials/export/bookings-csv?token=${encodeURIComponent(token || "")}`;
}

/**
 * Downloads CSV directly using authenticated apiClient blob request
 */
export async function downloadPackagesCsv() {
  const response = await apiClient.get("/financials/export/packages-csv", {
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `roamly-package-profitability-matrix-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadBookingsCsv() {
  const response = await apiClient.get("/financials/export/bookings-csv", {
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `roamly-booking-financials-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const financialsApi = {
  getFinancialOverview,
  getPackageProfitability,
  getBookingFinancialsLedger,
  getPartnerLiabilities,
  getExportPackagesCsvUrl,
  getExportBookingsCsvUrl,
  downloadPackagesCsv,
  downloadBookingsCsv
};

export default financialsApi;
