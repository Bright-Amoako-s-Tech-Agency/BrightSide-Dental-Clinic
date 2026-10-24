import { ChevronDown, UserRoundPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { getClinicians } from "../../services/clinicianApi";
import WalkInBookingModal from "../booking/WalkInBookingModal";

const navigation = [
  {
    label: "Dashboard",
    to: "/staff",
  },
  {
    label: "Appointments",
    to: "/staff/appointments",
  },
  {
    label: "Patients",
    to: "/staff/patients",
  },
  {
    label: "Clinicians",
    to: "/staff/clinicians",
  },
  {
    label: "Treatments",
    to: "/staff/treatments",
  },
  {
    label: "Schedule",
    to: "/staff/schedule",
  },
];

function navLinkClass({ isActive }) {
  return [
    "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-[#0d2d26] text-white"
      : "text-[#46504c] hover:bg-[#eeece5] hover:text-[#0d2d26]",
  ].join(" ");
}

function getInitials(name) {
  if (!name) return "DR";

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "DR";
}

export default function StaffLayout() {
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [staffClinicians, setStaffClinicians] = useState([]);
  const [selectedClinicianId, setSelectedClinicianId] = useState("");
  const [bookingDefaults, setBookingDefaults] = useState({
    initialDate: null,
    initialTime: null,
    initialClinician: null,
  });

  useEffect(() => {
    async function loadStaffClinicians() {
      try {
        const clinicians = await getClinicians();
        const safeClinicians = Array.isArray(clinicians) ? clinicians : [];
        setStaffClinicians(safeClinicians);

        const savedId = window.localStorage.getItem(
          "brightSmileDutyClinicianId",
        );
        const preferredId = safeClinicians.some(
          (clinician) => clinician.id === savedId,
        )
          ? savedId
          : safeClinicians[0]?.id || "";

        setSelectedClinicianId(preferredId);
      } catch (error) {
        console.error("Failed to load staff clinicians", error);
        setStaffClinicians([]);
        setSelectedClinicianId("");
      }
    }

    loadStaffClinicians();
  }, []);

  useEffect(() => {
    if (!selectedClinicianId) return;
    window.localStorage.setItem(
      "brightSmileDutyClinicianId",
      selectedClinicianId,
    );
  }, [selectedClinicianId]);

  const dutyClinician =
    staffClinicians.find((clinician) => clinician.id === selectedClinicianId) ||
    staffClinicians[0] ||
    null;

  function openWalkInBooking() {
    setBookingDefaults({
      initialDate: null,
      initialTime: null,
      initialClinician: null,
    });
    setWalkInOpen(true);
  }

  function openCalendarBooking({ date, time, clinician = null }) {
    setBookingDefaults({
      initialDate: date,
      initialTime: time,
      initialClinician: clinician,
    });
    setWalkInOpen(true);
  }

  function closeWalkInBooking() {
    setWalkInOpen(false);
    setBookingDefaults({
      initialDate: null,
      initialTime: null,
      initialClinician: null,
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <header className="border-b border-[#e5e1d8] bg-[#f7f4ed]">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-6 lg:px-10">
          <div className="flex min-w-fit items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d2d26] text-white">
              <span className="text-lg font-semibold">W</span>
            </div>

            <div className="leading-none">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-semibold tracking-tight">
                  BrightSmile
                </span>

                <span className="rounded-full bg-[#e8e6df] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#4b514e]">
                  Staff Portal
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#69706c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b84620]" />
                Airport Residential • Open
              </div>
            </div>
          </div>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={openWalkInBooking}
              className="hidden items-center gap-2 rounded-xl bg-[#b84620] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9f3c1b] md:flex"
            >
              <UserRoundPlus size={16} />
              <span>Walk-in / Booking</span>
            </button>

            <div className="hidden items-center gap-3 border-l border-[#dedad1] pl-4 sm:flex">
              <div className="text-right leading-tight">
                <label htmlFor="duty-clinician-select" className="sr-only">
                  Select clinician on duty
                </label>
                <select
                  id="duty-clinician-select"
                  value={selectedClinicianId}
                  onChange={(event) =>
                    setSelectedClinicianId(event.target.value)
                  }
                  className="w-40 rounded-lg border border-[#d9d3c8] bg-white px-2 py-1.5 text-sm font-semibold text-[#182a25] outline-none transition focus:border-[#0d2d26]"
                  aria-label="Clinician on duty"
                >
                  {staffClinicians.length === 0 ? (
                    <option value="">No clinicians</option>
                  ) : (
                    staffClinicians.map((clinician) => (
                      <option key={clinician.id} value={clinician.id}>
                        {clinician.name || "Unnamed clinician"}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-[#69706c]">
                  {dutyClinician?.title || "Clinician"} • On duty
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d5ca] text-xs font-bold text-[#0d2d26]">
                {getInitials(dutyClinician?.name || "Duty")}
              </div>

              <ChevronDown size={15} className="text-[#69706c]" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-360 px-6 py-8 lg:px-10">
        <Outlet
          context={{
            openCalendarBooking,
          }}
        />
      </main>
      <WalkInBookingModal
        isOpen={walkInOpen}
        onClose={closeWalkInBooking}
        initialDate={bookingDefaults.initialDate}
        initialTime={bookingDefaults.initialTime}
        initialClinician={bookingDefaults.initialClinician}
        onAppointmentCreated={() => {
          // Calendar refresh will be connected in the next step.
        }}
      />
    </div>
  );
}
