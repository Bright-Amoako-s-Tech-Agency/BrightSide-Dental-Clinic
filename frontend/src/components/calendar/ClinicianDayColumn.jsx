import AppointmentCard from "./AppointmentCard";
import {
    CALENDAR_END_MINUTES,
    CALENDAR_START_MINUTES,
    SLOT_HEIGHT,
    SLOT_MINUTES,
} from "./TimeColumn";

const TOTAL_MINUTES = CALENDAR_END_MINUTES - CALENDAR_START_MINUTES;

const TOTAL_HEIGHT = (TOTAL_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT;

function getMinutesInAccra(timestamp) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));

  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);

  return hour * 60 + minute;
}

function isSameDateInAccra(timestamp, date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}` === date;
}

export default function ClinicianDayColumn({
  clinician,
  date,
  appointments = [],
  onEmptySlotClick,
  onAppointmentClick,
}) {
  const clinicianAppointments = appointments.filter(
    (appointment) =>
      appointment.clinician_id === clinician.id &&
      appointment.status !== "cancelled" &&
      isSameDateInAccra(appointment.starts_at, date),
  );

  function handleSlotClick(startMinutes) {
    const hour = String(Math.floor(startMinutes / 60)).padStart(2, "0");
    const minute = String(startMinutes % 60).padStart(2, "0");

    onEmptySlotClick?.({
      date,
      time: `${hour}:${minute}`,
      clinician,
    });
  }

  return (
    <div className="min-w-[180px] flex-1 border-r border-[#e7e2d8] last:border-r-0">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-center border-b border-[#e7e2d8] bg-white px-2 text-center">
        <div>
          <p className="text-sm font-semibold text-[#0d2d26]">
            {clinician.name}
          </p>
          {clinician.title && (
            <p className="truncate text-xs text-gray-500">{clinician.title}</p>
          )}
        </div>
      </div>

      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {Array.from(
          {
            length: TOTAL_MINUTES / SLOT_MINUTES,
          },
          (_, index) => {
            const startMinutes = CALENDAR_START_MINUTES + index * SLOT_MINUTES;

            return (
              <button
                key={startMinutes}
                type="button"
                aria-label={`Book ${clinician.name} at ${String(
                  Math.floor(startMinutes / 60),
                ).padStart(2, "0")}:${String(startMinutes % 60).padStart(
                  2,
                  "0",
                )}`}
                onClick={() => handleSlotClick(startMinutes)}
                className={[
                  "absolute left-0 right-0 w-full border-t border-[#e7e2d8] text-left",
                  startMinutes % 60 === 0
                    ? "border-t-[#d8d4ca]"
                    : "border-t-[#efede7]",
                  "hover:bg-[#edf3ee] focus:bg-[#edf3ee] focus:outline-none",
                ].join(" ")}
                style={{
                  top: index * SLOT_HEIGHT,
                  height: SLOT_HEIGHT,
                }}
              />
            );
          },
        )}

        {clinicianAppointments.map((appointment) => {
          const startMinutes = getMinutesInAccra(appointment.starts_at);

          const endMinutes = getMinutesInAccra(appointment.ends_at);

          const durationMinutes =
            new Date(appointment.ends_at).getTime() -
            new Date(appointment.starts_at).getTime();

          const duration = durationMinutes / 60000;

          const top =
            ((startMinutes - CALENDAR_START_MINUTES) / SLOT_MINUTES) *
            SLOT_HEIGHT;

          const height = (duration / SLOT_MINUTES) * SLOT_HEIGHT;

          // Skip appointments outside the visible calendar window.
          if (
            endMinutes <= CALENDAR_START_MINUTES ||
            startMinutes >= CALENDAR_END_MINUTES
          ) {
            return null;
          }

          return (
            <div
              key={appointment.id}
              className="absolute left-0 right-0"
              style={{
                top: Math.max(top, 0),
                height: Math.min(height, TOTAL_HEIGHT - Math.max(top, 0)),
              }}
            >
              <AppointmentCard
                appointment={appointment}
                onClick={onAppointmentClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
