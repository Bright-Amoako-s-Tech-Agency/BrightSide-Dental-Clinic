import { findClinicianById, findClinicians } from "./clinician.service.js";

export async function getClinicians(req, res) {
  const clinicians = await findClinicians();

  res.json({
    success: true,
    data: clinicians,
  });
}

export async function getClinicianById(req, res) {
  const clinician = await findClinicianById(req.params.id);

  res.json({
    success: true,
    data: clinician,
  });
}
