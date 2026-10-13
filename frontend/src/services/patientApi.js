import { apiRequest } from "./api";

export async function getPatients(search = "") {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  const result = await apiRequest(`/patients${query ? `?${query}` : ""}`);

  return result.data;
}

export async function getPatientById(id) {
  const result = await apiRequest(`/patients/${id}`);
  return result.data;
}

export async function createPatient(payload) {
  const result = await apiRequest("/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result;
}
