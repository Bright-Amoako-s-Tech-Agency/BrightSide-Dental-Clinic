import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "BrightSide Dental <onboarding@resend.dev>";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Sends an appointment booking and confirmation email to the patient.
 *
 * @param {object} params
 * @param {object} params.patient - Patient info (email, first_name, last_name, phone)
 * @param {object} params.appointment - Appointment info (id, starts_at, deposit_amount, balance_amount, total_amount)
 * @param {object} [params.clinician] - Clinician info (name, title)
 * @param {object} [params.treatment] - Treatment info (name, duration_minutes)
 */
export async function sendAppointmentConfirmationEmail({
  patient,
  appointment,
  clinician,
  treatment,
}) {
  if (!patient?.email) {
    console.log(`[Email] Skipping confirmation email: patient has no email address`);
    return { skipped: true, reason: "no_email" };
  }

  if (!resend) {
    console.warn(
      `[Email] RESEND_API_KEY is not configured. Email to ${patient.email} was not sent.`
    );
    return { skipped: true, reason: "resend_not_configured" };
  }

  const patientName = `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Valued Patient";
  const clinicianName = clinician?.name ? `${clinician.name}${clinician.title ? `, ${clinician.title}` : ""}` : "Your clinician";
  const treatmentName = treatment?.name || "Dental Appointment";

  const appointmentDate = appointment?.starts_at
    ? new Intl.DateTimeFormat("en-GH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Accra",
      }).format(new Date(appointment.starts_at))
    : "Scheduled";

  const appointmentTime = appointment?.starts_at
    ? new Intl.DateTimeFormat("en-GH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Africa/Accra",
      }).format(new Date(appointment.starts_at))
    : "";

  const depositPaid = Number(appointment.deposit_amount || 0).toFixed(2);
  const balanceRemaining = Number(appointment.balance_amount || 0).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ed; color: #10231f; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e1d8; overflow: hidden; }
          .header { background: #0d2d26; color: #ffffff; padding: 32px 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .header p { margin: 8px 0 0 0; color: #e9b29c; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
          .content { padding: 32px 28px; }
          .details-card { background: #fbfaf6; border: 1px solid #e5e1d8; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eeece5; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #66716a; }
          .detail-val { font-weight: 600; color: #0d2d26; }
          .footer { background: #f7f4ed; padding: 20px 28px; text-align: center; font-size: 12px; color: #7b827b; border-top: 1px solid #e5e1d8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p>Booking Confirmed</p>
            <h1>Your Healthy Smile Starts Here</h1>
          </div>
          <div class="content">
            <p>Dear ${patientName},</p>
            <p>Thank you for booking with BrightSide Dental Clinic. Your deposit payment has been verified, and your appointment is confirmed.</p>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Treatment</span>
                <span class="detail-val">${treatmentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Clinician</span>
                <span class="detail-val">${clinicianName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-val">${appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-val">${appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Deposit Received</span>
                <span class="detail-val">GH₵${depositPaid}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Balance Due at Clinic</span>
                <span class="detail-val">GH₵${balanceRemaining}</span>
              </div>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #46504c;">
              <strong>Preparation tips:</strong><br>
              • Please arrive 10-15 minutes prior to your scheduled time.<br>
              • If you have existing dental x-rays or medical records, feel free to bring them along.<br>
              • Need to reschedule? Please contact us at least 24 hours in advance.
            </p>
          </div>
          <div class="footer">
            <p>BrightSide Dental Clinic • Excellence in Dental Care</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: patient.email,
      subject: `Your Appointment Confirmation - BrightSide Dental (${appointmentDate})`,
      html,
    });

    console.log(`[Email] Confirmation email sent successfully to ${patient.email}:`, result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send confirmation email to ${patient.email}:`, error);
    return { success: false, error: error.message };
  }
}
