import { apiRequest } from "./api";

export async function getTreatments({ includeInactive = false } = {}) {
  const query = includeInactive ? "?includeInactive=true" : "";
  const result = await apiRequest(`/treatments${query}`);
  return result.data;
}

export async function createTreatment(payload) {
  const result = await apiRequest("/treatments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.data;
}

export async function updateTreatment(id, payload) {
  const result = await apiRequest(`/treatments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return result.data;
}
