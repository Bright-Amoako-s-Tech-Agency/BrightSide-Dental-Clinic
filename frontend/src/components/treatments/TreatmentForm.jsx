import { X } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  category_id: "",
  price_type: "fixed",
  price_min: "",
  price_max: "",
  duration_minutes: "45",
  deposit_amount: "0",
  display_order: "0",
  active: true,
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[#dedad1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0d2d26]";

const labelClass = "block text-sm font-medium text-[#35413b]";

export default function TreatmentForm({
  treatment,
  categories,
  onClose,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!treatment) {
      setForm({
        ...emptyForm,
        category_id: categories[0]?.id || "",
      });
      return;
    }

    setForm({
      name: treatment.name || "",
      description: treatment.description || "",
      category_id: treatment.category?.id || treatment.category_id || "",
      price_type: treatment.price_type || "fixed",
      price_min: String(treatment.price_min ?? ""),
      price_max: String(treatment.price_max ?? ""),
      duration_minutes: String(treatment.duration_minutes ?? 45),
      deposit_amount: String(treatment.deposit_amount ?? 0),
      display_order: String(treatment.display_order ?? 0),
      active: Boolean(treatment.active),
    });
  }, [treatment, categories]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "price_type" && value === "from" ? { price_max: "" } : {}),
      ...(name === "price_type" && value === "fixed"
        ? { price_max: current.price_min }
        : {}),
    }));
  }

  function updateMinimumPrice(event) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      price_min: value,
      ...(current.price_type === "fixed" ? { price_max: value } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const minimum = Number(form.price_min);
    const maximum = form.price_max === "" ? null : Number(form.price_max);
    const deposit = Number(form.deposit_amount);
    const duration = Number(form.duration_minutes);
    const order = Number(form.display_order);

    if (!form.name.trim()) {
      setError("Enter a treatment name.");
      return;
    }

    if (!form.category_id) {
      setError("Select a treatment category.");
      return;
    }

    if (!Number.isFinite(minimum) || minimum < 0 || form.price_min === "") {
      setError("Enter a valid minimum price.");
      return;
    }

    if (!Number.isFinite(deposit) || deposit < 0) {
      setError("Enter a valid deposit amount.");
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("Duration must be a positive whole number.");
      return;
    }

    if (!Number.isInteger(order) || order < 0) {
      setError("Display order must be zero or a positive whole number.");
      return;
    }

    if (deposit > minimum) {
      setError("Deposit cannot exceed the minimum treatment price.");
      return;
    }

    if (form.price_type === "range") {
      if (maximum === null || !Number.isFinite(maximum) || maximum < minimum) {
        setError("Enter a maximum price equal to or above the minimum.");
        return;
      }
    }

    if (form.price_type === "fixed" && maximum !== minimum) {
      setError("For fixed pricing, the minimum and maximum must match.");
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id,
        price_type: form.price_type,
        price_min: minimum,
        price_max:
          form.price_type === "from"
            ? null
            : form.price_type === "fixed"
              ? minimum
              : maximum,
        duration_minutes: duration,
        deposit_amount: deposit,
        display_order: order,
        active: form.active,
      });
    } catch (err) {
      setError(err.message || "Failed to save treatment.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="treatment-form-title"
        className="my-4 w-full max-w-2xl rounded-2xl bg-[#f7f4ed] shadow-xl"
      >
        <header className="flex items-start justify-between border-b border-[#e5e1d8] px-6 py-5">
          <div>
            <h2
              id="treatment-form-title"
              className="font-serif text-2xl font-semibold text-[#10231f]"
            >
              {treatment ? "Edit treatment" : "Create treatment"}
            </h2>
            <p className="mt-1 text-sm text-[#69706c]">
              Configure the service, pricing, and appointment duration.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
            className="rounded-lg p-2 text-[#59615d] hover:bg-[#eeece5] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Treatment name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                className={inputClass}
                maxLength={150}
                required
              />
            </label>
          </div>

          <div>
            <label className={labelClass}>
              Category *
              <select
                name="category_id"
                value={form.category_id}
                onChange={updateField}
                className={inputClass}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className={labelClass}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                className={inputClass}
                rows={3}
              />
            </label>
          </div>

          <div>
            <label className={labelClass}>
              Pricing type *
              <select
                name="price_type"
                value={form.price_type}
                onChange={updateField}
                className={inputClass}
              >
                <option value="fixed">Fixed price</option>
                <option value="from">Starting from</option>
                <option value="range">Price range</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              {form.price_type === "from"
                ? "Starting price (GHS) *"
                : "Minimum price (GHS) *"}
              <input
                name="price_min"
                type="number"
                min="0"
                step="0.01"
                value={form.price_min}
                onChange={updateMinimumPrice}
                className={inputClass}
                required
              />
            </label>

            {form.price_type === "range" && (
              <label className={labelClass}>
                Maximum price (GHS) *
                <input
                  name="price_max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_max}
                  onChange={updateField}
                  className={inputClass}
                  required
                />
              </label>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Duration (minutes) *
              <input
                name="duration_minutes"
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>

            <label className={labelClass}>
              Deposit (GHS)
              <input
                name="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                value={form.deposit_amount}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
          </div>

          <div>
            <label className={labelClass}>
              Display order
              <input
                name="display_order"
                type="number"
                min="0"
                step="1"
                value={form.display_order}
                onChange={updateField}
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-[#35413b]">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={updateField}
              className="h-4 w-4 accent-[#0d2d26]"
            />
            Treatment is active and available for booking
          </label>

          <footer className="flex flex-col-reverse gap-3 border-t border-[#e5e1d8] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#dedad1] px-5 py-2.5 text-sm font-semibold text-[#35413b] hover:bg-[#eeece5] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || categories.length === 0}
              className="rounded-xl bg-[#0d2d26] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#19443a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : treatment
                  ? "Save changes"
                  : "Create treatment"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
