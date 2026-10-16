import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#deded5] bg-white px-4 py-3 text-sm text-[#10231f] outline-none transition placeholder:text-[#9a9f98] focus:border-[#0d2d26] focus:ring-2 focus:ring-[#0d2d26]/10";

const labelClass = "block text-sm font-medium text-[#263b34]";

function formatPrice(treatment) {
  const min = Number(treatment.price_min);
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
          setTreatments(
            treatmentResult.data
              .filter((treatment) => treatment.active)
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
          );

          setClinicians(
            clinicianResult.data.filter((clinician) => clinician.active),
          );
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
  }, []);

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
        });

        const result = await apiRequest(`/availability?${query.toString()}`);

        if (!cancelled) {
          setSlots(Array.isArray(result.data?.slots) ? result.data.slots : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error.message || "Unable to load available appointment times.",
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

  const selectedTreatment = treatments.find(
    (treatment) => treatment.id === form.treatmentId,
  );

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
          setPaymentStatus(String(currentStatus).toLowerCase());
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
  }, [payment?.id, paymentStatus]);

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

  async function handleBookingSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.treatmentId ||
      !form.clinicianId ||
      !form.date ||
      !form.slot
    ) {
      setSubmitError(
        "Please complete your details, treatment, clinician, date, and appointment time.",
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
        }),
      });

      const patient = patientResult?.data;

      if (!patient?.id) {
        throw new Error("We couldn't retrieve the patient record.");
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

      // Keep the successful result available for the confirmation UI.
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
            method: "momo",
            provider: "momo",
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
      <header className="border-b border-[#e5e1d8] bg-[#f7f4ed]/95">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="font-serif text-2xl font-semibold text-[#0d2d26]"
          >
            BrightSmile
          </Link>
          <Link
            to="/"
            className="rounded-full border border-[#dcd9ce] px-4 py-2 text-sm text-[#46504c] transition hover:bg-white"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Welcoming visual panel */}
          <aside className="lg:sticky lg:top-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
              A little care goes a long way
            </p>

            <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight text-[#0d2d26] sm:text-5xl xl:text-6xl">
              Your healthier smile starts here.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#66716a]">
              Book your visit in a few simple steps. Tell us what you need,
              choose your preferred clinician, and we’ll help you find a time
              that works for you.
            </p>

            <div className="relative mt-8 overflow-hidden rounded-[28px] bg-[#dfe7dd]">
              <img
                src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85"
                alt="Welcoming dental care environment"
                className="h-[280px] w-full object-cover sm:h-[360px]"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#10231f]/80 via-[#10231f]/30 to-transparent p-6 pt-16 sm:p-8 sm:pt-20">
                <p className="font-serif text-2xl text-white">
                  Care that puts you at ease.
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/85">
                  Your comfort matters at every step of your visit.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { title: "Your choice", detail: "Select your treatment" },
                { title: "Your comfort", detail: "Share your preferences" },
                { title: "Your time", detail: "Find an available slot" },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#e5e1d8] bg-white/60 p-3 sm:p-4"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#e5ece2] text-sm font-semibold text-[#0d2d26]">
                    0{index + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#0d2d26]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#66716a]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          {/* Booking form */}
          <section className="overflow-hidden rounded-[28px] border border-[#e5e1d8] bg-white shadow-[0_18px_60px_rgba(16,35,31,0.07)]">
            <div className="bg-[#0d2d26] px-6 py-7 text-white sm:px-9 sm:py-9">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9b29c]">
                Let's get you booked
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
                Plan your visit
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
                Start with your details and treatment. You can choose an
                appointment time in the next step.
              </p>

              <div
                className="mt-6 flex items-center gap-2"
                aria-label="Booking progress"
              >
                <span className="h-1.5 flex-1 rounded-full bg-[#e9b29c]" />
                <span className="h-1.5 flex-1 rounded-full bg-white/25" />
                <span className="h-1.5 flex-1 rounded-full bg-white/25" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/65">
                <span>Your details</span>
                <span>Appointment</span>
                <span>Review</span>
              </div>
            </div>

            {loading && (
              <div className="p-8 text-sm text-[#66716a]" role="status">
                Loading treatments and clinicians...
              </div>
            )}

            {!loading && loadError && (
              <div className="p-8" role="alert">
                <p className="font-medium text-red-800">
                  We couldn't load the booking options.
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

            {bookingResult && (
              <div className="mb-6 rounded-3xl border border-[#d9d3c8] bg-white p-6 shadow-sm">
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#b84620]">
                  Appointment created
                </p>

                <h2 className="font-serif text-3xl text-[#0d2d26]">
                  Complete your deposit
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#5f625d]">
                  Your appointment has been held temporarily. Please approve the
                  MoMo payment to confirm your appointment.
                </p>

                <div className="mt-6 rounded-2xl bg-[#f7f4ed] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5f625d]">Deposit</span>

                    <span className="font-semibold text-[#0d2d26]">
                      GH₵
                      {Number(
                        bookingResult.appointment?.deposit_amount || 0,
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-[#5f625d]">
                      Payment status
                    </span>

                    <span className="font-semibold capitalize text-[#0d2d26]">
                      {paymentStatus || "Starting payment..."}
                    </span>
                  </div>
                </div>

                {paymentLoading && (
                  <div className="mt-5 rounded-2xl border border-[#d9d3c8] p-4">
                    <p className="text-sm text-[#5f625d]">
                      Starting your MoMo payment...
                    </p>
                  </div>
                )}

                {payment && paymentStatus === "pending" && !paymentLoading && (
                  <div className="mt-5 rounded-2xl border border-[#d9d3c8] p-4">
                    <p className="font-medium text-[#0d2d26]">
                      MoMo payment request sent
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#5f625d]">
                      Check your phone and approve the payment request. We are
                      waiting for MTN to confirm the transaction.
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-sm text-[#5f625d]">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#b84620]" />
                      Waiting for payment confirmation...
                    </div>
                  </div>
                )}

                {paymentStatus === "successful" && (
                  <div className="mt-5 rounded-2xl border border-[#cddbcf] bg-[#edf5ef] p-5">
                    <p className="font-semibold text-[#0d2d26]">
                      Payment successful
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#4f5b51]">
                      Your deposit has been received and your appointment is now
                      confirmed.
                    </p>
                  </div>
                )}

                {(paymentStatus === "failed" ||
                  paymentStatus === "cancelled") && (
                  <div className="mt-5 rounded-2xl border border-[#e4c8be] bg-[#fff5f1] p-5">
                    <p className="font-semibold text-[#8f3217]">
                      Payment was not completed
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#6b5148]">
                      The payment did not complete. You can try the payment
                      again while your appointment hold is still active.
                    </p>
                  </div>
                )}

                {paymentError && (
                  <div className="mt-5 rounded-2xl border border-[#e4c8be] bg-[#fff5f1] p-4 text-sm text-[#8f3217]">
                    {paymentError}
                  </div>
                )}
              </div>
            )}

            {!loading && !loadError && (
              <form
                className="space-y-8 p-6 sm:p-9"
                onSubmit={handleBookingSubmit}
              >
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[#f5e6de] font-serif text-lg text-[#b84620]">
                      1
                    </span>
                    <div>
                      <h3 className="font-serif text-xl text-[#0d2d26]">
                        A little about you
                      </h3>
                      <p className="mt-1 text-xs text-[#7b827b]">
                        Fields marked * are required.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        name: "firstName",
                        label: "First name",
                        placeholder: "Your first name",
                        autoComplete: "given-name",
                      },
                      {
                        name: "lastName",
                        label: "Last name",
                        placeholder: "Your last name",
                        autoComplete: "family-name",
                      },
                      {
                        name: "phone",
                        label: "Phone number",
                        placeholder: "e.g. 024 123 4567",
                        autoComplete: "tel",
                        type: "tel",
                      },
                      {
                        name: "email",
                        label: "Email address",
                        placeholder: "you@example.com",
                        autoComplete: "email",
                        type: "email",
                      },
                    ].map((field) => (
                      <div key={field.name}>
                        <label
                          htmlFor={field.name}
                          className="text-sm font-medium text-[#263b34]"
                        >
                          {field.label}
                          {field.name !== "email" && " *"}
                        </label>
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type || "text"}
                          autoComplete={field.autoComplete}
                          value={form[field.name]}
                          onChange={updateField}
                          placeholder={field.placeholder}
                          required={field.name !== "email"}
                          className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#eeece5]" />

                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-[#e5ece2] font-serif text-lg text-[#0d2d26]">
                      2
                    </span>
                    <div>
                      <h3 className="font-serif text-xl text-[#0d2d26]">
                        What brings you in?
                      </h3>
                      <p className="mt-1 text-xs text-[#7b827b]">
                        Choose your treatment and preferred clinician.
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="treatmentId"
                    className="text-sm font-medium text-[#263b34]"
                  >
                    Treatment *
                  </label>
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
                        {treatment.name} — {formatPrice(treatment)}
                      </option>
                    ))}
                  </select>

                  {selectedTreatment && (
                    <div className="mt-4 rounded-2xl border border-[#e5e1d8] bg-[#f7f4ed] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-[#0d2d26]">
                            {selectedTreatment.name}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#66716a]">
                            {selectedTreatment.description}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0d2d26]">
                          {selectedTreatment.duration_minutes} min
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[#46504c]">
                        Deposit: GH₵
                        {Number(
                          selectedTreatment.deposit_amount,
                        ).toLocaleString("en-GH")}
                      </p>
                    </div>
                  )}

                  <label
                    htmlFor="clinicianId"
                    className="mt-5 block text-sm font-medium text-[#263b34]"
                  >
                    Preferred clinician *
                  </label>
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

                  {form.treatmentId && eligibleClinicians.length === 0 && (
                    <p className="mt-2 text-xs leading-5 text-[#66716a]">
                      No active clinician is currently linked to this treatment.
                      Try another treatment.
                    </p>
                  )}

                  <div className="border-t border-[#eeece5] pt-7">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-[#f5e6de] font-serif text-lg text-[#b84620]">
                        3
                      </span>
                      <div>
                        <h3 className="font-serif text-xl text-[#0d2d26]">
                          Find your appointment time
                        </h3>
                        <p className="mt-1 text-xs text-[#7b827b]">
                          Choose a date to see the available times.
                        </p>
                      </div>
                    </div>

                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-[#263b34]"
                    >
                      Preferred date *
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
                      <p className="mt-3 text-sm text-[#66716a]">
                        Choose a treatment and clinician first to check
                        availability.
                      </p>
                    ) : !form.date ? (
                      <p className="mt-3 text-sm text-[#66716a]">
                        Available appointment times will appear here after you
                        select a date.
                      </p>
                    ) : availabilityLoading ? (
                      <p className="mt-4 text-sm text-[#66716a]" role="status">
                        Checking available times...
                      </p>
                    ) : availabilityError ? (
                      <p className="mt-4 text-sm text-red-700" role="alert">
                        {availabilityError}
                      </p>
                    ) : slots.length === 0 ? (
                      <p className="mt-4 rounded-xl bg-[#f7f4ed] p-4 text-sm leading-6 text-[#66716a]">
                        No available times were found for this date. Try another
                        date.
                      </p>
                    ) : (
                      <fieldset className="mt-5">
                        <legend className="text-sm font-medium text-[#263b34]">
                          Available times
                        </legend>

                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {slots.map((slot) => {
                            const selected = form.slot === slot.startsAt;

                            const time = new Intl.DateTimeFormat("en-GH", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: "Africa/Accra",
                            }).format(new Date(slot.startsAt));

                            return (
                              <button
                                key={slot.startsAt}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    slot: slot.startsAt,
                                  }))
                                }
                                className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                                  selected
                                    ? "border-[#0d2d26] bg-[#0d2d26] text-white shadow-sm"
                                    : "border-[#e3e3da] bg-[#fcfbf8] text-[#263b34] hover:border-[#0d2d26] hover:bg-[#e5ece2]"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>

                        {form.slot && (
                          <p className="mt-4 rounded-xl bg-[#e5ece2] p-3 text-sm text-[#0d2d26]">
                            <span className="font-semibold">Selected:</span>{" "}
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
                      </fieldset>
                    )}
                  </div>

                  <label
                    htmlFor="comfortMode"
                    className="mt-5 block text-sm font-medium text-[#263b34]"
                  >
                    Your comfort preference
                  </label>
                  <select
                    id="comfortMode"
                    name="comfortMode"
                    value={form.comfortMode}
                    onChange={updateField}
                    className="mt-2 w-full rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3.5 text-sm outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                  >
                    <option value="standard">Standard care</option>
                    <option value="extra_gentle">Extra-gentle care</option>
                  </select>

                  <label
                    htmlFor="patientNotes"
                    className="mt-5 block text-sm font-medium text-[#263b34]"
                  >
                    Anything we should know?{" "}
                    <span className="font-normal text-[#858b84]">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="patientNotes"
                    name="patientNotes"
                    rows={3}
                    value={form.patientNotes}
                    onChange={updateField}
                    placeholder="Share anything that could help us make your visit more comfortable."
                    className="mt-2 w-full resize-y rounded-xl border border-[#e3e3da] bg-[#fcfbf8] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:bg-white focus:ring-4 focus:ring-[#0d2d26]/5"
                  />
                </div>

                <div className="rounded-2xl bg-[#f7f4ed] p-4">
                  <p className="text-sm font-medium text-[#0d2d26]">
                    Your comfort comes first.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#66716a]">
                    You can tell us about your preferences here. Your booking
                    hasn't been submitted yet.
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
                  >
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !form.slot}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0d2d26] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#19463a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Creating your appointment..."
                    : "Confirm appointment"}
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
