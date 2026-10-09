import {
  createPatient,
  getPatients,
  getPatientById,
} from "./patient.service.js";

export async function createPatientHandler(req, res) {
  const result = await createPatient(req.body);

  if (!result.created) {
    return res.status(200).json({
      success: true,
      message: "Patient already exists",
      data: result.patient,
      created: false,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: result.patient,
    created: true,
  });
}

export async function getPatientsHandler(req, res) {
  const patients = await getPatients(req.query.search || "");

  return res.status(200).json({
    success: true,
    data: patients,
  });
}

export async function getPatientByIdHandler(req, res) {
  const patient = await getPatientById(req.params.id);

  return res.status(200).json({
    success: true,
    data: patient,
  });
}
