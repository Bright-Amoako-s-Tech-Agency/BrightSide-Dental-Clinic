import { ArrowLeft, CalendarDays, CheckCircle2, UserRound } from "lucide-react";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-[#dedbd2] bg-white px-3 py-2.5 text-sm text-[#0d2d26] outline-none focus:border-[#0d2d26]";

function formatDate(dateString) {
  if (!dateString) return "Not selected";

  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "Not selected";

  return new Date(dateString).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-[#0d2d26]">
        {value || "—"}
      </span>
    </div>
  );
}

export default function BookingConfirmation({
  selectedPatient,
  selectedTreatment,
  selectedClinician,
  selectedSlot,
  onBack,
  onConfirm,
  isSubmitting = false,
}) {
  const [comfortMode, setComfortMode] = useState("standard");
  const [notes, setNotes] = useState("");

  const patientName = selectedPatient
    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
    : "";

  const canConfirm =
    Boolean(selectedPatient?.id) &&
    Boolean(selectedTreatment?.id) &&
    Boolean(selectedClinician?.id) &&
    Boolean(selectedSlot?.startsAt) &&
    !isSubmitting;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canConfirm) return;

    onConfirm({
      comfort_mode: comfortMode,
      patientNotes: notes.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#b84620]">Step 4 of 4</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#0d2d26]">
          Confirm appointment
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Review the booking details before creating the appointment.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e7e2d8] bg-[#fbfaf6] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[#0d2d26]">
          <UserRound size={18} />
          Patient and appointment
        </div>

        <SummaryRow label="Patient" value={patientName} />
        <SummaryRow label="Phone" value={selectedPatient?.phone} />
        <SummaryRow label="Treatment" value={selectedTreatment?.name} />
        <SummaryRow label="Clinician" value={selectedClinician?.name} />

        <div className="my-2 border-t border-[#e7e2d8]" />

        <div className="flex items-start gap-3 py-2">
          <CalendarDays size={18} className="mt-0.5 text-[#b84620]" />
          <div>
            <p className="text-sm font-medium text-[#0d2d26]">
              {formatDate(selectedSlot?.date)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {formatTime(selectedSlot?.startsAt)} –{" "}
              {formatTime(selectedSlot?.endsAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <label
          htmlFor="comfortMode"
          className="block text-sm font-medium text-[#0d2d26]"
        >
          Patient comfort preference
        </label>

        <select
          id="comfortMode"
          className={inputClass}
          value={comfortMode}
          onChange={(event) => setComfortMode(event.target.value)}
          disabled={isSubmitting}
        >
          <option value="standard">Standard</option>
          <option value="extra_gentle">Extra gentle — additional care</option>
        </select>

        <p className="text-xs text-gray-500">
          These options must match the values accepted by your backend. Adjust
          the values if your database constraint uses different ones.
        </p>
      </section>

      <section className="space-y-2">
        <label
          htmlFor="appointmentNotes"
          className="block text-sm font-medium text-[#0d2d26]"
        >
          Appointment notes (optional)
        </label>

        <textarea
          id="appointmentNotes"
          className={inputClass}
          rows={3}
          maxLength={2000}
          placeholder="Relevant details for the clinician..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={isSubmitting}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-[#e7e2d8] pt-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dedbd2] px-4 py-3 text-sm font-medium text-[#0d2d26] disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          type="submit"
          disabled={!canConfirm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d2d26] px-5 py-3 text-sm font-semibold text-white hover:bg-[#17463b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={17} />
          {isSubmitting ? "Creating appointment..." : "Confirm appointment"}
        </button>
      </div>
    </form>
  );
}
