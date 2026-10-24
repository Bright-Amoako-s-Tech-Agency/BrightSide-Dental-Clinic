import {
    createClinician,
    findClinicianById,
    findClinicians,
} from "./clinician.service.js";

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

export async function createClinicianHandler(req, res, next) {
  try {
    const clinician = await createClinician(req.body);

    res.status(201).json({
      success: true,
      message: "Clinician created successfully",
      data: clinician,
    });
  } catch (error) {
    next(error);
  }
}
