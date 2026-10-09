import { ArrowLeft, CalendarDays, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClinicianAppointments } from "../services/appointmentApi";
import { getClinicianById } from "../services/clinicianApi";

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : "—";
}

function getPatientName(patient) {
  return (
    `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim() ||
    "Unknown patient"
  );
}

function getStatusClasses(status) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "cancelled":
    case "no_show":
      return "bg-red-50 text-red-700";
    case "completed":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function ClinicianDetails() {
  const { id } = useParams();

  const [clinician, setClinician] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [appointmentError, setAppointmentError] = useState("");

  async function loadDetails(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");
    setAppointmentError("");

    try {
      const clinicianData = await getClinicianById(id);
      setClinician(clinicianData);
    } catch (err) {
      setError(err.message || "Failed to load clinician details.");
      setClinician(null);
      setAppointments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const appointmentData = await getClinicianAppointments(id);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (err) {
      setAppointmentError(err.message || "Failed to load appointment history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading clinician details...
      </div>
    );
  }

  if (error || !clinician) {
    return (
      <div className="space-y-4">
        <Link
          to="/clinicians"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to clinicians
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Clinician not found."}
          <button
            type="button"
            onClick={() => loadDetails(true)}
            className="ml-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/clinicians"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to clinicians
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900">
            {clinician.name || "Unnamed clinician"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {clinician.title || "Dental professional"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDetails(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-4">
          {clinician.image_url ? (
            <img
              src={clinician.image_url}
              alt={clinician.name || "Clinician"}
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Stethoscope size={30} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Professional profile
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  clinician.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {clinician.active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {clinician.specialty || "Specialty not specified"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Specialty
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {clinician.specialty || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Experience
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {clinician.experience_years == null
                ? "—"
                : `${clinician.experience_years} ${
                    Number(clinician.experience_years) === 1 ? "year" : "years"
                  }`}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Consultation fee
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {formatAmount(clinician.consultation_fee)}
            </p>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Biography
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {clinician.bio || "No biography recorded."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <CalendarDays size={20} className="text-slate-500" />
          <div>
            <h2 className="font-semibold text-slate-900">
              Appointment history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {appointments.length}{" "}
              {appointments.length === 1 ? "appointment" : "appointments"}
            </p>
          </div>
        </div>

        {appointmentError && (
          <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Could not load appointment history: {appointmentError}
            <button
              type="button"
              onClick={() => loadDetails(true)}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Date & time",
                  "Patient",
                  "Treatment",
                  "Status",
                  "Total amount",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {appointmentError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Appointment history is unavailable.
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No appointments found for this clinician.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatDateTime(appointment.starts_at)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {getPatientName(appointment.patient)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {appointment.treatment?.name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(
                          appointment.status,
                        )}`}
                      >
                        {(appointment.status || "unknown").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatAmount(appointment.total_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
