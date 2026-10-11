import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelAppointment,
  completeAppointment,
  getAppointmentById,
  markAppointmentNoShow,
} from "../services/appointmentApi";

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStatusStyle(status) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-700",
    no_show: "bg-slate-100 text-slate-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      {" "}
      <span className="text-sm text-slate-500">{label}</span>{" "}
      <span className="text-sm font-medium text-slate-800 sm:max-w-[65%] sm:text-right">
        {value || "—"}{" "}
      </span>{" "}
    </div>
  );
}

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [updatingOutcome, setUpdatingOutcome] = useState(false);
  const [outcomeError, setOutcomeError] = useState("");

  async function handleCancelAppointment() {
    setCancelling(true);
    setCancelError("");

    try {
      await cancelAppointment(id);
      setShowCancelConfirm(false);
      await loadAppointment(true);
    } catch (err) {
      setCancelError(err.message || "Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  }
  async function handleAppointmentOutcome(outcome) {
    setUpdatingOutcome(true);
    setOutcomeError("");

    try {
      if (outcome === "completed") {
        await completeAppointment(id);
      } else {
        await markAppointmentNoShow(id);
      }

      await loadAppointment(true);
    } catch (err) {
      setOutcomeError(err.message || "Failed to update appointment status.");
    } finally {
      setUpdatingOutcome(false);
    }
  }

  async function loadAppointment(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAppointmentById(id);
      setAppointment(data);
    } catch (err) {
      setError(err.message || "Failed to load appointment details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
        Loading appointment details...{" "}
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="space-y-4">
        {" "}
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          {" "}
          <ArrowLeft size={16} />
          Back to appointments{" "}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={18} />
            Could not load appointment
          </div>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => loadAppointment()}
            className="mt-4 rounded-lg border border-red-200 px-3 py-2 font-medium hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const patientName = appointment.patient
    ? `${appointment.patient.first_name || ""} ${appointment.patient.last_name || ""}`.trim()
    : `${appointment.first_name || ""} ${appointment.last_name || ""}`.trim();

  const clinicianName =
    appointment.clinician?.name || appointment.clinician_name || "—";

  const treatmentName =
    appointment.treatment?.name || appointment.treatment_name || "—";

  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="space-y-6">
      {" "}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <Link
            to="/appointments"
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
          >
            {" "}
            <ArrowLeft size={16} />
            Back to appointments{" "}
          </Link>{" "}
          <h1 className="text-2xl font-semibold text-slate-900">
            Appointment Details{" "}
          </h1>{" "}
          <p className="mt-1 text-sm text-slate-500">
            Review the booking, patient, clinician and payment information.{" "}
          </p>{" "}
        </div>
        <button
          type="button"
          onClick={() => loadAppointment(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}
      {outcomeError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {outcomeError}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm text-slate-500">Booking status</p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(appointment.status)}`}
              >
                {String(appointment.status || "unknown").replaceAll("_", " ")}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-slate-500">Appointment ID</p>
              <p className="mt-1 max-w-56 break-all text-xs font-medium text-slate-700">
                {appointment.id}
              </p>
            </div>
          </div>

          <h2 className="mt-5 text-base font-semibold text-slate-900">
            Booking information
          </h2>

          <DetailRow
            label="Date"
            value={new Date(appointment.starts_at).toLocaleDateString([], {
              dateStyle: "full",
            })}
          />
          <DetailRow
            label="Starts"
            value={formatDateTime(appointment.starts_at)}
          />
          <DetailRow label="Ends" value={formatDateTime(appointment.ends_at)} />
          <DetailRow
            label="Comfort mode"
            value={
              appointment.comfort_mode
                ? appointment.comfort_mode.replaceAll("_", " ")
                : "—"
            }
          />
          <DetailRow label="Patient notes" value={appointment.patient_notes} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <UserRound size={18} />
            Patient information
          </h2>

          <div className="mt-3">
            <DetailRow label="Full name" value={patientName} />
            <DetailRow
              label="Phone"
              value={appointment.patient?.phone || appointment.phone}
            />
            <DetailRow
              label="Email"
              value={appointment.patient?.email || appointment.email}
            />
          </div>

          <div className="my-5 border-t border-slate-100" />

          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Stethoscope size={18} />
            Treatment and clinician
          </h2>

          <div className="mt-3">
            <DetailRow label="Treatment" value={treatmentName} />
            <DetailRow label="Clinician" value={clinicianName} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">
            Payment summary
          </h2>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total amount</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatMoney(appointment.total_amount)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Deposit</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatMoney(appointment.deposit_amount)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Balance</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatMoney(appointment.balance_amount)}
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/appointments")}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </button>

        {appointment.status === "confirmed" && (
          <>
            <button
              type="button"
              disabled={updatingOutcome}
              onClick={() => handleAppointmentOutcome("completed")}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingOutcome ? "Updating..." : "Mark completed"}
            </button>

            <button
              type="button"
              disabled={updatingOutcome}
              onClick={() => handleAppointmentOutcome("no_show")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingOutcome ? "Updating..." : "Mark no-show"}
            </button>
          </>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Cancel appointment
          </button>
        )}
      </div>
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2
              id="cancel-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Cancel this appointment?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will cancel the appointment. This action does not
              automatically refund any payment already made.
            </p>

            {cancelError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {cancelError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelError("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Keep appointment
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelAppointment}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
