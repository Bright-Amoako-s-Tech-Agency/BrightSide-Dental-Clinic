import { useMemo, useState } from "react";

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-GH", {
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

function getHour(value) {
  return new Date(value).getHours();
}

export default function AppointmentFlow({ appointments }) {
  const [filter, setFilter] = useState("all");

  const filteredAppointments = useMemo(() => {
    if (filter === "morning") {
      return appointments.filter((appointment) => {
        const hour = getHour(appointment.starts_at);
        return hour < 12;
      });
    }

    if (filter === "afternoon") {
      return appointments.filter((appointment) => {
        const hour = getHour(appointment.starts_at);
        return hour >= 12;
      });
    }

    return appointments;
  }, [appointments, filter]);

  const filters = [
    {
      id: "all",
      label: "All Today",
      count: appointments.length,
    },
    {
      id: "morning",
      label: "Morning",
      count: appointments.filter(
        (appointment) => getHour(appointment.starts_at) < 12,
      ).length,
    },
    {
      id: "afternoon",
      label: "Afternoon",
      count: appointments.filter(
        (appointment) => getHour(appointment.starts_at) >= 12,
      ).length,
    },
  ];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(16,35,31,0.03)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#ece9e1] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#10231f]">In-Clinic Flow</h2>

          <p className="mt-1 text-xs text-[#69706c]">
            Today's scheduled appointments
          </p>
        </div>

        {/* Filters */}
        <div className="flex w-fit items-center rounded-xl bg-[#f2f0e9] p-1">
          {filters.map((item) => {
            const active = filter === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-white text-[#10231f] shadow-sm"
                    : "text-[#69706c] hover:text-[#10231f]"
                }`}
              >
                {item.label} ({item.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {filteredAppointments.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-serif text-xl text-[#10231f]">
            No appointments in this period
          </p>

          <p className="mt-2 text-sm text-[#69706c]">
            There are no appointments matching this filter.
          </p>
        </div>
      ) : (
        <>
          {/* Table heading */}
          <div className="hidden grid-cols-[110px_1.3fr_1fr_120px] gap-4 border-b border-[#eeeae2] px-0 py-4 text-[10px] font-semibold uppercase tracking-wide text-[#69706c] md:grid">
            <span>Slot</span>
            <span>Patient & Treatment</span>
            <span>Clinician & Payment</span>
            <span>Status</span>
          </div>

          {/* Appointments */}
          <div className="divide-y divide-[#eeeae2]">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="grid gap-4 py-5 md:grid-cols-[110px_1.3fr_1fr_120px] md:items-center"
              >
                {/* Time */}
                <div>
                  <p className="text-sm font-semibold text-[#10231f]">
                    {formatTime(appointment.starts_at)}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wide text-[#69706c]">
                    {appointment.comfort_mode?.replace("_", " ")}
                  </p>
                </div>

                {/* Patient */}
                <div>
                  <p className="text-sm font-semibold text-[#10231f]">
                    {getPatientName(appointment.patient)}
                  </p>

                  <p className="mt-1 text-xs text-[#69706c]">
                    {appointment.treatment?.name || "Treatment"}
                  </p>
                </div>

                {/* Clinician / payment */}
                <div>
                  <p className="text-xs text-[#4d5752]">
                    {appointment.clinician?.name || "Clinician"}
                  </p>

                  <p className="mt-1 text-xs text-[#69706c]">
                    Deposit: GH₵{" "}
                    {Number(appointment.deposit_amount || 0).toFixed(2)}
                  </p>
                </div>

                {/* Status */}
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
        </>
      )}
    </section>
  );
}
