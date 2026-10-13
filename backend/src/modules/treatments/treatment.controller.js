import {
  createTreatment,
  findTreatmentById,
  findTreatments,
  updateTreatment,
} from "./treatment.service.js";

export async function getTreatments(req, res, next) {
  try {
    const treatments = await findTreatments({
      includeInactive: req.query.includeInactive === "true",
    });

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

export async function createTreatmentHandler(req, res, next) {
  try {
    const treatment = await createTreatment(req.body);

    res.status(201).json({
      success: true,
      message: "Treatment created successfully",
      data: treatment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTreatmentHandler(req, res, next) {
  try {
    const treatment = await updateTreatment(req.params.id, req.body);

    res.json({
      success: true,
      message: "Treatment updated successfully",
      data: treatment,
    });
  } catch (error) {
    next(error);
  }
}
