import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarHeader({
  selectedDate,
  onDateChange,
  view,
  onViewChange,
  clinicians = [],
  selectedClinicianIds = [],
  onClinicianToggle,
}) {
  const date = new Date(`${selectedDate}T12:00:00`);

  const dateLabel = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function shiftDate(amount) {
    const next = new Date(`${selectedDate}T12:00:00`);

    next.setDate(next.getDate() + (view === "day" ? amount : amount * 7));

    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");

    onDateChange(`${year}-${month}-${day}`);
  }

  function goToToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    onDateChange(`${year}-${month}-${day}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0d2d26]">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage appointments across your clinicians.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-[#dedbd2] bg-white px-3 py-2 text-sm font-medium text-[#0d2d26]"
          >
            Today
          </button>

          <div className="flex items-center rounded-lg border border-[#dedbd2] bg-white">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              aria-label="Previous date"
              className="p-2 text-[#0d2d26] hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="min-w-32 text-center text-sm font-medium text-[#0d2d26]">
              {dateLabel}
            </span>

            <button
              type="button"
              onClick={() => shiftDate(1)}
              aria-label="Next date"
              className="p-2 text-[#0d2d26] hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex rounded-lg border border-[#dedbd2] bg-white p-1">
            {["day", "week"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onViewChange(option)}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                  view === option
                    ? "bg-[#0d2d26] text-white"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays size={17} className="mr-1 text-gray-500" />

        <button
          type="button"
          onClick={() => onClinicianToggle("all")}
          className={[
            "rounded-full border px-3 py-1.5 text-sm",
            selectedClinicianIds.length === 0
              ? "border-[#0d2d26] bg-[#0d2d26] text-white"
              : "border-[#dedbd2] bg-white text-[#0d2d26]",
          ].join(" ")}
        >
          All clinicians
        </button>

        {clinicians.map((clinician) => {
          const selected = selectedClinicianIds.includes(clinician.id);

          return (
            <button
              key={clinician.id}
              type="button"
              onClick={() => onClinicianToggle(clinician.id)}
              className={[
                "rounded-full border px-3 py-1.5 text-sm",
                selected
                  ? "border-[#0d2d26] bg-[#0d2d26] text-white"
                  : "border-[#dedbd2] bg-white text-[#0d2d26]",
              ].join(" ")}
            >
              {clinician.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
