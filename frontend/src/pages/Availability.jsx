import { CalendarDays, Clock, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getClinicianSchedule } from "../services/availabilityApi";
import { getClinicians } from "../services/clinicianApi";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

function formatTime(value) {
  if (!value) return "—";

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Availability() {
  const [clinicians, setClinicians] = useState([]);
  const [clinicianId, setClinicianId] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClinicians() {
      setLoadingClinicians(true);
      setError("");

      try {
        const data = await getClinicians();
        const list = Array.isArray(data) ? data : [];

        setClinicians(list);
        setClinicianId((current) => current || list[0]?.id || "");
      } catch (err) {
        setError(err.message || "Failed to load clinicians.");
      } finally {
        setLoadingClinicians(false);
      }
    }

    loadClinicians();
  }, []);

  useEffect(() => {
    if (!clinicianId) {
      setSchedule(null);
      return;
    }

    let cancelled = false;

    async function loadSchedule() {
      setLoadingSchedule(true);
      setError("");

      try {
        const data = await getClinicianSchedule(clinicianId);

        if (!cancelled) {
          setSchedule(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSchedule(null);
          setError(err.message || "Failed to load clinician schedule.");
        }
      } finally {
        if (!cancelled) {
          setLoadingSchedule(false);
        }
      }
    }

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [clinicianId]);

  async function refreshSchedule() {
    if (!clinicianId) return;

    setRefreshing(true);
    setError("");

    try {
      const data = await getClinicianSchedule(clinicianId);
      setSchedule(data);
    } catch (err) {
      setError(err.message || "Failed to refresh clinician schedule.");
    } finally {
      setRefreshing(false);
    }
  }

  const availability = schedule?.availability || [];
  const timeOff = schedule?.timeOff || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Clinician Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review weekly working hours and upcoming time off.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshSchedule}
          disabled={!clinicianId || loadingSchedule || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <label
          htmlFor="availability-clinician"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Select clinician
        </label>

        <div className="relative max-w-md">
          <UserRound
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            id="availability-clinician"
            value={clinicianId}
            onChange={(event) => setClinicianId(event.target.value)}
            disabled={loadingClinicians || clinicians.length === 0}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
          >
            {loadingClinicians ? (
              <option value="">Loading clinicians...</option>
            ) : clinicians.length === 0 ? (
              <option value="">No clinicians available</option>
            ) : (
              clinicians.map((clinician) => (
                <option key={clinician.id} value={clinician.id}>
                  {clinician.name}
                </option>
              ))
            )}
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          {clinicianId && (
            <button
              type="button"
              onClick={refreshSchedule}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {loadingSchedule && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading clinician schedule...
        </div>
      )}

      {!loadingSchedule && schedule && !error && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <CalendarDays size={20} className="text-slate-500" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Weekly working hours
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {schedule.clinician?.name || "Selected clinician"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {DAYS.map((day) => {
                const entries = availability.filter(
                  (entry) => Number(entry.day_of_week) === day.value,
                );

                return (
                  <div
                    key={day.value}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[140px_1fr] sm:items-start"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      {day.label}
                    </p>

                    {entries.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No working hours configured
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {entries.map((entry) => (
                          <span
                            key={entry.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                          >
                            <Clock size={15} />
                            {formatTime(entry.start_time)} –{" "}
                            {formatTime(entry.end_time)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
              <CalendarDays size={20} className="text-slate-500" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Upcoming time off
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {timeOff.length} {timeOff.length === 1 ? "period" : "periods"}
                </p>
              </div>
            </div>

            {timeOff.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No upcoming time off recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {timeOff.map((period) => (
                  <div key={period.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {formatDateTime(period.starts_at)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Until {formatDateTime(period.ends_at)}
                    </p>
                    {period.reason && (
                      <p className="mt-2 text-sm text-slate-700">
                        {period.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
