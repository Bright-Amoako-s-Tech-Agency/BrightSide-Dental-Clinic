import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Phone,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";
import PublicHeader from "../components/layout/PublicHeader";
import { apiRequest } from "../services/api";

export default function MyAppointments() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [appointments, setAppointments] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await apiRequest(`/appointments?phone=${encodeURIComponent(cleanPhone)}`);
      setAppointments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Failed to find appointments for this number.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <PublicHeader />

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
            Patient Portal
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#0d2d26]">
            Find your appointments
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#66716a]">
            Enter the phone number you used when booking to view your upcoming and past visits.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 rounded-2xl border border-[#e5e1d8] bg-white p-3 shadow-sm"
        >
          <div className="relative flex-1">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#8a9189]" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0551234987 or +233..."
              required
              className="w-full rounded-xl border border-transparent bg-[#fcfbf8] py-3 pl-11 pr-4 text-sm text-[#0d2d26] outline-none transition focus:border-[#0d2d26] focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d2d26] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#19463a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Search className="size-4" />
            )}
            Search
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#eed7d0] bg-[#fff5f2] p-4 text-sm text-[#8f3217]">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="mt-8 space-y-4">
            {appointments.length === 0 ? (
              <div className="rounded-2xl border border-[#e5e1d8] bg-white p-8 text-center text-[#66716a]">
                <p className="font-serif text-lg text-[#0d2d26]">
                  No appointments found
                </p>
                <p className="mt-1 text-sm">
                  We couldn't find any appointment records matching "{phone}".
                </p>
                <Link
                  to="/book"
                  className="mt-4 inline-block text-sm font-semibold text-[#b84620] hover:underline"
                >
                  Book your first visit →
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#7b827b]">
                  Found {appointments.length} appointment
                  {appointments.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-4">
                  {appointments.map((appt) => {
                    const startsDate = appt.starts_at
                      ? new Intl.DateTimeFormat("en-GH", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Africa/Accra",
                        }).format(new Date(appt.starts_at))
                      : "—";

                    const startsTime = appt.starts_at
                      ? new Intl.DateTimeFormat("en-GH", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "Africa/Accra",
                        }).format(new Date(appt.starts_at))
                      : "—";

                    return (
                      <div
                        key={appt.id}
                        className="overflow-hidden rounded-2xl border border-[#e5e1d8] bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eeece5] pb-3">
                          <div>
                            <span className="text-xs text-[#7b827b]">
                              Reference ID
                            </span>
                            <p className="font-mono text-xs font-bold text-[#0d2d26]">
                              {appt.id}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                              appt.status === "confirmed"
                                ? "bg-[#edf5ef] text-[#1e613b]"
                                : appt.status === "completed"
                                ? "bg-[#e5ece2] text-[#0d2d26]"
                                : appt.status === "cancelled"
                                ? "bg-[#fff5f2] text-[#8f3217]"
                                : "bg-[#fbf5e6] text-[#8c671f]"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <CalendarDays className="size-4 mt-0.5 text-[#b84620]" />
                            <div>
                              <p className="text-sm font-semibold text-[#0d2d26]">
                                {startsDate}
                              </p>
                              <p className="text-xs text-[#66716a]">
                                at {startsTime} (GMT)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Stethoscope className="size-4 mt-0.5 text-[#0d2d26]" />
                            <div>
                              <p className="text-sm font-semibold text-[#0d2d26]">
                                {appt.treatment?.name || "Dental visit"}
                              </p>
                              <p className="text-xs text-[#66716a]">
                                with {appt.clinician?.name || "Assigned clinician"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#f0eee6] pt-3 text-xs text-[#7b827b]">
                          <span>
                            Deposit: GH₵{Number(appt.deposit_amount || 0).toFixed(2)}
                          </span>
                          <Link
                            to={`/booking/confirmation?ref=${appt.id}`}
                            className="font-semibold text-[#0d2d26] hover:underline"
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
