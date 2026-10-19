import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Award,
  Calendar,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import PublicHeader from "../components/layout/PublicHeader";
import { apiRequest } from "../services/api";

const clinicianPhotos = {
  default:
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
};

export default function PublicClinicians() {
  const [clinicians, setClinicians] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [cliniciansRes, treatmentsRes] = await Promise.all([
          apiRequest("/clinicians"),
          apiRequest("/treatments"),
        ]);

        if (!ignore) {
          const docList = Array.isArray(cliniciansRes?.data) ? cliniciansRes.data : [];
          setClinicians(docList.filter((c) => c.active));

          const treatList = Array.isArray(treatmentsRes?.data) ? treatmentsRes.data : [];
          setTreatments(treatList.filter((t) => t.active));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load our clinicians.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // Filter clinicians
  const filteredClinicians = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clinicians;

    return clinicians.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.specialty && c.specialty.toLowerCase().includes(q)) ||
        (c.bio && c.bio.toLowerCase().includes(q))
      );
    });
  }, [clinicians, searchQuery]);

  // Create a treatment map by ID for quick lookup of treatment names
  const treatmentMap = useMemo(() => {
    const map = new Map();
    treatments.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [treatments]);

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <PublicHeader />

      <main>
        {/* Hero Section */}
        <section className="border-b border-[#e5e1d8] bg-[#fbf9f4] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-block rounded-full bg-[#f3e7e2] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b84620]">
              Our Dental Care Team
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[#0d2d26] sm:text-5xl lg:text-6xl">
              People who put you at ease.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#66716a] sm:text-lg">
              Get to know the passionate clinicians at BrightSmile. Every dentist and hygienist on our team
              is dedicated to respectful, gentle care and listening to your concerns.
            </p>

            {/* Search */}
            <div className="mt-8 mx-auto max-w-md">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858b84]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by doctor name or specialty..."
                  className="w-full rounded-2xl border border-[#dcd9ce] bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#a2a59e] focus:border-[#0d2d26] focus:ring-4 focus:ring-[#0d2d26]/5 shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#858b84] hover:text-[#0d2d26]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Clinicians Grid */}
        <section className="px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block size-8 animate-spin rounded-full border-4 border-[#0d2d26] border-r-transparent" />
                <p className="mt-4 text-sm text-[#66716a]">Loading our clinical team...</p>
              </div>
            ) : error ? (
              <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-semibold text-red-900">Unable to load clinicians</p>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-full bg-[#0d2d26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#19463a]"
                >
                  Retry
                </button>
              </div>
            ) : filteredClinicians.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-serif text-2xl text-[#0d2d26]">No clinicians found</p>
                <p className="mt-2 text-sm text-[#66716a]">
                  Try another search keyword or clear the search field.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-full bg-[#0d2d26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#19463a]"
                >
                  Show all clinicians
                </button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredClinicians.map((clinician) => {
                  const imageSrc = clinician.image_url || clinicianPhotos.default;

                  // Get treatment names this clinician provides
                  const clinicianTreatmentNames = Array.isArray(clinician.clinician_treatments)
                    ? clinician.clinician_treatments
                        .map((ct) => treatmentMap.get(ct.treatment_id))
                        .filter(Boolean)
                    : [];

                  return (
                    <article
                      key={clinician.id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-[#dedad1] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      {/* Photo / Avatar Header */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e5ece2]">
                        <img
                          src={imageSrc}
                          alt={clinician.name}
                          className="h-full w-full object-cover object-top transition duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#10231f]/75 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="font-serif text-2xl font-medium leading-tight">
                            {clinician.name}
                          </p>
                          <p className="mt-1 text-xs text-white/90">
                            {clinician.title || clinician.specialty || "Dental Surgeon"}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-6 sm:p-7">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {clinician.specialty && (
                            <span className="rounded-full bg-[#f3e7e2] px-3 py-1 text-[11px] font-semibold text-[#b84620]">
                              {clinician.specialty}
                            </span>
                          )}
                          {clinician.experience_years && (
                            <span className="flex items-center gap-1 rounded-full bg-[#e5ece2] px-2.5 py-1 text-[11px] font-medium text-[#0d2d26]">
                              <Award size={12} className="text-[#0d2d26]" />
                              {clinician.experience_years}+ years exp.
                            </span>
                          )}
                        </div>

                        {/* Bio */}
                        <p className="mt-4 flex-1 text-sm leading-6 text-[#66716a]">
                          {clinician.bio ||
                            "Committed to providing gentle, anxiety-free dental care tailored to your unique smile."}
                        </p>

                        {/* Treatments provided tags */}
                        {clinicianTreatmentNames.length > 0 && (
                          <div className="mt-5 border-t border-[#f0eee6] pt-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#858b84]">
                              Services Provided
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {clinicianTreatmentNames.slice(0, 4).map((name) => (
                                <span
                                  key={name}
                                  className="rounded-lg bg-[#f7f4ed] border border-[#e8e4da] px-2.5 py-1 text-xs text-[#263b34]"
                                >
                                  {name}
                                </span>
                              ))}
                              {clinicianTreatmentNames.length > 4 && (
                                <span className="rounded-lg bg-[#f7f4ed] border border-[#e8e4da] px-2 py-1 text-xs text-[#858b84]">
                                  +{clinicianTreatmentNames.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* CTA button */}
                        <div className="mt-6 pt-2">
                          <Link
                            to={`/book?clinicianId=${clinician.id}`}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#0d2d26] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#19463a]"
                          >
                            Book with {clinician.name.split(" ")[0] || "Clinician"}
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Philosophy banner */}
        <section className="border-t border-[#e5e1d8] bg-[#fbf9f4] px-6 py-16 sm:px-10 lg:px-16 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b84620]">
              Patient-First Dentistry
            </span>
            <h2 className="mt-3 font-serif text-3xl text-[#0d2d26] sm:text-4xl">
              Every appointment moves at your pace.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#66716a]">
              We know dental visits can feel intimidating. Our clinicians are specially trained in gentle dentistry,
              taking time to explain each step and checking in with you throughout your care.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/book"
                className="rounded-full bg-[#0d2d26] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#19463a]"
              >
                Book your first visit
              </Link>
              <Link
                to="/treatments"
                className="rounded-full border border-[#dcd9ce] bg-white px-6 py-3.5 text-sm font-semibold text-[#0d2d26] transition hover:bg-[#f7f4ed]"
              >
                Explore treatments
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
