import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Search, Sparkles, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";
import PublicHeader from "../components/layout/PublicHeader";
import { apiRequest } from "../services/api";
import orthodontics from "../assets/orthodontist.jpg";
import preventive from "../assets/preventive.jpg";
import restorative from "../assets/restoration.jpg";
import welcome from "../assets/welcome.jpg";

const treatmentImages = {
  "preventive-hygiene": preventive,
  "restorative-care": restorative,
  "cosmetic-dentistry":
    "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=700&q=80",
  "orthodontics-implants": orthodontics,
};

function formatPrice(treatment) {
  const { price_type, price_min, price_max } = treatment;
  const min = Number(price_min || 0);
  const max = price_max ? Number(price_max) : null;

  if (price_type === "range" && max !== null) {
    return `GH₵${min.toLocaleString()} – GH₵${max.toLocaleString()}`;
  }

  if (price_type === "from" || max === null) {
    return `From GH₵${min.toLocaleString()}`;
  }

  return `GH₵${min.toLocaleString()}`;
}

export default function PublicTreatments() {
  const [treatments, setTreatments] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [treatmentsRes, cliniciansRes] = await Promise.all([
          apiRequest("/treatments"),
          apiRequest("/clinicians"),
        ]);

        if (!ignore) {
          const list = Array.isArray(treatmentsRes?.data) ? treatmentsRes.data : [];
          setTreatments(list.filter((t) => t.active));

          const docList = Array.isArray(cliniciansRes?.data) ? cliniciansRes.data : [];
          setClinicians(docList.filter((c) => c.active));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load treatment options.");
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

  // Derive unique categories from treatments
  const categories = useMemo(() => {
    const map = new Map();
    treatments.forEach((t) => {
      if (t.category?.slug && t.category?.name) {
        map.set(t.category.slug, t.category.name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [treatments]);

  // Filter treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter((treatment) => {
      const matchesCategory =
        selectedCategory === "all" ||
        treatment.category?.slug === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        treatment.name.toLowerCase().includes(q) ||
        (treatment.description && treatment.description.toLowerCase().includes(q)) ||
        (treatment.category?.name && treatment.category.name.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [treatments, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#10231f]">
      <PublicHeader />

      <main>
        {/* Hero Section */}
        <section className="border-b border-[#e5e1d8] bg-[#fbf9f4] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-block rounded-full bg-[#f3e7e2] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b84620]">
              Our Treatments & Services
            </span>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-[#0d2d26] sm:text-5xl lg:text-6xl">
              Care for every kind of smile.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#66716a] sm:text-lg">
              Explore our dental treatments designed around your comfort, lasting oral health, and confidence.
              Transparent pricing, gentle techniques, and thoughtful care.
            </p>

            {/* Quick Search & Filters */}
            <div className="mt-8 mx-auto max-w-xl">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#858b84]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search treatments (e.g. Cleaning, Whitening, Root Canal)..."
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

            {/* Category Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === "all"
                    ? "bg-[#0d2d26] text-white shadow-sm"
                    : "border border-[#dcd9ce] bg-white text-[#46504c] hover:bg-[#ece8dc]"
                }`}
              >
                All Services ({treatments.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    selectedCategory === cat.slug
                      ? "bg-[#0d2d26] text-white shadow-sm"
                      : "border border-[#dcd9ce] bg-white text-[#46504c] hover:bg-[#ece8dc]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Treatment Grid */}
        <section className="px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block size-8 animate-spin rounded-full border-4 border-[#0d2d26] border-r-transparent" />
                <p className="mt-4 text-sm text-[#66716a]">Loading dental services...</p>
              </div>
            ) : error ? (
              <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-semibold text-red-900">Unable to load treatments</p>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-full bg-[#0d2d26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#19463a]"
                >
                  Retry
                </button>
              </div>
            ) : filteredTreatments.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-serif text-2xl text-[#0d2d26]">No treatments found</p>
                <p className="mt-2 text-sm text-[#66716a]">
                  Try clearing your search or picking another category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 rounded-full bg-[#0d2d26] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#19463a]"
                >
                  Show all treatments
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTreatments.map((treatment) => {
                  const imageSrc =
                    treatmentImages[treatment.category?.slug] || welcome;

                  // Find eligible clinicians for this treatment
                  const eligibleDocs = clinicians.filter((doc) =>
                    Array.isArray(doc.clinician_treatments)
                      ? doc.clinician_treatments.some(
                          (item) => item.treatment_id === treatment.id
                        )
                      : false
                  );

                  return (
                    <article
                      key={treatment.id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-[#dedad1] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      {/* Image header */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#e5ece2]">
                        <img
                          src={imageSrc}
                          alt={treatment.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-[#0d2d26]/85 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-white">
                            {treatment.category?.name || "General Care"}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-[#0d2d26] shadow-sm">
                            <Clock size={12} className="text-[#b84620]" />
                            {treatment.duration_minutes} min
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-6 sm:p-7">
                        <h3 className="font-serif text-2xl text-[#0d2d26]">
                          {treatment.name}
                        </h3>

                        <p className="mt-3 flex-1 text-sm leading-6 text-[#66716a]">
                          {treatment.description ||
                            "Professional dental treatment delivered by our experienced clinicians."}
                        </p>

                        {/* Eligible Clinicians */}
                        {eligibleDocs.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#f0eee6]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#858b84]">
                              Performed by
                            </p>
                            <p className="mt-1 text-xs text-[#0d2d26] font-medium truncate">
                              {eligibleDocs.map((d) => d.name).join(", ")}
                            </p>
                          </div>
                        )}

                        {/* Price & Deposit Details */}
                        <div className="mt-5 rounded-2xl bg-[#f7f4ed] p-4">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-[#66716a]">Fee estimate</span>
                            <span className="font-serif text-lg font-semibold text-[#0d2d26]">
                              {formatPrice(treatment)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-[#858b84]">Booking deposit:</span>
                            <span className="font-medium text-[#b84620]">
                              GH₵{Number(treatment.deposit_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* CTA button */}
                        <Link
                          to={`/book?treatmentId=${treatment.id}`}
                          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#0d2d26] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#19463a]"
                        >
                          Book this treatment
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Reassurance Banner */}
        <section className="border-t border-[#e5e1d8] bg-[#0d2d26] px-6 py-14 sm:px-10 lg:px-16 text-white">
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-[#f0b69b]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg">Transparent Pricing</h4>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  Clear upfront pricing with no hidden charges. Your initial deposit secures your preferred time slot.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-[#f0b69b]">
                <HeartHandshake size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg">Comfort Mode Available</h4>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  Anxious about the dentist? Choose our Extra-Gentle Comfort Care option during your booking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-[#f0b69b]">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg">Need Guidance?</h4>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  Not sure which treatment fits? Book a routine Dental Consultation and our clinicians will guide you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
