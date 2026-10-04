import { findAvailability } from "./availability.service.js";

export async function getAvailability(req, res) {
    const { clinicianId, treatmentId, date } = req.query;

    const availability = await findAvailability({
        clinicianId,
        treatmentId,
        date,
    });

    res.json({
        success: true,
        data: availability,
    });
}