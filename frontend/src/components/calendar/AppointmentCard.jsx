import { Clock3, UserRound } from "lucide-react";
import { SLOT_HEIGHT, SLOT_MINUTES } from "./TimeColumn";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-rose-100 text-rose-800",
};

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentCard({ appointment, onClick }) {
  const start = new Date(appointment.starts_at);
  const end = new Date(appointment.ends_at);

  const durationMinutes = Math.max(
    0,
    (end.getTime() - start.getTime()) / 60000,
  );

  const height = (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT;

  const status = appointment.status || "pending";
  const patient = appointment.patient;
  const treatment = appointment.treatment;

  const comfortLabels = {
    standard: "Standard",
    extra_gentle: "Extra gentle",
  };

  return (
    <button
      type="button"
      onClick={() => onClick?.(appointment)}
      title={`${patient?.first_name || ""} ${patient?.last_name || ""} — ${treatment?.name || "Appointment"}`}
      className="absolute left-1 right-1 z-10 overflow-hidden rounded-lg border border-[#b9cfc3] bg-[#e6f0e9] p-2 text-left shadow-sm transition hover:z-20 hover:border-[#0d2d26] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d2d26]"
      style={{
        top: 0,
        height: Math.max(height - 2, 24),
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="truncate text-xs font-semibold text-[#0d2d26]">
          {patient ? `${patient.first_name} ${patient.last_name}` : "Patient"}
        </span>

        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
        >
          {status.replace("_", " ")}
        </span>
      </div>

      <p className="mt-1 truncate text-[11px] text-[#315c4b]">
        {treatment?.name || "Treatment"}
      </p>

      {height >= 54 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-[#315c4b]">
          <Clock3 size={11} />
          {formatTime(appointment.starts_at)} –{" "}
          {formatTime(appointment.ends_at)}
        </div>
      )}

      {height >= 76 && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] text-[#315c4b]">
            <UserRound size={9} />
            {comfortLabels[appointment.comfort_mode] ||
              appointment.comfort_mode ||
              "Standard"}
          </span>
        </div>
      )}
    </button>
  );
}
