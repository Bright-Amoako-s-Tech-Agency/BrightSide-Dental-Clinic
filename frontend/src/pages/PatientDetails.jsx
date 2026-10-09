import { ArrowLeft, CalendarDays, Mail, Phone, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPatientAppointments } from "../services/appointmentApi";
import { getPatientById } from "../services/patientApi";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : "—";
}

function patientName(patient) {
  return (
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    "Unnamed patient"
  );
}

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDetails(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [patientData, appointmentData] = await Promise.all([
        getPatientById(id),
        getPatientAppointments(id),
      ]);

      setPatient(patientData);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (err) {
      setError(err.message || "Failed to load patient details.");
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
        Loading patient details...
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to patients
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => loadDetails(true)}
            className="ml-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/patients"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back to patients
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            {patientName(patient)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Patient details and appointment history
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

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Patient details loaded, but appointment history could not be
          refreshed: {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Contact information
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Phone
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <Phone size={15} /> {patient.phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <Mail size={15} /> {patient.email || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Date of birth
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {formatDate(patient.date_of_birth)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Registered
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {formatDate(patient.created_at)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {patient.notes || "No notes recorded."}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Date & time",
                  "Clinician",
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
              {appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    No appointments found for this patient.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatDateTime(appointment.starts_at)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {appointment.clinician?.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {appointment.treatment?.name || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
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
