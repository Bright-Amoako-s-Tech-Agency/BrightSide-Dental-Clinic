import { findTreatmentById, findTreatments } from "./treatment.service.js";

export async function getTreatments(req, res, next) {
  try {
    const treatments = await findTreatments();

    res.json({
      success: true,
      data: treatments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTreatmentById(req, res, next) {
  try {
    const treatment = await findTreatmentById(req.params.id);

    res.json({
      success: true,
      data: treatment,
    });
  } catch (error) {
    next(error);
  }
}
