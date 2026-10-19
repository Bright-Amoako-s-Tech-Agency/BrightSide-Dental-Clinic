import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { apiRequest } from "../services/api";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("ref");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAppointment() {
      if (!appointmentId) {
        setLoading(false);
        setError("No appointment reference provided.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await apiRequest(`/appointments/${appointmentId}`);
        if (!cancelled) {
          if (res?.data) {
            setAppointment(res.data);
          } else {
            throw new Error("Appointment could not be found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Failed to load appointment details. Please check your reference."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAppointment();

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const patientName = appointment?.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : "Valued Patient";

  const formattedDate = appointment?.starts_at
    ? new Intl.DateTimeFormat("en-GH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Accra",
      }).format(new Date(appointment.starts_at))
    : "—";

  const formattedTime = appointment?.starts_at
    ? new Intl.DateTimeFormat("en-GH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Africa/Accra",
      }).format(new Date(appointment.starts_at))
    : "—";

  const formattedEndTime = appointment?.ends_at
    ? new Intl.DateTimeFormat("en-GH", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Africa/Accra",
      }).format(new Date(appointment.ends_at))
    : null;

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <header className="border-b border-[#e5e1d8] bg-[#f7f4ed]/95">
        <div className="mx-auto flex min-h-[76px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="font-serif text-2xl font-semibold text-[#0d2d26]"
          >
            BrightSide Dental
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/my-appointments"
              className="rounded-full border border-[#dcd9ce] px-4 py-2 text-sm text-[#46504c] transition hover:bg-white"
            >
              My appointments
            </Link>
            <Link
              to="/"
              className="rounded-full border border-[#dcd9ce] px-4 py-2 text-sm text-[#46504c] transition hover:bg-white"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {loading && (
          <div className="rounded-3xl border border-[#e5e1d8] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#0d2d26] border-t-transparent" />
            <p className="mt-4 text-sm text-[#66716a]">
              Loading your appointment confirmation...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-[#eed7d0] bg-[#fff5f2] p-8 text-center shadow-sm">
            <p className="font-serif text-2xl text-[#8f3217]">
              Appointment not found
            </p>
            <p className="mt-2 text-sm text-[#66716a]">{error}</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                to="/book"
                className="rounded-full bg-[#0d2d26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#19463a]"
              >
                Book new visit
              </Link>
              <Link
                to="/my-appointments"
                className="rounded-full border border-[#dcd9ce] bg-white px-5 py-2.5 text-sm font-medium text-[#46504c]"
              >
                Find by phone
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && appointment && (
          <div className="overflow-hidden rounded-[28px] border border-[#e5e1d8] bg-white shadow-[0_18px_60px_rgba(16,35,31,0.06)]">
            {/* Top banner */}
            <div className="bg-[#0d2d26] px-6 py-8 text-center text-white sm:px-10 sm:py-10">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9b29c]/20 text-[#e9b29c]">
                <CheckCircle2 className="size-10" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#e9b29c]">
                Deposit verified & confirmed
              </p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
                You're all booked, {appointment.patient?.first_name || "there"}!
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
                A booking reference has been registered for your visit. Keep this page or note down your reference below.
              </p>
            </div>

            {/* Details content */}
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeece5] pb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#7b827b]">
                    Appointment Reference
                  </span>
                  <p className="font-mono text-base font-bold text-[#0d2d26]">
                    {appointment.id}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#edf5ef] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#1e613b]">
                  <span className="size-2 rounded-full bg-[#2da458]" />
                  {appointment.status}
                </div>
              </div>

              {/* Highlight card */}
              <div className="mt-6 grid gap-4 rounded-2xl border border-[#e5e1d8] bg-[#fbfaf6] p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5ece2] text-[#0d2d26]">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7b827b]">Date & Time</p>
                    <p className="text-sm font-semibold text-[#0d2d26]">
                      {formattedDate}
                    </p>
                    <p className="text-xs text-[#66716a]">
                      {formattedTime} {formattedEndTime ? `– ${formattedEndTime}` : ""} (GMT)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5ece2] text-[#0d2d26]">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#7b827b]">Clinician & Treatment</p>
                    <p className="text-sm font-semibold text-[#0d2d26]">
                      {appointment.clinician?.name || "Assigned clinician"}
                    </p>
                    <p className="text-xs text-[#66716a]">
                      {appointment.treatment?.name || "Dental treatment"} (
                      {appointment.treatment?.duration_minutes || 30} mins)
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient and financials */}
              <div className="mt-6 rounded-2xl border border-[#eeece5] p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7b827b]">
                  Summary details
                </h2>
                <dl className="mt-3 divide-y divide-[#f0eee6] text-sm">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#66716a]">Patient Name</dt>
                    <dd className="font-medium text-[#0d2d26]">{patientName}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#66716a]">Phone Number</dt>
                    <dd className="font-medium text-[#0d2d26]">
                      {appointment.patient?.phone || "—"}
                    </dd>
                  </div>
                  {appointment.patient?.email && (
                    <div className="flex justify-between py-2.5">
                      <dt className="text-[#66716a]">Confirmation Email</dt>
                      <dd className="font-medium text-[#0d2d26]">
                        {appointment.patient.email}
                      </dd>
                    </div>
                  )}
                  {appointment.patient?.date_of_birth && (
                    <div className="flex justify-between py-2.5">
                      <dt className="text-[#66716a]">Date of Birth</dt>
                      <dd className="font-medium text-[#0d2d26]">
                        {appointment.patient.date_of_birth}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#66716a]">Deposit Paid</dt>
                    <dd className="font-semibold text-[#2da458]">
                      GH₵{Number(appointment.deposit_amount || 0).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#66716a]">Balance Due at Visit</dt>
                    <dd className="font-semibold text-[#0d2d26]">
                      GH₵{Number(appointment.balance_amount || 0).toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* What to bring / Preparation tips */}
              <div className="mt-6 rounded-2xl bg-[#f7f4ed] p-5">
                <div className="flex items-center gap-2 font-medium text-[#0d2d26]">
                  <ShieldCheck className="size-5 text-[#b84620]" />
                  <span>Important visit instructions</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs leading-5 text-[#66716a]">
                  <li>• Please arrive 10 to 15 minutes before your scheduled start time.</li>
                  <li>• If this is your first visit, please bring a valid photo identification card.</li>
                  <li>• Remaining fees can be paid in clinic via cash, card, or Mobile Money.</li>
                  <li>
                    • To reschedule or cancel, please provide at least 24 hours advance notice.
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center rounded-full border border-[#dcd9ce] px-6 py-3 text-sm font-semibold text-[#0d2d26] transition hover:bg-[#f7f4ed]"
                >
                  Book another visit
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full bg-[#0d2d26] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#19463a]"
                >
                  Done & return home
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
