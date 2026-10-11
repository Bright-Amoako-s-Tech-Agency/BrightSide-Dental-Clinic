import { Clock3, Layers3, RefreshCw, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTreatments } from "../services/treatmentApi";

function formatMoney(amount) {
  if (amount == null) return "Not set";

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPrice(treatment) {
  const { price_type, price_min, price_max } = treatment;

  if (price_type === "fixed") return formatMoney(price_min);

  if (price_type === "range") {
    return `${formatMoney(price_min)} – ${formatMoney(price_max)}`;
  }

  if (price_type === "from") return `From ${formatMoney(price_min)}`;

  return formatMoney(price_min);
}

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTreatments() {
    setLoading(true);
    setError("");

    try {
      const data = await getTreatments();
      setTreatments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load treatments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTreatments();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    treatments.forEach((treatment) => {
      if (treatment.category?.id) {
        uniqueCategories.set(treatment.category.id, treatment.category.name);
      }
    });

    return Array.from(uniqueCategories, ([id, name]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return treatments.filter((treatment) => {
      const matchesSearch =
        !query ||
        treatment.name?.toLowerCase().includes(query) ||
        treatment.description?.toLowerCase().includes(query) ||
        treatment.category?.name?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || treatment.category?.id === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [treatments, search, categoryFilter]);

  const activeCount = treatments.filter((item) => item.active).length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b84620]">
            Clinic management
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#10231f]">
            Treatments
          </h1>
          <p className="mt-2 text-sm text-[#69706c]">
            Browse dental services, pricing, and appointment durations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTreatments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#dedad1] bg-white px-4 py-2.5 text-sm font-semibold text-[#10231f] transition-colors hover:bg-[#eeece5] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e5e1d8] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#69706c]">Total treatments</p>
            <Layers3 size={18} className="text-[#b84620]" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{treatments.length}</p>
          <p className="mt-1 text-xs text-[#69706c]">All listed services</p>
        </div>

        <div className="rounded-2xl border border-[#e5e1d8] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#69706c]">Active treatments</p>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
          <p className="mt-1 text-xs text-[#69706c]">Currently active</p>
        </div>

        <div className="rounded-2xl border border-[#e5e1d8] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#69706c]">Categories</p>
            <Layers3 size={18} className="text-[#b84620]" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{categories.length}</p>
          <p className="mt-1 text-xs text-[#69706c]">Treatment categories</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5e1d8] bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858b87]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search treatments or categories..."
              className="w-full rounded-xl border border-[#dedad1] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#0d2d26]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-[#dedad1] bg-[#fcfbf8] px-4 py-3 text-sm outline-none focus:border-[#0d2d26] md:min-w-56"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between border-b border-[#eeeae2] pb-4">
          <h2 className="font-semibold text-[#10231f]">Treatment directory</h2>
          <span className="text-xs text-[#69706c]">
            {filteredTreatments.length} results
          </span>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={loadTreatments}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-[#69706c]">
            Loading treatments...
          </p>
        ) : !error && filteredTreatments.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#69706c]">
            No treatments match your search.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-[#eeeae2]">
            {filteredTreatments.map((treatment) => (
              <article
                key={treatment.id}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#10231f]">
                      {treatment.name}
                    </h3>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        treatment.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-[#eeece5] text-[#69706c]",
                      ].join(" ")}
                    >
                      {treatment.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-medium text-[#b84620]">
                    {treatment.category?.name || "Uncategorized"}
                  </p>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69706c]">
                    {treatment.description || "No description provided."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#59615d]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={14} />
                      {treatment.duration_minutes} minutes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet size={14} />
                      Deposit: {formatMoney(treatment.deposit_amount)}
                    </span>
                  </div>
                </div>

                <div className="sm:min-w-44 sm:text-right">
                  <p className="text-xs text-[#69706c]">Treatment price</p>
                  <p className="mt-1 text-lg font-semibold text-[#10231f]">
                    {formatPrice(treatment)}
                  </p>
                  {treatment.price_type && (
                    <p className="mt-1 text-xs capitalize text-[#69706c]">
                      {treatment.price_type.replace("_", " ")} pricing
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
