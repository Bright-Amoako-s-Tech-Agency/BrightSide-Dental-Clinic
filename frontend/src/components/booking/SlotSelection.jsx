import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { getAvailability } from "../../services/availabilityApi";

function getAccraDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatSlotTime(timestamp) {
  return new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function SlotSelection({
  selectedTreatment,
  selectedClinician,
  selectedSlot,
  onSlotSelect,
}) {
  const [date, setDate] = useState(getAccraDate);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedTreatment?.id || !selectedClinician?.id || !date) {
      setSlots([]);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setLoading(true);
      setError("");
      setSlots([]);

      try {
        const result = await getAvailability({
          clinicianId: selectedClinician.id,
          treatmentId: selectedTreatment.id,
          date,
        });

        if (!cancelled) {
          setSlots(Array.isArray(result.slots) ? result.slots : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load available slots.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [selectedTreatment?.id, selectedClinician?.id, date]);

  function handleDateChange(event) {
    setDate(event.target.value);
    onSlotSelect(null);
  }

  function handleSlotSelect(slot) {
    onSlotSelect({
      ...slot,
      date,
    });
  }

  const today = getAccraDate();

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[#0d2d26]">Step 3 of 4</p>
        <h2 className="mt-1 text-xl font-semibold text-[#0d2d26]">
          Select an appointment time
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose a date to see the available times for your selected treatment
          and clinician.
        </p>
      </div>

      {(!selectedTreatment || !selectedClinician) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Select a treatment and clinician before choosing a time.
        </div>
      )}

      <div>
        <label
          htmlFor="booking-date"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Appointment date
        </label>

        <div className="relative">
          <CalendarDays
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="booking-date"
            type="date"
            value={date}
            min={today}
            onChange={handleDateChange}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#0d2d26]"
          />
        </div>
      </div>

      {loading && (
        <p role="status" className="text-sm text-gray-500">
          Checking available appointment times...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        selectedClinician &&
        selectedTreatment &&
        slots.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <CalendarDays size={26} className="mx-auto text-gray-400" />
            <p className="mt-2 font-medium text-[#0d2d26]">
              No available slots
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try another date to find an available appointment.
            </p>
          </div>
        )}

      {slots.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-medium text-[#0d2d26]">Available times</h3>
            <span className="text-sm text-gray-500">
              {slots.length} available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map((slot) => {
              const isSelected =
                selectedSlot?.startsAt === slot.startsAt &&
                selectedSlot?.date === date;

              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#0d2d26] bg-[#0d2d26] text-white"
                      : "border-gray-200 bg-white text-[#0d2d26] hover:border-[#0d2d26]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Clock3 size={16} />
                    {formatSlotTime(slot.startsAt)}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${
                      isSelected ? "text-gray-200" : "text-gray-500"
                    }`}
                  >
                    {slot.durationMinutes} minutes
                  </span>
                  {isSelected && (
                    <span className="mt-2 flex items-center gap-1 text-xs">
                      <CheckCircle2 size={14} />
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
