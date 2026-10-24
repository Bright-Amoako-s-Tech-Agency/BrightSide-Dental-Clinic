import {
  BriefcaseMedical,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  X,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createClinician, getClinicians } from "../services/clinicianApi";
import { getTreatments } from "../services/treatmentApi";

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? `GH₵ ${amount.toLocaleString()}` : "—";
}

const emptyClinicianForm = {
  name: "",
  title: "",
  specialty: "",
  experience_years: "",
  consultation_fee: "",
  bio: "",
  active: true,
};

export default function Clinicians() {
  const [clinicians, setClinicians] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyClinicianForm);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [cliniciansData, treatmentsData] = await Promise.all([
        getClinicians(),
        getTreatments().catch(() => []),
      ]);
      setClinicians(Array.isArray(cliniciansData) ? cliniciansData : []);
      setTreatments(Array.isArray(treatmentsData) ? treatmentsData.filter((t) => t.active) : []);
    } catch (err) {
      setError(err.message || "Failed to load clinicians.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredClinicians = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clinicians;

    return clinicians.filter((clinician) =>
      [
        clinician.name,
        clinician.title,
        clinician.specialty,
        clinician.slug,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [clinicians, search]);

  const activeCount = clinicians.filter(
    (clinician) => clinician.active === true,
  ).length;

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleTreatment(treatmentId) {
    setSelectedTreatments((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId]
    );
  }

  function selectAllTreatments() {
    setSelectedTreatments(treatments.map((t) => t.id));
  }

  function clearAllTreatments() {
    setSelectedTreatments([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage({ type: "", text: "" });

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      specialty: form.specialty.trim(),
      experience_years:
        form.experience_years === "" ? null : Number(form.experience_years),
      consultation_fee:
        form.consultation_fee === "" ? null : Number(form.consultation_fee),
      bio: form.bio.trim() || null,
      active: form.active,
      treatment_ids: selectedTreatments,
    };

    if (!payload.name || !payload.title || !payload.specialty) {
      setSubmitMessage({
        type: "error",
        text: "Full name, title, and specialty are required.",
      });
      return;
    }

    if (
      payload.experience_years !== null &&
      (Number.isNaN(payload.experience_years) || payload.experience_years < 0)
    ) {
      setSubmitMessage({
        type: "error",
        text: "Experience years must be a valid non-negative number.",
      });
      return;
    }

    if (
      payload.consultation_fee !== null &&
      (Number.isNaN(payload.consultation_fee) || payload.consultation_fee < 0)
    ) {
      setSubmitMessage({
        type: "error",
        text: "Consultation fee must be a valid number.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createClinician(payload);
      setSubmitMessage({
        type: "success",
        text: `Dr. ${payload.name} created and linked to ${selectedTreatments.length} treatment(s) successfully.`,
      });
      setForm(emptyClinicianForm);
      setSelectedTreatments([]);
      await loadData(true);
      setTimeout(() => setShowAddForm(false), 2000);
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: err.message || "Unable to create this clinician.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clinicians</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your dental staff, specialties, on-duty status, and linked treatments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d2d26] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163a34]"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showAddForm ? "Cancel" : "Add Clinician"}</span>
          </button>
        </div>
      </div>

      {/* Add Clinician Form (Collapsible) */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all"
        >
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Register New Clinician
              </h2>
              <p className="text-sm text-slate-500">
                Add profile details and associate treatments they are qualified to perform.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Full Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Dr. Ama Owusu"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Professional Title *
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="e.g. Lead Dental Surgeon, Orthodontist"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Specialty *
              <input
                type="text"
                name="specialty"
                value={form.specialty}
                onChange={handleFormChange}
                placeholder="e.g. Cosmetic & Restorative Dentistry"
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Experience (Years)
              <input
                type="number"
                min="0"
                name="experience_years"
                value={form.experience_years}
                onChange={handleFormChange}
                placeholder="e.g. 6"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Consultation Fee (GHS)
              <input
                type="number"
                min="0"
                step="0.01"
                name="consultation_fee"
                value={form.consultation_fee}
                onChange={handleFormChange}
                placeholder="e.g. 300"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:mt-6">
              <span>Active status (available for bookings)</span>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-slate-300 text-[#0d2d26] focus:ring-[#0d2d26]"
              />
            </label>
          </div>

          <label className="mt-4 block space-y-1.5 text-sm font-medium text-slate-700">
            Professional Bio
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleFormChange}
              rows="3"
              placeholder="Describe their clinical background, education, and patient care philosophy..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
            />
          </label>

          {/* Treatment Selection */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Assign Treatments
                </p>
                <p className="text-xs text-slate-500">
                  Select the services this clinician can perform during patient bookings.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllTreatments}
                  className="text-xs font-semibold text-[#0d2d26] hover:underline"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllTreatments}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto p-1">
              {treatments.map((t) => {
                const checked = selectedTreatments.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs transition cursor-pointer ${
                      checked
                        ? "border-[#0d2d26] bg-[#edf5ef] text-[#0d2d26] font-medium"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTreatment(t.id)}
                      className="rounded border-slate-300 text-[#0d2d26] focus:ring-[#0d2d26]"
                    />
                    <span className="truncate">{t.name}</span>
                  </label>
                );
              })}
            </div>
            {selectedTreatments.length > 0 && (
              <p className="mt-2 text-xs text-[#0d2d26] font-medium">
                {selectedTreatments.length} treatment(s) selected.
              </p>
            )}
          </div>

          {submitMessage.text && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                submitMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {submitMessage.text}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d2d26] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#163a34] disabled:opacity-70"
            >
              {submitting ? "Saving Clinician..." : "Save Clinician"}
            </button>
          </div>
        </form>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Clinicians</p>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : filteredClinicians.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
              <BriefcaseMedical size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Clinicians</p>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinicians Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, title, or specialty..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0d2d26] focus:bg-white focus:ring-2 focus:ring-[#0d2d26]/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  "Clinician",
                  "Specialty",
                  "Experience",
                  "Consultation Fee",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading clinicians...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredClinicians.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Stethoscope size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">No clinicians found</p>
                    <p className="mt-1 text-xs text-slate-500">Try a different search term or add a new clinician.</p>
                  </td>
                </tr>
              ) : (
                filteredClinicians.map((clinician) => (
                  <tr key={clinician.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {clinician.name || "Unnamed clinician"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {clinician.title || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {clinician.specialty || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {clinician.experience_years == null
                        ? "—"
                        : `${clinician.experience_years} ${
                            Number(clinician.experience_years) === 1 ? "year" : "years"
                          }`}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {formatAmount(clinician.consultation_fee)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          clinician.active === true
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            clinician.active === true ? "bg-emerald-600" : "bg-slate-400"
                          }`}
                        />
                        {clinician.active === true ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/staff/clinicians/${clinician.id}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredClinicians.length}{" "}
            {filteredClinicians.length === 1 ? "clinician" : "clinicians"}
          </div>
        )}
      </div>
    </div>
  );
}
