import { CheckCircle2, Stethoscope, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getClinicians } from "../../services/clinicianApi";
import { getTreatments } from "../../services/treatmentApi";

export default function ServiceAndDoctor({
  selectedTreatment,
  selectedClinician,
  onSelectionChange,
  initialClinicianId = null,
}) {
  const [treatments, setTreatments] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoading(true);
      setError("");

      try {
        const [treatmentData, clinicianData] = await Promise.all([
          getTreatments(),
          getClinicians(),
        ]);

        if (!cancelled) {
          setTreatments(Array.isArray(treatmentData) ? treatmentData : []);
          setClinicians(Array.isArray(clinicianData) ? clinicianData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load treatments and clinicians.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialClinicianId || loading || clinicians.length === 0) {
      return;
    }

    const clinician = clinicians.find((item) => item.id === initialClinicianId);

    if (!clinician) return;

    const providesSelectedTreatment =
      !selectedTreatment ||
      (clinician.clinician_treatments || []).some(
        (item) => item.treatment_id === selectedTreatment.id,
      );

    if (providesSelectedTreatment && selectedClinician?.id !== clinician.id) {
      onSelectionChange({
        treatment: selectedTreatment,
        clinician,
      });
    }
  }, [
    initialClinicianId,
    loading,
    clinicians,
    selectedTreatment,
    selectedClinician?.id,
    onSelectionChange,
  ]);

  const availableClinicians = useMemo(() => {
    if (!selectedTreatment) return [];

    return clinicians.filter((clinician) =>
      (clinician.clinician_treatments || []).some(
        (item) => item.treatment_id === selectedTreatment.id,
      ),
    );
  }, [clinicians, selectedTreatment]);

  function handleTreatmentChange(event) {
    const treatment = treatments.find((item) => item.id === event.target.value);

    onSelectionChange({
      treatment: treatment || null,
      clinician: null,
    });
  }

  function handleClinicianChange(event) {
    const clinician = availableClinicians.find(
      (item) => item.id === event.target.value,
    );

    onSelectionChange({
      treatment: selectedTreatment,
      clinician: clinician || null,
    });
  }

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Loading treatments and clinicians...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {error}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-2 font-semibold underline"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#0d2d26]">Step 2 of 4</p>
        <h2 className="mt-1 text-xl font-semibold text-[#0d2d26]">
          Choose treatment and clinician
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a treatment first to see clinicians who provide it.
        </p>
      </div>

      <div>
        <label
          htmlFor="booking-treatment"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Treatment
        </label>

        <div className="relative">
          <Stethoscope
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            id="booking-treatment"
            value={selectedTreatment?.id || ""}
            onChange={handleTreatmentChange}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#0d2d26]"
          >
            <option value="">Select a treatment</option>
            {treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name}
              </option>
            ))}
          </select>
        </div>

        {treatments.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No active treatments are available.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="booking-clinician"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Clinician
        </label>

        <div className="relative">
          <UserRound
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            id="booking-clinician"
            value={selectedClinician?.id || ""}
            onChange={handleClinicianChange}
            disabled={!selectedTreatment}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#0d2d26] disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {!selectedTreatment
                ? "Select a treatment first"
                : availableClinicians.length
                  ? "Select a clinician"
                  : "No clinicians provide this treatment"}
            </option>

            {availableClinicians.map((clinician) => (
              <option key={clinician.id} value={clinician.id}>
                {clinician.name}
                {clinician.title ? ` — ${clinician.title}` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedClinician && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={18} />
            <span>Selected: {selectedClinician.name}</span>
          </div>
        )}
      </div>
    </section>
  );
}
