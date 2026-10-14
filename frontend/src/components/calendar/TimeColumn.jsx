export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 18;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 32;

export const CALENDAR_START_MINUTES = CALENDAR_START_HOUR * 60;
export const CALENDAR_END_MINUTES = CALENDAR_END_HOUR * 60;

export default function TimeColumn() {
  const slots = [];

  for (
    let minutes = CALENDAR_START_MINUTES;
    minutes < CALENDAR_END_MINUTES;
    minutes += SLOT_MINUTES
  ) {
    slots.push(minutes);
  }

  function formatTime(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return (
    <div className="relative w-16 shrink-0 border-r border-[#e7e2d8] bg-[#fbfaf6]">
      {slots.map((minutes) => (
        <div
          key={minutes}
          className="relative border-t border-[#e7e2d8]"
          style={{ height: SLOT_HEIGHT }}
        >
          {minutes % 60 === 0 && (
            <span className="absolute -top-2.5 right-2 bg-[#fbfaf6] px-1 text-[11px] text-gray-500">
              {formatTime(minutes)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
