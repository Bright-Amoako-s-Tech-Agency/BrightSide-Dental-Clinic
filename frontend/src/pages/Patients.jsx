import {
  CalendarDays,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../services/patientApi";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPatientName(patient) {
  return (
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    "Unnamed patient"
  );
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadPatients(isRefresh = false, searchTerm = search) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getPatients(searchTerm);
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load patients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPatients(false, search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and search your dental clinic's patient directory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPatients(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Patients found</p>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : patients.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Directory status</p>
              <p className="text-lg font-semibold text-slate-900">
                {loading ? "Loading..." : error ? "Unavailable" : "Up to date"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone number..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => loadPatients(true)}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Patient
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date of birth
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Registered
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading patients...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Patient data could not be loaded.
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Users size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No patients found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another name or phone number.
                    </p>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {getPatientName(patient)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        ID: {patient.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone size={14} className="text-slate-400" />
                        {patient.phone || "—"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Mail size={14} className="text-slate-400" />
                        {patient.email || "No email"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(patient.date_of_birth)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(patient.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            Showing {patients.length}{" "}
            {patients.length === 1 ? "patient" : "patients"}
          </div>
        )}
      </div>
    </div>
  );
}
