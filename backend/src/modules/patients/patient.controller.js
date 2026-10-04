import { createPatient } from "./patient.service.js";

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