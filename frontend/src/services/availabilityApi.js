import { apiRequest } from "./api";

export async function getClinicianSchedule(clinicianId) {
  const result = await apiRequest(
    `/availability/clinicians/${clinicianId}/schedule`,
  );

  return result.data;
}

export async function getAvailability({ clinicianId, treatmentId, date }) {
  const params = new URLSearchParams({
    clinicianId,
    treatmentId,
    date,
  });

  const result = await apiRequest(`/availability?${params.toString()}`);

  return result.data;
}
