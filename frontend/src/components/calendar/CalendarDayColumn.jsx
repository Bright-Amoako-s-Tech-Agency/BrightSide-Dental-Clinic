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

  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  return hour * 60 + minute;
}

function getAccraDate(timestamp) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export default function CalendarDayColumn({
  date,
  appointments = [],
  onAppointmentClick,
  onEmptySlotClick,
}) {
  const dayAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "cancelled" &&
      getAccraDate(appointment.starts_at) === date,
  );

  function handleSlotClick(startMinutes) {
    const hour = String(Math.floor(startMinutes / 60)).padStart(2, "0");
    const minute = String(startMinutes % 60).padStart(2, "0");

    onEmptySlotClick?.({ date, time: `${hour}:${minute}` });
  }

  return (
    <div className="min-w-[220px] flex-1 border-r border-[#e7e2d8] last:border-r-0">
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {Array.from({ length: TOTAL_MINUTES / SLOT_MINUTES }, (_, index) => {
          const startMinutes = CALENDAR_START_MINUTES + index * SLOT_MINUTES;

          return (
            <button
              key={startMinutes}
              type="button"
              aria-label={`Book on ${date} at ${String(
                Math.floor(startMinutes / 60),
              ).padStart(2, "0")}:${String(startMinutes % 60).padStart(
                2,
                "0",
              )}`}
              onClick={() => handleSlotClick(startMinutes)}
              className={[
                "absolute left-0 right-0 w-full border-t text-left",
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
        })}

        {dayAppointments.map((appointment) => {
          const startMinutes = getMinutesInAccra(appointment.starts_at);
          const durationMinutes =
            (new Date(appointment.ends_at).getTime() -
              new Date(appointment.starts_at).getTime()) /
            60000;

          const top =
            ((startMinutes - CALENDAR_START_MINUTES) / SLOT_MINUTES) *
            SLOT_HEIGHT;
          const height = (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT;

          const visibleTop = Math.max(top, 0);
          const visibleBottom = Math.min(top + height, TOTAL_HEIGHT);
          const visibleHeight = visibleBottom - visibleTop;

          if (visibleHeight <= 0) return null;

          return (
            <div
              key={appointment.id}
              className="absolute left-0 right-0"
              style={{
                top: visibleTop,
                height: visibleHeight,
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
