import { apiRequest } from "./api";

export async function getAppointments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.clinicianId) {
    params.set("clinicianId", filters.clinicianId);
  }

  if (filters.date) {
    params.set("date", filters.date);
  }

  const query = params.toString();

  const result = await apiRequest(`/appointments${query ? `?${query}` : ""}`);

  return result.data;
}
