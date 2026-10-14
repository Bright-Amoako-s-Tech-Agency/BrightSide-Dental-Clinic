import { ArrowRight, CalendarCheck, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { createAppointment } from "../../services/appointmentApi";
import BookingConfirmation from "./BookingConfirmation";
import PatientLookup from "./PatientLookup";
import ServiceAndDoctor from "./ServiceAndDoctor";
import SlotSelection from "./SlotSelection";

const STEPS = [
  { title: "Patient", description: "Find or create patient" },
  { title: "Treatment", description: "Choose treatment and clinician" },
  { title: "Time slot", description: "Select an available time" },
  { title: "Confirm", description: "Review appointment details" },
];

const initialBooking = {
  patient: null,
  treatment: null,
  clinician: null,
  slot: null,
};

export default function WalkInBookingModal({
  isOpen,
  onClose,
  onAppointmentCreated,
  initialDate = null,
  initialTime = null,
  initialClinician = null,
}) {
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState(initialBooking);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Closing is controlled by the parent; submission prevents accidental closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting]);

  function resetBooking() {
    setStep(0);
    setBooking({ ...initialBooking });
    setError("");
    setSuccess("");
    setIsSubmitting(false);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetBooking();
    onClose?.();
  }

  function updateBooking(updates) {
    setBooking((current) => ({ ...current, ...updates }));
    setError("");
    setSuccess("");
  }

  function handlePatientSelect(patient) {
    if (booking.patient?.id === patient?.id) return;

    updateBooking({
      patient,
      treatment: null,
      clinician: null,
      slot: null,
    });
    setStep(1);
  }

  function handleServiceChange({ treatment, clinician }) {
    const treatmentChanged = booking.treatment?.id !== treatment?.id;

    const clinicianChanged = booking.clinician?.id !== clinician?.id;

    updateBooking({
      treatment,
      clinician,
      slot: treatmentChanged || clinicianChanged ? null : booking.slot,
    });
  }

  function handleSlotSelect(slot) {
    updateBooking({ slot });
  }

  function canContinue() {
    if (step === 0) return Boolean(booking.patient?.id);

    if (step === 1) {
      return Boolean(booking.treatment?.id && booking.clinician?.id);
    }

    if (step === 2) {
      return Boolean(booking.slot?.startsAt && booking.slot?.endsAt);
    }

    return false;
  }

  function handleNext() {
    if (!canContinue()) return;

    setError("");
    setStep((current) => Math.min(current + 1, 3));
  }

  function handleBack() {
    if (isSubmitting) return;

    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleConfirm(formValues) {
    if (
      !booking.patient?.id ||
      !booking.treatment?.id ||
      !booking.clinician?.id ||
      !booking.slot?.startsAt
    ) {
      setError("Some booking details are missing. Please review the steps.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await createAppointment({
        patientId: booking.patient.id,
        clinicianId: booking.clinician.id,
        treatmentId: booking.treatment.id,
        startsAt: booking.slot.startsAt,
        comfortMode: formValues.comfortMode,
        patientNotes: formValues.patientNotes || null,
      });

      if (!result?.appointment?.id) {
        throw new Error(
          "The server response did not include an appointment ID.",
        );
      }

      setSuccess("Appointment created. It is awaiting payment confirmation.");

      await onAppointmentCreated?.(result);

      // Keep the success state visible until staff closes the modal.
      setBooking((current) => ({ ...current }));
    } catch (err) {
      setError(
        err?.message ||
          "Could not create the appointment. Please review the details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const createdAppointmentId = success ? undefined : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkin-title"
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#f7f4ed] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#e7e2d8] bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d2d26] text-white">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1
                id="walkin-title"
                className="text-lg font-semibold text-[#0d2d26]"
              >
                Walk-in booking
              </h1>
              <p className="text-sm text-gray-500">Staff appointment intake</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close booking"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <nav
          aria-label="Booking progress"
          className="border-b border-[#e7e2d8] bg-white px-5 py-4 sm:px-7"
        >
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((item, index) => {
              const completed = index < step;
              const active = index === step;

              return (
                <li key={item.title} className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        completed
                          ? "bg-[#0d2d26] text-white"
                          : active
                            ? "bg-[#b84620] text-white"
                            : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {completed ? <Check size={15} /> : index + 1}
                    </span>
                    <span
                      className={[
                        "hidden truncate text-xs font-semibold sm:block",
                        active || completed
                          ? "text-[#0d2d26]"
                          : "text-gray-400",
                      ].join(" ")}
                    >
                      {item.title}
                    </span>
                  </div>

                  <div
                    className={[
                      "h-1 rounded-full",
                      completed || active ? "bg-[#0d2d26]" : "bg-gray-100",
                    ].join(" ")}
                  />
                </li>
              );
            })}
          </ol>

          <div className="mt-3">
            <p className="text-sm font-semibold text-[#0d2d26]">
              {STEPS[step].title}
            </p>
            <p className="text-xs text-gray-500">{STEPS[step].description}</p>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success ? (
            <div className="rounded-2xl border border-green-200 bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
                <Check size={28} />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-[#0d2d26]">
                Appointment created
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                The appointment is pending payment confirmation. It has not yet
                been confirmed.
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Patient: {booking.patient?.first_name}{" "}
                {booking.patient?.last_name}
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 rounded-xl bg-[#0d2d26] px-5 py-3 text-sm font-semibold text-white hover:bg-[#17463b]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <PatientLookup
                  selectedPatient={booking.patient}
                  onPatientSelect={handlePatientSelect}
                />
              )}

              {step === 1 && (
                <ServiceAndDoctor
                  selectedTreatment={booking.treatment}
                  selectedClinician={booking.clinician}
                  onSelectionChange={handleServiceChange}
                  initialClinicianId={initialClinician?.id || null}
                />
              )}

              {step === 2 && (
                <SlotSelection
                  selectedTreatment={booking.treatment}
                  selectedClinician={booking.clinician}
                  selectedSlot={booking.slot}
                  onSlotSelect={handleSlotSelect}
                  initialDate={initialDate}
                  initialTime={initialTime}
                />
              )}

              {step === 3 && (
                <BookingConfirmation
                  selectedPatient={booking.patient}
                  selectedTreatment={booking.treatment}
                  selectedClinician={booking.clinician}
                  selectedSlot={booking.slot}
                  onBack={handleBack}
                  onConfirm={handleConfirm}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          )}
        </main>

        {!success && step < 3 && (
          <footer className="flex items-center justify-between gap-3 border-t border-[#e7e2d8] bg-white px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={step === 0 ? handleClose : handleBack}
              disabled={isSubmitting}
              className="rounded-xl border border-[#dedbd2] px-4 py-3 text-sm font-medium text-[#0d2d26] disabled:opacity-50"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue() || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0d2d26] px-5 py-3 text-sm font-semibold text-white hover:bg-[#17463b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}
