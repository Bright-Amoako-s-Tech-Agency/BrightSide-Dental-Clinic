import {
  BriefcaseMedical,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getClinicians } from "../services/clinicianApi";

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : "—";
}

export default function Clinicians() {
  const [clinicians, setClinicians] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadClinicians(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const data = await getClinicians();
      setClinicians(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load clinicians.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadClinicians();
  }, []);

  const filteredClinicians = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clinicians;

    return clinicians.filter((clinician) =>
      [
        clinician.name,
        clinician.title,
        clinician.specialty,
        clinician.slug,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [clinicians, search]);

  const activeCount = clinicians.filter(
    (clinician) => clinician.active === true,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clinicians</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your dental team and their professional details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadClinicians(true)}
          disabled={loading || refreshing}
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
              <p className="text-sm text-slate-500">Clinicians found</p>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : filteredClinicians.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
              <BriefcaseMedical size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active clinicians</p>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : activeCount}
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
              placeholder="Search name, title, or specialty..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => loadClinicians(true)}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Clinician",
                  "Specialty",
                  "Experience",
                  "Consultation fee",
                  "Status",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading clinicians...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Clinician data could not be loaded.
                  </td>
                </tr>
              ) : filteredClinicians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Stethoscope size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No clinicians found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search term.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClinicians.map((clinician) => (
                  <tr
                    key={clinician.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {clinician.name || "Unnamed clinician"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {clinician.title || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {clinician.specialty || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {clinician.experience_years == null
                        ? "—"
                        : `${clinician.experience_years} ${
                            Number(clinician.experience_years) === 1
                              ? "year"
                              : "years"
                          }`}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {formatAmount(clinician.consultation_fee)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          clinician.active === true
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {clinician.active === true ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/clinicians/${clinician.id}`}
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
            Showing {filteredClinicians.length}{" "}
            {filteredClinicians.length === 1 ? "clinician" : "clinicians"}
          </div>
        )}
      </div>
    </div>
  );
}
