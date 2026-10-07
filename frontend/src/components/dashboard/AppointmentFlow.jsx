function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPatientName(patient) {
  if (!patient) return "Unknown patient";

  return `${patient.first_name} ${patient.last_name}`;
}

function getStatusStyles(status) {
  switch (status) {
    case "confirmed":
      return "bg-[#e8eee9] text-[#31584d]";

    case "pending":
      return "bg-[#f9dfd3] text-[#a94320]";

    case "cancelled":
      return "bg-[#eeeae3] text-[#77736d]";

    case "completed":
      return "bg-[#e5ebe8] text-[#31584d]";

    case "no_show":
      return "bg-[#f3e5df] text-[#a94320]";

    default:
      return "bg-[#eeeae3] text-[#5e625f]";
  }
}

function formatStatus(status) {
  return status.replace("_", " ");
}

export default function AppointmentFlow({ appointments }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(16,35,31,0.03)]">
      <div className="flex flex-col justify-between gap-4 border-b border-[#ece9e1] pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-2xl text-[#10231f]">In-Clinic Flow</h2>

          <p className="mt-1 text-xs text-[#69706c]">
            Today's scheduled appointments
          </p>
        </div>

        <div className="rounded-xl bg-[#f2f0e9] px-3 py-2 text-xs font-medium text-[#4d5752]">
          All Today ({appointments.length})
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-serif text-xl text-[#10231f]">
            No appointments today
          </p>

          <p className="mt-2 text-sm text-[#69706c]">
            The clinic has no appointments scheduled for today.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#eeeae2]">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="grid gap-4 py-5 md:grid-cols-[100px_1.3fr_1fr_120px] md:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-[#10231f]">
                  {formatTime(appointment.starts_at)}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-wide text-[#69706c]">
                  {appointment.comfort_mode?.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#10231f]">
                  {getPatientName(appointment.patient)}
                </p>

                <p className="mt-1 text-xs text-[#69706c]">
                  {appointment.treatment?.name || "Treatment"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#4d5752]">
                  {appointment.clinician?.name || "Clinician"}
                </p>

                <p className="mt-1 text-xs text-[#69706c]">
                  Deposit: GH₵ {Number(appointment.deposit_amount).toFixed(2)}
                </p>
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ${getStatusStyles(
                    appointment.status,
                  )}`}
                >
                  {formatStatus(appointment.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
