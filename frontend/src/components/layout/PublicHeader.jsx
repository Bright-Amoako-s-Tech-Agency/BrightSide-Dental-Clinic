import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Calendar, Stethoscope, Sparkles } from "lucide-react";

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Treatments", to: "/treatments" },
    { label: "Our Clinicians", to: "/clinicians" },
    { label: "About Us", to: "/#about" },
    { label: "My Appointments", to: "/my-appointments" },
  ];

  return (
    <header className="relative z-30 border-b border-[#e5e1d8] bg-[#f7f4ed]">
      <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="BrightSmile Dental Home">
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#0d2d26]">
            BrightSmile
          </span>
          <span className="rounded-full bg-[#f3e7e2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b84620]">
            Dental
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition ${
                  isActive
                    ? "font-semibold text-[#b84620] border-b-2 border-[#b84620] pb-1 -mb-1"
                    : "text-[#46504c] hover:text-[#b84620]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/my-appointments"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#dcd9ce] bg-white px-3.5 py-2.5 text-xs font-medium text-[#0d2d26] transition hover:bg-[#eae6db]"
          >
            <Calendar size={14} className="text-[#b84620]" />
            Lookup
          </Link>

          <Link
            to="/book"
            className="shrink-0 rounded-lg bg-[#0d2d26] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white transition hover:bg-[#174238] shadow-sm hover:shadow"
          >
            Book appointment
          </Link>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-[#0d2d26] hover:bg-black/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e5e1d8] bg-[#f7f4ed] px-5 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                location.pathname === link.to
                  ? "bg-[#e5ece2] text-[#0d2d26] font-semibold"
                  : "text-[#46504c] hover:bg-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#e5e1d8]">
            <Link
              to="/my-appointments"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#0d2d26] hover:bg-white"
            >
              <Calendar size={16} className="text-[#b84620]" />
              Find My Appointments
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
