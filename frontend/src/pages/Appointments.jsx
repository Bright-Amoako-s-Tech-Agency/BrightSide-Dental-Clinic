import { CalendarDays, Eye, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointments } from "../services/appointmentApi";

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPatientName(patient) {
  if (!patient) return "Unknown patient";

  return [patient.first_name, patient.last_name].filter(Boolean).join(" ");
}

function getStatusStyle(status) {
  switch (status) {
    case "confirmed":
      return "bg-[#e5eee8] text-[#31584d]";
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

function formatStatus(status = "unknown") {
  return status.replaceAll("_", " ");
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments({
        status: status || undefined,
        date: date || undefined,
      });

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [status, date]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return appointments;

    return appointments.filter((appointment) => {
      const patientName = getPatientName(appointment.patient).toLowerCase();
      const clinicianName = (appointment.clinician?.name || "").toLowerCase();
      const treatmentName = (appointment.treatment?.name || "").toLowerCase();

      return (
        patientName.includes(query) ||
        clinicianName.includes(query) ||
        treatmentName.includes(query)
      );
    });
  }, [appointments, search]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 border-b border-[#e5e1d8] pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#a94320]">
            <span className="h-2 w-2 rounded-full bg-[#b84620]" />
            BrightSmile • Staff Portal
          </div>

          <h1 className="font-serif text-4xl tracking-tight text-[#10231f] sm:text-5xl">
            Appointments
          </h1>

          <p className="mt-3 text-sm text-[#69706c]">
            View and track clinic bookings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAppointments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#eeece5] px-4 py-2.5 text-sm font-medium text-[#263b35] transition hover:bg-[#e4e1d8] disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(16,35,31,0.03)] sm:p-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px]">
          <label className="flex items-center gap-3 rounded-xl border border-[#e5e1d8] px-3 py-2.5">
            <Search size={17} className="shrink-0 text-[#69706c]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, clinician or treatment"
              className="w-full bg-transparent text-sm text-[#10231f] outline-none placeholder:text-[#969991]"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-[#e5e1d8] px-3 py-2.5">
            <CalendarDays size={16} className="shrink-0 text-[#69706c]" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Filter by appointment date"
              className="min-w-0 w-full bg-transparent text-sm text-[#263b35] outline-none"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by appointment status"
            className="rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm text-[#263b35] outline-none focus:border-[#31584d]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="no_show">No-show</option>
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between border-b border-[#eeeae2] pb-4">
          <p className="text-sm text-[#69706c]">
            {filteredAppointments.length} appointment
            {filteredAppointments.length === 1 ? "" : "s"}
          </p>

          {(date || status || search) && (
            <button
              type="button"
              onClick={() => {
                setDate("");
                setStatus("");
                setSearch("");
              }}
              className="text-xs font-semibold text-[#a94320] hover:text-[#843316]"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#e7c7bb] bg-[#fbefea] px-4 py-3 text-sm text-[#9f3c1b]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-14 text-center text-sm text-[#69706c]">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarDays size={28} className="mx-auto text-[#aaa69c]" />
            <h2 className="mt-3 font-serif text-xl text-[#10231f]">
              No appointments found
            </h2>
            <p className="mt-2 text-sm text-[#69706c]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#eeeae2] text-[10px] font-semibold uppercase tracking-wide text-[#69706c]">
                  <th className="py-4 pr-4">Date & time</th>
                  <th className="py-4 pr-4">Patient</th>
                  <th className="py-4 pr-4">Treatment</th>
                  <th className="py-4 pr-4">Clinician</th>
                  <th className="py-4 pr-4">Deposit</th>
                  <th className="py-4">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eeeae2]">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="text-sm">
                    <td className="whitespace-nowrap py-5 pr-4 text-[#263b35]">
                      {formatDateTime(appointment.starts_at)}
                    </td>

                    <td className="py-5 pr-4">
                      <p className="font-semibold text-[#10231f]">
                        {getPatientName(appointment.patient)}
                      </p>
                      <p className="mt-1 text-xs text-[#69706c]">
                        {appointment.patient?.phone || "No phone"}
                      </p>
                    </td>

                    <td className="py-5 pr-4 text-[#4d5752]">
                      {appointment.treatment?.name || "—"}
                    </td>

                    <td className="py-5 pr-4 text-[#4d5752]">
                      {appointment.clinician?.name || "—"}
                    </td>

                    <td className="whitespace-nowrap py-5 pr-4 text-[#4d5752]">
                      GH₵ {Number(appointment.deposit_amount || 0).toFixed(2)}
                    </td>

                    <td className="py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(appointment.status)}`}
                      >
                        {formatStatus(appointment.status)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        aria-label={`View appointment ${appointment.id}`}
                        title="View appointment details"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
