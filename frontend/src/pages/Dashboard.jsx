import { CalendarPlus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import WalkInBookingModal from "../components/booking/WalkInBookingModal";
import AppointmentFlow from "../components/dashboard/AppointmentFlow";
import KpiCard from "../components/dashboard/KpiCard";
import { getAppointments } from "../services/appointmentApi";

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatToday() {
  return new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const data = await getAppointments({
        date: getTodayDate(),
      });

      setAppointments(data || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const metrics = useMemo(() => {
    // Only confirmed appointments count toward projected revenue
    // and booked deposits. Pending appointments are not yet confirmed.
    const activeAppointments = appointments.filter(
      (appointment) =>
        appointment.status === "confirmed" || appointment.status === "pending",
    );

    const confirmed = activeAppointments.filter(
      (appointment) => appointment.status === "confirmed",
    );

    const pending = activeAppointments.filter(
      (appointment) => appointment.status === "pending",
    );

    const projectedTotal = activeAppointments.reduce(
      (sum, appointment) => sum + Number(appointment.total_amount || 0),
      0,
    );

    const deposits = activeAppointments.reduce(
      (sum, appointment) => sum + Number(appointment.deposit_amount || 0),
      0,
    );

    return {
      confirmed: confirmed.length,
      pending: pending.length,
      activeCount: activeAppointments.length,
      projectedTotal,
      deposits,
    };
  }, [appointments]);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section className="border-b border-[#e5e1d8] pb-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[#a94320]">
              <span className="h-2 w-2 rounded-full bg-[#b84620]" />
              Airport Residential • Shift 01 Active
            </div>

            <h1 className="font-serif text-4xl tracking-tight text-[#10231f] sm:text-5xl">
              {formatToday()}
            </h1>

            <p className="mt-3 text-sm text-[#69706c]">
              Today's operational overview for the BrightSmile clinic.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWalkInOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0d2d26] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#173e34]"
            >
              <CalendarPlus size={16} />
              Book Walk-in
            </button>

            <button
              type="button"
              onClick={loadAppointments}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#eeece5] px-4 py-2.5 text-sm font-medium text-[#263b35] transition hover:bg-[#e4e1d8] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-[#e7c7bb] bg-[#fbefea] px-4 py-3 text-sm text-[#9f3c1b]">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          number="01"
          label="Day Total Projected"
          value={`GH₵ ${metrics.projectedTotal.toLocaleString()}`}
          description={`Deposit booked: GH₵ ${metrics.deposits.toLocaleString()}`}
          progress={
            metrics.projectedTotal
              ? (metrics.deposits / metrics.projectedTotal) * 100
              : 0
          }
        />

        <KpiCard
          number="02"
          label="Day Caseload"
          value={`${metrics.activeCount} Total`}
          description={`${metrics.confirmed} confirmed • ${metrics.pending} pending`}
          progress={
            metrics.activeCount
              ? (metrics.confirmed / metrics.activeCount) * 100
              : 0
          }
        />

        <KpiCard
          number="03"
          label="Chair Capacity"
          value="—"
          description="Chair utilization is not tracked by the current backend."
        />

        <KpiCard
          number="04"
          label="Comfort & Anxiety"
          value="—"
          description="Comfort flags are not yet tracked by the current backend."
        />
      </section>

      {/* Main operational area */}
      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center">
          <p className="text-sm text-[#69706c]">
            Loading today's appointments...
          </p>
        </div>
      ) : (
        <AppointmentFlow appointments={appointments} />
      )}
      <WalkInBookingModal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onAppointmentCreated={() => {
          // Optional: refresh dashboard appointment data here.
        }}
      />
    </div>
  );
}
