import { apiRequest } from "./api";

export async function getClinicianSchedule(clinicianId) {
  const result = await apiRequest(
    `/availability/clinicians/${clinicianId}/schedule`,
  );

  return result.data;
}
