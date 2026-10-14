import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CalendarDayColumn from "../components/calendar/CalendarDayColumn";

import CalendarHeader from "../components/calendar/CalendarHeader";
import ClinicianDayColumn from "../components/calendar/ClinicianDayColumn";
import TimeColumn, {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  SLOT_HEIGHT,
  SLOT_MINUTES,
} from "../components/calendar/TimeColumn";

import { cancelAppointment, getAppointments } from "../services/appointmentApi";
import { getClinicians } from "../services/clinicianApi";

function getAccraDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getWeekDates(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (date.getUTCDay() + 6) % 7;

  const monday = addDays(dateString, -mondayOffset);

  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function formatDate(dateString, options = {}) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...options,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function isAppointmentOnDate(appointment, dateString) {
  return getAccraDate(new Date(appointment.starts_at)) === dateString;
}

export default function ScheduleCalendar() {
  const [selectedDate, setSelectedDate] = useState(getAccraDate);
  const [view, setView] = useState("day");
  const [clinicians, setClinicians] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedClinicianIds, setSelectedClinicianIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");

  const loadCalendarData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [clinicianData, appointmentData] = await Promise.all([
        getClinicians(),
        getAppointments(),
      ]);

      setClinicians(Array.isArray(clinicianData) ? clinicianData : []);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (err) {
      setError(err?.message || "Unable to load the schedule.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const visibleClinicians = useMemo(() => {
    if (selectedClinicianIds.length === 0) return clinicians;

    return clinicians.filter((clinician) =>
      selectedClinicianIds.includes(clinician.id),
    );
  }, [clinicians, selectedClinicianIds]);

  const dates = useMemo(
    () => (view === "week" ? getWeekDates(selectedDate) : [selectedDate]),
    [selectedDate, view],
  );

  function handleClinicianToggle(id) {
    if (id === "all") {
      setSelectedClinicianIds([]);
      return;
    }

    setSelectedClinicianIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function moveDate(amount) {
    setSelectedDate(
      addDays(selectedDate, view === "week" ? amount * 7 : amount),
    );
  }

  const calendarHeight =
    (((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / SLOT_MINUTES) *
    SLOT_HEIGHT;

  function handleEmptySlotClick({ date, time, clinician }) {
    openCalendarBooking({
      date,
      time,
      clinician: clinician ?? null,
    });
  }
  function handleAppointmentClick(appointment) {
    setSelectedAppointment(appointment);
  }
  async function handleCancelAppointment() {
    if (!selectedAppointment?.id || cancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?",
    );

    if (!confirmed) return;

    setCancelling(true);
    setCancellationError("");

    try {
      await cancelAppointment(selectedAppointment.id);

      setSelectedAppointment(null);
      await loadCalendarData(true);
    } catch (err) {
      setCancellationError(
        err?.message || "Unable to cancel this appointment.",
      );
    } finally {
      setCancelling(false);
    }
  }
  function closeAppointmentDetails() {
    setSelectedAppointment(null);
  }
  const { openCalendarBooking } = useOutletContext();
  return (
    <main className="min-h-screen bg-[#f7f4ed] p-4 text-[#0d2d26] md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={22} />
              <h1 className="text-2xl font-semibold">Schedule calendar</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Manage appointments across your clinical team.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCalendarData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#d9d5ca] bg-white px-3 py-2 text-sm font-medium hover:bg-[#fbfaf6] disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-sm">
          <div className="border-b border-[#e7e2d8] p-4">
            <CalendarHeader
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              view={view}
              onViewChange={setView}
              clinicians={clinicians}
              selectedClinicianIds={selectedClinicianIds}
              onClinicianToggle={handleClinicianToggle}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {view === "day"
                    ? formatDate(selectedDate, {
                        weekday: "long",
                        year: "numeric",
                      })
                    : `${formatDate(dates[0])} – ${formatDate(dates[6], {
                        year: "numeric",
                      })}`}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Displaying 08:00–18:00 · Accra time
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveDate(-1)}
                  aria-label="Previous date"
                  className="rounded-lg border border-[#e7e2d8] p-2 hover:bg-[#fbfaf6]"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getAccraDate())}
                  className="rounded-lg border border-[#e7e2d8] px-3 py-2 text-sm hover:bg-[#fbfaf6]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => moveDate(1)}
                  aria-label="Next date"
                  className="rounded-lg border border-[#e7e2d8] p-2 hover:bg-[#fbfaf6]"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadCalendarData()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading calendar…
            </div>
          ) : visibleClinicians.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium">No clinicians to display</p>
              <p className="mt-1 text-sm text-gray-500">
                Check that clinicians are active and available from the API.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {view === "day" ? (
                <div className="flex min-w-max">
                  <TimeColumn />
                  {visibleClinicians.map((clinician) => (
                    <ClinicianDayColumn
                      key={clinician.id}
                      clinician={clinician}
                      date={selectedDate}
                      appointments={appointments}
                      onEmptySlotClick={handleEmptySlotClick}
                      onAppointmentClick={handleAppointmentClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="min-w-max">
                  <div className="flex border-b border-[#e7e2d8] bg-[#fbfaf6]">
                    <div className="w-16 shrink-0 border-r border-[#e7e2d8]" />
                    {dates.map((date) => (
                      <div
                        key={date}
                        className="min-w-[220px] flex-1 border-r border-[#e7e2d8] p-3 text-center last:border-r-0"
                      >
                        <p className="text-xs text-gray-500">
                          {formatDate(date, { weekday: "short" })}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(date, { year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex">
                    <TimeColumn />

                    {dates.map((date) => (
                      <CalendarDayColumn
                        key={date}
                        date={date}
                        appointments={appointments}
                        onEmptySlotClick={({ date, time }) =>
                          handleEmptySlotClick({ date, time, clinician: null })
                        }
                        onAppointmentClick={handleAppointmentClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAppointmentDetails();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Appointment details</p>
                <h2
                  id="appointment-details-title"
                  className="mt-1 text-xl font-semibold"
                >
                  {selectedAppointment.patient
                    ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`
                    : "Patient"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAppointmentDetails}
                aria-label="Close appointment details"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Treatment
                </p>
                <p className="mt-1 font-medium">
                  {selectedAppointment.treatment?.name || "Not available"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Date
                  </p>
                  <p className="mt-1 text-sm">
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Africa/Accra",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(selectedAppointment.starts_at))}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Time
                  </p>
                  <p className="mt-1 text-sm">
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Africa/Accra",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(selectedAppointment.starts_at))}
                    {" – "}
                    {new Intl.DateTimeFormat("en-GB", {
                      timeZone: "Africa/Accra",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(selectedAppointment.ends_at))}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Clinician
                </p>
                <p className="mt-1 text-sm">
                  {selectedAppointment.clinician?.name || "Not available"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <p className="mt-1 text-sm capitalize">
                    {selectedAppointment.status?.replaceAll("_", " ") ||
                      "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Comfort mode
                  </p>
                  <p className="mt-1 text-sm">
                    {selectedAppointment.comfort_mode?.replaceAll("_", " ") ||
                      "Standard"}
                  </p>
                </div>
              </div>

              {selectedAppointment.patient?.phone && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Patient phone
                  </p>
                  <p className="mt-1 text-sm">
                    {selectedAppointment.patient.phone}
                  </p>
                </div>
              )}

              {selectedAppointment.patient?.email && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Patient email
                  </p>
                  <p className="mt-1 text-sm">
                    {selectedAppointment.patient.email}
                  </p>
                </div>
              )}
            </div>

            {["pending", "confirmed"].includes(selectedAppointment.status) && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                {cancellationError && (
                  <p className="mb-3 text-sm text-red-600">
                    {cancellationError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelling ? "Cancelling…" : "Cancel appointment"}
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeAppointmentDetails}
                className="rounded-lg bg-[#0d2d26] px-4 py-2 text-sm font-medium text-white hover:bg-[#19483b]"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
