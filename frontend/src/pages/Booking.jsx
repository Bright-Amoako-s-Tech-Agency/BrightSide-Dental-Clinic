import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  Edit3,
  ShieldCheck,
  Sparkles,
  User,
  Info,
  Phone,
  Mail,
  HeartHandshake,
} from "lucide-react";
import { apiRequest } from "../services/api";

function formatPrice(treatment) {
  if (!treatment) return "—";
  const min = Number(treatment.price_min || 0);
  const max = treatment.price_max == null ? null : Number(treatment.price_max);

  const formatAmount = (amount) => `GH₵${amount.toLocaleString("en-GH")}`;

  if (treatment.price_type === "range" && max !== null && max !== min) {
    return `${formatAmount(min)} – ${formatAmount(max)}`;
  }

  if (treatment.price_type === "from" || max === null) {
    return `From ${formatAmount(min)}`;
  }

  return formatAmount(min);
}

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramTreatmentId = searchParams.get("treatmentId") || "";
  const paramClinicianId = searchParams.get("clinicianId") || "";

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");

  const [treatments, setTreatments] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [slots, setSlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    treatmentId: "",
    clinicianId: "",
    comfortMode: "standard",
    patientNotes: "",
    date: "",
    slot: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadBookingOptions() {
      setLoading(true);
      setLoadError("");

      try {
        const [treatmentResult, clinicianResult] = await Promise.all([
          apiRequest("/treatments"),
          apiRequest("/clinicians"),
        ]);

        if (!Array.isArray(treatmentResult?.data)) {
          throw new Error("The treatments response has an unexpected format.");
        }

        if (!Array.isArray(clinicianResult?.data)) {
          throw new Error("The clinicians response has an unexpected format.");
        }

        if (!cancelled) {
          const activeTreatments = treatmentResult.data
            .filter((treatment) => treatment.active)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

          const activeClinicians = clinicianResult.data.filter(
            (clinician) => clinician.active,
          );

          setTreatments(activeTreatments);
          setClinicians(activeClinicians);

          // Handle pre-selection from URL params
          if (paramTreatmentId || paramClinicianId) {
            setForm((current) => ({
              ...current,
              ...(paramTreatmentId &&
              activeTreatments.some((t) => t.id === paramTreatmentId)
                ? { treatmentId: paramTreatmentId }
                : {}),
              ...(paramClinicianId &&
              activeClinicians.some((c) => c.id === paramClinicianId)
                ? { clinicianId: paramClinicianId }
                : {}),
            }));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error.message ||
              "We couldn't load booking options. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookingOptions();

    return () => {
      cancelled = true;
    };
  }, [paramTreatmentId, paramClinicianId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      setSlots([]);
      setAvailabilityError("");

      if (!form.clinicianId || !form.treatmentId || !form.date) {
        setAvailabilityLoading(false);
        return;
      }

      setAvailabilityLoading(true);

      try {
        const query = new URLSearchParams({
          clinicianId: form.clinicianId,
          treatmentId: form.treatmentId,
          date: form.date,
        }).toString();

        const result = await apiRequest(`/availability?${query}`);

        if (!cancelled) {
          setSlots(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error.message ||
              "We couldn't check availability. Please try another date.",
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [form.clinicianId, form.treatmentId, form.date]);

  const selectedTreatment = useMemo(() => {
    return treatments.find((treatment) => treatment.id === form.treatmentId);
  }, [treatments, form.treatmentId]);

  const selectedClinician = useMemo(() => {
    return clinicians.find((c) => c.id === form.clinicianId);
  }, [clinicians, form.clinicianId]);

  const eligibleClinicians = useMemo(() => {
    if (!form.treatmentId) return [];

    return clinicians.filter((clinician) =>
      Array.isArray(clinician.clinician_treatments)
        ? clinician.clinician_treatments.some(
            (item) => item.treatment_id === form.treatmentId,
          )
        : false,
    );
  }, [clinicians, form.treatmentId]);

  useEffect(() => {
    if (!payment?.id) return;

    if (paymentStatus === "successful") return;
    if (paymentStatus === "failed") return;
    if (paymentStatus === "cancelled") return;

    let cancelled = false;
    let intervalId;

    async function checkStatus() {
      try {
        const result = await apiRequest(`/payments/${payment.id}/status`);

        if (cancelled) return;

        const statusResult = result?.data;
        const currentStatus =
          statusResult?.payment?.status || statusResult?.provider?.status;

        if (currentStatus) {
          const lowerStatus = String(currentStatus).toLowerCase();
          setPaymentStatus(lowerStatus);

          if (lowerStatus === "successful") {
            const targetApptId =
              statusResult?.appointment?.id ||
              bookingResult?.appointment?.id;
            if (targetApptId) {
              setTimeout(() => {
                navigate(`/booking/confirmation?ref=${targetApptId}`);
              }, 1200);
            }
          }
        }

        if (statusResult?.appointment) {
          setBookingResult((current) => ({
            ...(current || {}),
            appointment: statusResult.appointment,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentError(
            error.message || "We couldn't check the payment status.",
          );
        }
      }
    }

    checkStatus();

    intervalId = window.setInterval(checkStatus, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [payment?.id, paymentStatus, bookingResult?.appointment?.id, navigate]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "treatmentId"
        ? { clinicianId: "", date: "", slot: "" }
        : {}),
      ...(name === "clinicianId" ? { date: "", slot: "" } : {}),
      ...(name === "date" ? { slot: "" } : {}),
    }));
  }

  // Step 1 Validation
  const isStep1Valid = Boolean(
    form.firstName.trim() &&
      form.lastName.trim() &&
      form.phone.trim() &&
      form.email.trim() &&
      form.dateOfBirth,
  );

  function handleNextToStep2() {
    setStepError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setStepError("Please provide your first and last name.");
      return;
    }
    if (!form.phone.trim()) {
      setStepError("Please enter your phone number.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setStepError("Please enter a valid email address.");
      return;
    }
    if (!form.dateOfBirth) {
      setStepError("Please provide your date of birth.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  // Step 2 Validation
  const isStep2Valid = Boolean(
    form.treatmentId && form.clinicianId && form.date && form.slot,
  );

  function handleNextToStep3() {
    setStepError("");
    if (!form.treatmentId) {
      setStepError("Please select a treatment.");
      return;
    }
    if (!form.clinicianId) {
      setStepError("Please select your preferred clinician.");
      return;
    }
    if (!form.date) {
      setStepError("Please select a date for your visit.");
      return;
    }
    if (!form.slot) {
      setStepError("Please select an available appointment time slot.");
      return;
    }

    setStep(3);
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function handleBookingSubmit(event) {
    if (event) event.preventDefault();
    setSubmitError("");

    if (!isStep1Valid || !isStep2Valid) {
      setSubmitError(
        "Please complete all required details and appointment selections before confirming.",
      );
      return;
    }

    if (submitting) return;

    setSubmitting(true);

    try {
      // Step 1: Find or create the patient.
      const patientResult = await apiRequest("/patients", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          date_of_birth: form.dateOfBirth || null,
        }),
      });

      const patient = patientResult?.data;

      if (!patient?.id) {
        throw new Error("We couldn't retrieve or create the patient record.");
      }

      // Step 2: Create the appointment using the exact selected slot.
      const appointmentResult = await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: patient.id,
          clinicianId: form.clinicianId,
          treatmentId: form.treatmentId,
          startsAt: form.slot,
          comfortMode: form.comfortMode,
          patientNotes: form.patientNotes.trim() || null,
        }),
      });

      if (!appointmentResult?.data?.appointment?.id) {
        throw new Error(
          "The server response did not include the appointment details.",
        );
      }

      const appointment = appointmentResult.data.appointment;
      setBookingResult(appointmentResult.data);

      // Initialize the MoMo deposit payment
      setPaymentLoading(true);
      setPaymentError("");

      try {
        const paymentResult = await apiRequest("/payments/initialize", {
          method: "POST",
          body: JSON.stringify({
            appointmentId: appointment.id,
            method: "paystack",
            provider: "paystack",
          }),
        });

        const initializedPayment = paymentResult?.data?.payment;

        if (!initializedPayment?.id) {
          throw new Error("We couldn't initialize the payment.");
        }

        setPayment(initializedPayment);
        setPaymentStatus(initializedPayment.status);
      } catch (error) {
        setPaymentError(
          error.message ||
            "Your appointment was created, but we couldn't start the payment.",
        );
      } finally {
        setPaymentLoading(false);
      }
    } catch (error) {
      setSubmitError(
        error.message || "We couldn't complete your booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      {/* Top Header */}
      <header className="border-b border-[#e5e1d8] bg-[#f7f4ed]/95">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#0d2d26]"
          >
            <span>BrightSmile</span>
            <span className="rounded-full bg-[#f3e7e2] px-2 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-[#b84620]">
              Dental
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/treatments"
              className="hidden sm:inline-block text-sm text-[#46504c] hover:text-[#b84620]"
            >
              Treatments
            </Link>
            <Link
              to="/clinicians"
              className="hidden sm:inline-block text-sm text-[#46504c] hover:text-[#b84620]"
            >
              Our Clinicians
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

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Left Welcoming visual panel */}
          <aside className="lg:sticky lg:top-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
                A little care goes a long way
              </p>

              <h1 className="mt-3 font-serif text-4xl leading-tight text-[#0d2d26] sm:text-5xl">
                Your healthier smile starts here.
              </h1>

              <p className="mt-4 text-base leading-7 text-[#66716a]">
                Book your visit in three simple steps. Share your details, select
                your treatment and convenient slot, and review your booking.
              </p>
            </div>

            {/* Visual card */}
            <div className="relative overflow-hidden rounded-[28px] bg-[#dfe7dd]">
              <img
                src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85"
                alt="Welcoming dental care environment"
                className="h-[240px] w-full object-cover sm:h-[300px]"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10231f]/85 via-[#10231f]/35 to-transparent p-6 pt-16">
                <p className="font-serif text-2xl text-white">
                  Care that puts you at ease.
                </p>
                <p className="mt-1 text-xs text-white/85">
                  Extra-gentle care available for all appointments.
                </p>
              </div>
            </div>

            {/* Stepper overview highlights */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  number: "01",
                  title: "Your details",
                  detail: "Name & contact",
                  active: step === 1,
                  done: isStep1Valid,
                },
                {
                  number: "02",
                  title: "Appointment",
                  detail: "Service & slot",
                  active: step === 2,
                  done: isStep2Valid,
                },
                {
                  number: "03",
                  title: "Review",
                  detail: "Confirm & deposit",
                  active: step === 3,
                  done: Boolean(bookingResult),
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    item.active
                      ? "border-[#0d2d26] bg-[#0d2d26] text-white shadow-sm"
                      : item.done
                        ? "border-[#cddbcf] bg-[#edf5ef] text-[#0d2d26]"
                        : "border-[#e5e1d8] bg-white/70 text-[#263b34]"
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      item.active
                        ? "bg-[#e9b29c] text-[#0d2d26]"
                        : item.done
                          ? "bg-[#0d2d26] text-white"
                          : "bg-[#e5ece2] text-[#0d2d26]"
                    }`}
                  >
                    {item.done && !item.active ? "✓" : item.number}
                  </span>
                  <p
                    className={`mt-2.5 text-xs font-semibold ${
                      item.active ? "text-white" : "text-[#0d2d26]"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] ${
                      item.active ? "text-white/75" : "text-[#66716a]"
                    }`}
                  >
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-[#e5e1d8] bg-white/70 p-4 text-xs text-[#66716a] space-y-1">
              <p className="font-semibold text-[#0d2d26]">Want to explore first?</p>
              <div className="flex gap-4 pt-1">
                <Link
                  to="/treatments"
                  className="font-medium text-[#b84620] hover:underline"
                >
                  View all treatments →
                </Link>
                <Link
                  to="/clinicians"
                  className="font-medium text-[#b84620] hover:underline"
                >
                  Meet our clinicians →
                </Link>
              </div>
            </div>
          </aside>

          {/* Right: Booking Form Container with Step Slider */}
          <section className="overflow-hidden rounded-[28px] border border-[#e5e1d8] bg-white shadow-[0_18px_60px_rgba(16,35,31,0.07)]">
            {/* Header with Active Progress Slider */}
            <div className="bg-[#0d2d26] px-6 py-7 text-white sm:px-9 sm:py-8">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9b29c]">
                  {step === 1 && "Step 1 of 3 — Your Details"}
                  {step === 2 && "Step 2 of 3 — Select Appointment"}
                  {step === 3 && "Step 3 of 3 — Review & Confirm"}
                </p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  Step {step} of 3
                </span>
              </div>

              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
                {step === 1 && "Tell us about you"}
                {step === 2 && "Choose your appointment"}
                {step === 3 && "Review your booking"}
              </h2>

              <p className="mt-2.5 max-w-md text-sm leading-6 text-white/75">
                {step === 1 &&
                  "Start with your contact information so we can reserve your record and send confirmation details."}
                {step === 2 &&
                  "Select your desired treatment, preferred clinician, and convenient date and time."}
                {step === 3 &&
                  "Review your details and deposit requirement before locking in your reservation."}
              </p>

              {/* Progress Slider Bar */}
              <div
                className="mt-6 flex items-center gap-2"
                aria-label="Booking progress slider"
              >
                <button
                  type="button"
                  onClick={() => {
                    setStepError("");
                    setStep(1);
                  }}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    step >= 1 ? "bg-[#e9b29c]" : "bg-white/25"
                  }`}
                  title="Click to go to Step 1: Your Details"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isStep1Valid) {
                      setStepError("");
                      setStep(2);
                    } else {
                      setStepError(
                        "Please complete your personal details in Step 1 first.",
                      );
                    }
                  }}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    step >= 2 ? "bg-[#e9b29c]" : "bg-white/25"
                  } ${!isStep1Valid ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  title="Click to go to Step 2: Appointment"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isStep1Valid && isStep2Valid) {
                      setStepError("");
                      setStep(3);
                    } else if (!isStep1Valid) {
                      setStepError(
                        "Please complete your personal details in Step 1 first.",
                      );
                    } else {
                      setStepError(
                        "Please choose treatment, clinician, date, and slot in Step 2 first.",
                      );
                    }
                  }}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    step >= 3 ? "bg-[#e9b29c]" : "bg-white/25"
                  } ${!isStep1Valid || !isStep2Valid ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  title="Click to go to Step 3: Review"
                />
              </div>

              {/* Step Navigation Labels */}
              <div className="mt-2.5 flex justify-between text-xs text-white/75">
                <button
                  type="button"
                  onClick={() => {
                    setStepError("");
                    setStep(1);
                  }}
                  className={`transition hover:text-white ${
                    step === 1
                      ? "font-bold text-[#e9b29c] underline underline-offset-4"
                      : ""
                  }`}
                >
                  1. Your details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isStep1Valid) {
                      setStepError("");
                      setStep(2);
                    } else {
                      setStepError(
                        "Please complete your personal details in Step 1 first.",
                      );
                    }
                  }}
                  className={`transition hover:text-white ${
                    step === 2
                      ? "font-bold text-[#e9b29c] underline underline-offset-4"
                      : ""
                  } ${!isStep1Valid ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  2. Appointment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isStep1Valid && isStep2Valid) {
                      setStepError("");
                      setStep(3);
                    } else if (!isStep1Valid) {
                      setStepError(
                        "Please complete your personal details in Step 1 first.",
                      );
                    } else {
                      setStepError(
                        "Please choose treatment, clinician, date, and slot in Step 2 first.",
                      );
                    }
                  }}
                  className={`transition hover:text-white ${
                    step === 3
                      ? "font-bold text-[#e9b29c] underline underline-offset-4"
                      : ""
                  } ${!isStep1Valid || !isStep2Valid ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  3. Review
                </button>
              </div>
            </div>

            {/* Error notifications */}
            {stepError && (
              <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
                {stepError}
              </div>
            )}

            {loading && (
              <div className="p-8 text-center text-sm text-[#66716a]" role="status">
                <div className="inline-block size-6 animate-spin rounded-full border-2 border-[#0d2d26] border-r-transparent" />
                <p className="mt-3">Loading treatments and clinicians...</p>
              </div>
            )}

            {!loading && loadError && (
              <div className="p-8" role="alert">
                <p className="font-medium text-red-800">
                  We couldn't load booking options.
                </p>
                <p className="mt-2 text-sm text-red-700">{loadError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-full bg-[#0d2d26] px-5 py-3 text-sm font-medium text-white hover:bg-[#19463a]"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Booking Result / Mobile Money payment status UI */}
            {bookingResult && (
              <div className="p-6 sm:p-9 space-y-6">
                <div className="rounded-3xl border border-[#d9d3c8] bg-white p-6 shadow-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b84620]">
                    Appointment Held
                  </p>

                  <h2 className="font-serif text-3xl text-[#0d2d26]">
                    Complete your deposit
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#5f625d]">
                    Your appointment has been held temporarily for 10 minutes.
                    Please authorize the Mobile Money payment prompt on your
                    phone to finalize your booking.
                  </p>

                  <div className="mt-6 rounded-2xl bg-[#f7f4ed] p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#5f625d]">
                        Deposit required
                      </span>
                      <span className="font-serif text-xl font-semibold text-[#0d2d26]">
                        GH₵
                        {Number(
                          bookingResult.appointment?.deposit_amount || 0,
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[#e8e4da] pt-3">
                      <span className="text-sm text-[#5f625d]">
                        Payment status
                      </span>
                      <span className="font-semibold capitalize text-[#0d2d26]">
                        {paymentStatus || "Starting payment..."}
                      </span>
                    </div>
                  </div>

                  {paymentLoading && (
                    <div className="mt-5 rounded-2xl border border-[#d9d3c8] p-4 text-center">
                      <div className="inline-block size-5 animate-spin rounded-full border-2 border-[#0d2d26] border-r-transparent" />
                      <p className="mt-2 text-sm text-[#5f625d]">
                        Starting your Mobile Money payment...
                      </p>
                    </div>
                  )}

                  {payment && paymentStatus === "pending" && !paymentLoading && (
                    <div className="mt-5 rounded-2xl border border-[#d9d3c8] p-5">
                      <p className="font-semibold text-[#0d2d26]">
                        Mobile Money prompt sent to your phone
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#5f625d]">
                        Check your handset and enter your MoMo PIN to authorize
                        the payment. Works on MTN, Telecel, and AirtelTigo.
                      </p>

                      <div className="mt-4 flex items-center gap-3 text-sm font-medium text-[#b84620]">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#b84620]" />
                        Waiting for payment confirmation...
                      </div>
                    </div>
                  )}

                  {paymentStatus === "successful" && (
                    <div className="mt-5 rounded-2xl border border-[#cddbcf] bg-[#edf5ef] p-5">
                      <div className="flex items-center gap-2 text-[#0d2d26]">
                        <CheckCircle2 className="text-green-700" size={20} />
                        <p className="font-semibold">Payment successful!</p>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#4f5b51]">
                        Your deposit has been received and your appointment is
                        now confirmed.
                      </p>

                      <div className="mt-4">
                        <Link
                          to={`/booking/confirmation?ref=${bookingResult?.appointment?.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0d2d26] px-5 py-3 text-xs font-semibold text-white hover:bg-[#19463a]"
                        >
                          View Appointment Confirmation
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {(paymentStatus === "failed" ||
                    paymentStatus === "cancelled") && (
                    <div className="mt-5 rounded-2xl border border-[#e4c8be] bg-[#fff5f1] p-5">
                      <p className="font-semibold text-[#8f3217]">
                        Payment was not completed
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#6b5148]">
                        The payment prompt timed out or was cancelled. You can
                        try paying again while your slot is on hold.
                      </p>
                    </div>
                  )}

                  {paymentError && (
                    <div className="mt-5 rounded-2xl border border-[#e4c8be] bg-[#fff5f1] p-4 text-sm text-[#8f3217]">
                      {paymentError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step-by-Step Form Content */}
            {!loading && !loadError && !bookingResult && (
              <div className="p-6 sm:p-9">
                {/* STEP 1: YOUR DETAILS */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-[#eeece5] pb-4">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#f5e6de] font-serif text-lg text-[#b84620]">
                        1
                      </span>
                      <div>
                        <h3 className="font-serif text-xl text-[#0d2d26]">
                          Personal & Contact Information
                        </h3>
                        <p className="text-xs text-[#7b827b]">
                          We'll use this to find or create your patient profile and send reminders.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          First name *
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={updateField}
                          placeholder="Your first name"
                          required
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Last name *
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={updateField}
                          placeholder="Your last name"
                          required
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Phone number (Ghana) *
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          value={form.phone}
                          onChange={updateField}
                          placeholder="e.g. 024 123 4567"
                          required
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                        <p className="mt-1 text-[11px] text-[#858b84]">
                          Used for appointment reminders and MoMo prompt.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Email address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={updateField}
                          placeholder="you@example.com"
                          required
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="dateOfBirth"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Date of birth *
                        </label>
                        <input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          autoComplete="bday"
                          value={form.dateOfBirth}
                          onChange={updateField}
                          required
                          max={new Date().toLocaleDateString("en-CA", {
                            timeZone: "Africa/Accra",
                          })}
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f7f4ed] p-4 text-xs leading-5 text-[#66716a]">
                      <p className="font-semibold text-[#0d2d26]">Returning patient?</p>
                      <p className="mt-0.5">
                        If you've visited BrightSmile before, entering your registered phone number or email will automatically match your records.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleNextToStep2}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0d2d26] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#19463a]"
                      >
                        Continue to Appointment
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: APPOINTMENT SELECTION */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-[#eeece5] pb-4">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#e5ece2] font-serif text-lg text-[#0d2d26]">
                        2
                      </span>
                      <div>
                        <h3 className="font-serif text-xl text-[#0d2d26]">
                          Service & Preferred Time
                        </h3>
                        <p className="text-xs text-[#7b827b]">
                          Select your treatment, preferred dentist, and slot.
                        </p>
                      </div>
                    </div>

                    {/* Treatment Selection */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="treatmentId"
                          className="text-sm font-medium text-[#263b34]"
                        >
                          Treatment *
                        </label>
                        <Link
                          to="/treatments"
                          target="_blank"
                          className="text-xs text-[#b84620] hover:underline"
                        >
                          View service descriptions ↗
                        </Link>
                      </div>

                      <select
                        id="treatmentId"
                        name="treatmentId"
                        value={form.treatmentId}
                        onChange={updateField}
                        required
                        className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3.5 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                      >
                        <option value="">Choose a treatment</option>
                        {treatments.map((treatment) => (
                          <option key={treatment.id} value={treatment.id}>
                            {treatment.name} — {formatPrice(treatment)} ({treatment.duration_minutes} min)
                          </option>
                        ))}
                      </select>

                      {selectedTreatment && (
                        <div className="mt-3 rounded-2xl border border-[#e5e1d8] bg-[#f7f4ed] p-4 text-xs text-[#46504c]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-sm text-[#0d2d26]">
                                {selectedTreatment.name}
                              </p>
                              <p className="mt-1 leading-5 text-[#66716a]">
                                {selectedTreatment.description}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 font-semibold text-[#0d2d26] shadow-sm">
                              {selectedTreatment.duration_minutes} min
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-[#e8e4da] pt-2.5">
                            <span>Fee: <strong>{formatPrice(selectedTreatment)}</strong></span>
                            <span className="text-[#b84620] font-medium">
                              Required deposit: GH₵{Number(selectedTreatment.deposit_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preferred Clinician */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="clinicianId"
                          className="text-sm font-medium text-[#263b34]"
                        >
                          Preferred Clinician *
                        </label>
                        <Link
                          to="/clinicians"
                          target="_blank"
                          className="text-xs text-[#b84620] hover:underline"
                        >
                          View clinician bios ↗
                        </Link>
                      </div>

                      <select
                        id="clinicianId"
                        name="clinicianId"
                        value={form.clinicianId}
                        onChange={updateField}
                        disabled={!form.treatmentId}
                        required
                        className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3.5 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {!form.treatmentId
                            ? "Choose a treatment first"
                            : eligibleClinicians.length
                              ? "Choose a clinician"
                              : "No clinicians linked to this treatment"}
                        </option>
                        {eligibleClinicians.map((clinician) => (
                          <option key={clinician.id} value={clinician.id}>
                            {clinician.name}
                            {clinician.title ? ` — ${clinician.title}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date and Slot selection */}
                    <div className="border-t border-[#eeece5] pt-5">
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-[#263b34]"
                      >
                        Preferred appointment date *
                      </label>
                      <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        min={new Date().toLocaleDateString("en-CA", {
                          timeZone: "Africa/Accra",
                        })}
                        onChange={updateField}
                        disabled={!form.clinicianId || !form.treatmentId}
                        required
                        className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3.5 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      {!form.clinicianId || !form.treatmentId ? (
                        <p className="mt-2.5 text-xs text-[#858b84]">
                          Select both treatment and clinician above to pick a date.
                        </p>
                      ) : !form.date ? (
                        <p className="mt-2.5 text-xs text-[#858b84]">
                          Select a date to view available appointment slots.
                        </p>
                      ) : availabilityLoading ? (
                        <div className="mt-4 p-4 rounded-xl bg-[#f7f4ed] text-center text-xs text-[#66716a]">
                          <div className="inline-block size-4 animate-spin rounded-full border-2 border-[#0d2d26] border-r-transparent mr-2" />
                          Checking available clinician slots...
                        </div>
                      ) : availabilityError ? (
                        <p className="mt-3 text-xs text-red-700">{availabilityError}</p>
                      ) : slots.length === 0 ? (
                        <p className="mt-3 rounded-xl bg-[#f7f4ed] p-3.5 text-xs text-[#66716a]">
                          No available appointment slots found for this date. Please try another day.
                        </p>
                      ) : (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#858b84] mb-2.5">
                            Available Time Slots
                          </p>
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {slots.map((slot) => {
                              const selected = form.slot === slot.startsAt;
                              const timeStr = new Intl.DateTimeFormat("en-GH", {
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: "Africa/Accra",
                              }).format(new Date(slot.startsAt));

                              return (
                                <button
                                  key={slot.startsAt}
                                  type="button"
                                  onClick={() =>
                                    setForm((cur) => ({ ...cur, slot: slot.startsAt }))
                                  }
                                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                                    selected
                                      ? "border-[#0d2d26] bg-[#0d2d26] text-white shadow-sm"
                                      : "border-[#deded5] bg-[#fcfbf8] text-[#263b34] hover:border-[#0d2d26] hover:bg-white"
                                  }`}
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>

                          {form.slot && (
                            <p className="mt-3 text-xs font-medium text-[#0d2d26] bg-[#edf5ef] rounded-xl p-2.5 border border-[#cddbcf]">
                              ✓ Selected slot:{" "}
                              {new Intl.DateTimeFormat("en-GH", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: "Africa/Accra",
                              }).format(new Date(form.slot))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comfort Preference & Optional Notes */}
                    <div className="border-t border-[#eeece5] pt-5 space-y-4">
                      <div>
                        <label
                          htmlFor="comfortMode"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Comfort care preference
                        </label>
                        <select
                          id="comfortMode"
                          name="comfortMode"
                          value={form.comfortMode}
                          onChange={updateField}
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        >
                          <option value="standard">Standard care</option>
                          <option value="extra_gentle">
                            Extra-gentle care (for dental anxiety or sensitive teeth)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="patientNotes"
                          className="block text-sm font-medium text-[#263b34]"
                        >
                          Special requests or notes (optional)
                        </label>
                        <textarea
                          id="patientNotes"
                          name="patientNotes"
                          rows={2}
                          value={form.patientNotes}
                          onChange={updateField}
                          placeholder="Tell us about any specific discomfort, dental history, or requests..."
                          className="mt-2 w-full resize-y rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-2.5 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStepError("");
                          setStep(1);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-[#dcd9ce] bg-white px-5 py-3.5 text-xs sm:text-sm font-medium text-[#46504c] transition hover:bg-[#f7f4ed]"
                      >
                        <ArrowLeft size={16} />
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleNextToStep3}
                        disabled={!isStep2Valid}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0d2d26] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#19463a] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue to Review
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & CONFIRM */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-[#eeece5] pb-4">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#f5e6de] font-serif text-lg text-[#b84620]">
                        3
                      </span>
                      <div>
                        <h3 className="font-serif text-xl text-[#0d2d26]">
                          Review Appointment Summary
                        </h3>
                        <p className="text-xs text-[#7b827b]">
                          Please verify your booking details before confirming.
                        </p>
                      </div>
                    </div>

                    {/* Review Card 1: Patient Information */}
                    <div className="rounded-2xl border border-[#e5e1d8] bg-[#fcfbf8] p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-[#eeece5]">
                        <div className="flex items-center gap-2 text-[#0d2d26] font-semibold text-sm">
                          <User size={16} className="text-[#b84620]" />
                          <span>Patient Information</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#b84620] hover:underline"
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                      </div>

                      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 text-xs">
                        <div>
                          <span className="text-[#858b84]">Full Name:</span>
                          <p className="font-semibold text-sm text-[#0d2d26]">
                            {form.firstName} {form.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#858b84]">Date of Birth:</span>
                          <p className="font-medium text-[#0d2d26]">
                            {form.dateOfBirth}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#858b84]">Phone Number:</span>
                          <p className="font-medium text-[#0d2d26]">
                            {form.phone}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#858b84]">Email Address:</span>
                          <p className="font-medium text-[#0d2d26]">
                            {form.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Review Card 2: Appointment Information */}
                    <div className="rounded-2xl border border-[#e5e1d8] bg-[#fcfbf8] p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-[#eeece5]">
                        <div className="flex items-center gap-2 text-[#0d2d26] font-semibold text-sm">
                          <Calendar size={16} className="text-[#b84620]" />
                          <span>Appointment Details</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#b84620] hover:underline"
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                      </div>

                      <div className="mt-3.5 space-y-3 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[#858b84]">Treatment Service:</span>
                            <p className="font-serif text-base font-semibold text-[#0d2d26]">
                              {selectedTreatment?.name}
                            </p>
                            <span className="inline-block mt-1 text-[11px] text-[#66716a]">
                              Est. duration: {selectedTreatment?.duration_minutes} minutes
                            </span>
                          </div>
                          <span className="font-semibold text-sm text-[#0d2d26]">
                            {formatPrice(selectedTreatment)}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-[#eeece5]">
                          <div>
                            <span className="text-[#858b84]">Doctor / Clinician:</span>
                            <p className="font-medium text-[#0d2d26]">
                              {selectedClinician?.name || "Selected clinician"}
                            </p>
                            {selectedClinician?.title && (
                              <p className="text-[11px] text-[#66716a]">
                                {selectedClinician.title}
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="text-[#858b84]">Date & Time Slot:</span>
                            <p className="font-semibold text-[#b84620]">
                              {form.slot
                                ? new Intl.DateTimeFormat("en-GH", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    timeZone: "Africa/Accra",
                                  }).format(new Date(form.slot))
                                : "No slot selected"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#eeece5] grid gap-2 sm:grid-cols-2">
                          <div>
                            <span className="text-[#858b84]">Comfort Mode:</span>
                            <p className="font-medium text-[#0d2d26]">
                              {form.comfortMode === "extra_gentle"
                                ? "Extra-gentle care"
                                : "Standard care"}
                            </p>
                          </div>
                          {form.patientNotes && (
                            <div>
                              <span className="text-[#858b84]">Patient Notes:</span>
                              <p className="font-medium text-[#0d2d26] truncate">
                                {form.patientNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Card 3: Deposit & Payment Notice */}
                    <div className="rounded-2xl border border-[#cddbcf] bg-[#edf5ef] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#526054]">
                            Required Hold Deposit
                          </p>
                          <p className="font-serif text-2xl font-bold text-[#0d2d26]">
                            GH₵
                            {Number(
                              selectedTreatment?.deposit_amount || 0,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#0d2d26] shadow-sm">
                          Mobile Money
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-[#4f5b51]">
                        When you confirm, a Mobile Money deposit prompt will be
                        sent to your phone via Paystack (MTN, Telecel, or
                        AirtelTigo). Your slot will be held while you approve.
                      </p>
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800"
                      >
                        {submitError}
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStepError("");
                          setStep(2);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-[#dcd9ce] bg-white px-5 py-4 text-xs sm:text-sm font-medium text-[#46504c] transition hover:bg-[#f7f4ed]"
                      >
                        <ArrowLeft size={16} />
                        Back to Appointment
                      </button>

                      <button
                        type="button"
                        onClick={handleBookingSubmit}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0d2d26] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#19463a] disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
                      >
                        {submitting
                          ? "Securing appointment..."
                          : `Confirm & Pay Deposit (GH₵${Number(
                              selectedTreatment?.deposit_amount || 0,
                            ).toLocaleString()})`}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
