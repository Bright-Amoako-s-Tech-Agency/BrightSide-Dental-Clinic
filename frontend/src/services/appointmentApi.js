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

export async function getAppointmentById(id) {
  const result = await apiRequest(`/appointments/${id}`);
  return result.data;
}

export async function cancelAppointment(id) {
  const result = await apiRequest(`/appointments/${id}/cancel`, {
    method: "POST",
  });

  return result.data;
}

export async function getPatientAppointments(patientId) {
  const params = new URLSearchParams();
  params.set("patientId", patientId);

  const result = await apiRequest(`/appointments?${params.toString()}`);
  return result.data;
}

export async function getClinicianAppointments(clinicianId) {
  const params = new URLSearchParams();
  params.set("clinicianId", clinicianId);

  const result = await apiRequest(`/appointments?${params.toString()}`);
  return result.data;
}

export async function completeAppointment(id) {
  const result = await apiRequest(`/appointments/${id}/complete`, {
    method: "POST",
  });
  return result.data;
}

export async function markAppointmentNoShow(id) {
  const result = await apiRequest(`/appointments/${id}/no-show`, {
    method: "POST",
  });
  return result.data;
}
