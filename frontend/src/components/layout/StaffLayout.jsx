import { ChevronDown, Search, UserRoundPlus } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    to: "/",
  },
  {
    label: "Appointments",
    to: "/appointments",
  },
  {
    label: "Patients",
    to: "/patients",
  },
  {
    label: "Clinicians",
    to: "/clinicians",
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

export default function StaffLayout() {
  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <header className="border-b border-[#e5e1d8] bg-[#f7f4ed]">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-6 lg:px-10">
          {/* Brand */}
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

          {/* Navigation */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}

            <button
              type="button"
              className="rounded-xl p-2 text-[#59615d] transition-colors hover:bg-[#eeece5]"
              aria-label="Search"
            >
              <Search size={17} strokeWidth={1.8} />
            </button>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="hidden items-center gap-2 rounded-xl bg-[#b84620] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9f3c1b] md:flex"
            >
              <UserRoundPlus size={16} />
              <span>Walk-in / Booking</span>
            </button>

            <div className="hidden items-center gap-3 border-l border-[#dedad1] pl-4 sm:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-[#182a25]">
                  Dr. Abena Mensah
                </p>
                <p className="text-[11px] text-[#69706c]">
                  Lead Surgeon • Duty
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d5ca] text-xs font-bold text-[#0d2d26]">
                AM
              </div>

              <ChevronDown size={15} className="text-[#69706c]" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
