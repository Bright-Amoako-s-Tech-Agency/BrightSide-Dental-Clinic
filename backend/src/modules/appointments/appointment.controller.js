import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getAppointmentStatus,
  getAppointments,
} from "./appointment.service.js";

export async function createAppointmentHandler(req, res) {
  const result = await createAppointment(req.body);

  return res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: result,
  });
}

export async function getAppointmentHandler(req, res) {
  const appointment = await getAppointmentById(req.params.id);

  return res.status(200).json({
    success: true,
    data: appointment,
  });
}

export async function getAppointmentStatusHandler(req, res) {
  const status = await getAppointmentStatus(req.params.id);

  return res.status(200).json({
    success: true,
    data: status,
  });
}

export async function cancelAppointmentHandler(req, res) {
  const appointment = await cancelAppointment(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    data: appointment,
  });
}

export async function getAppointmentsHandler(req, res) {
  const appointments = await getAppointments({
    status: req.query.status,
    clinicianId: req.query.clinicianId,
    date: req.query.date,
  });

  return res.status(200).json({
    success: true,
    data: appointments,
  });
}
