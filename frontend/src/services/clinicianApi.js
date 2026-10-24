import { apiRequest } from "./api";

export async function getClinicians() {
  const result = await apiRequest("/clinicians");
  return result.data;
}

export async function getClinicianById(id) {
  const result = await apiRequest(`/clinicians/${id}`);
  return result.data;
}

export async function createClinician(payload) {
  const result = await apiRequest("/clinicians", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.data;
}
