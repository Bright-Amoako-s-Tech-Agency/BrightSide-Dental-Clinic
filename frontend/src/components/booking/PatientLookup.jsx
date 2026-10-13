import { CheckCircle2, Search, UserPlus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { createPatient, getPatients } from "../../services/patientApi";

export default function PatientLookup({ selectedPatient, onPatientSelect }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setPatients([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getPatients(query);

        if (!cancelled) {
          setPatients(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to search patients.");
          setPatients([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreatePatient(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
    };

    if (!payload.first_name || !payload.last_name || !payload.phone) {
      setError("Enter the patient's first name, last name, and phone.");
      return;
    }

    setCreating(true);

    try {
      const result = await createPatient(payload);
      const patient = result.data;

      if (!patient?.id) {
        throw new Error("The server did not return a valid patient.");
      }

      onPatientSelect(patient);
      setSearch("");
      setPatients([]);
      setShowCreateForm(false);
      setForm({
        first_name: "",
        last_name: "",
        phone: "",
      });

      setNotice(
        result.created
          ? "Patient created and selected."
          : "Existing patient found and selected.",
      );
    } catch (err) {
      setError(err.message || "Unable to create patient.");
    } finally {
      setCreating(false);
    }
  }

  function handleSelectPatient(patient) {
    onPatientSelect(patient);
    setNotice("");
    setError("");
    setSearch("");
    setPatients([]);
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-[#0d2d26]">Step 1 of 4</p>
        <h2 className="mt-1 text-xl font-semibold text-[#0d2d26]">
          Find or add a patient
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Search by name or phone number, or register a new patient.
        </p>
      </div>

      {selectedPatient && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 text-green-700" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#0d2d26]">
              {selectedPatient.first_name} {selectedPatient.last_name}
            </p>
            <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
            <p className="mt-1 text-xs text-green-700">Patient selected</p>
          </div>

          <button
            type="button"
            onClick={() => onPatientSelect(null)}
            className="text-sm font-medium text-[#0d2d26] underline"
          >
            Change
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor="patient-search"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Search existing patients
        </label>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="patient-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Enter a name or phone number..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-[#0d2d26] focus:ring-2 focus:ring-[#0d2d26]/10"
          />
        </div>

        {loading && (
          <p className="mt-2 text-sm text-gray-500">Searching patients...</p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading &&
          search.trim().length >= 2 &&
          !error &&
          patients.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              No matching patients found. You can add a new patient below.
            </p>
          )}

        {patients.length > 0 && (
          <div className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {patients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelectPatient(patient)}
                className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-[#f7f4ed]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f4ed] text-[#0d2d26]">
                  <UserRound size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-[#0d2d26]">
                    {patient.first_name} {patient.last_name}
                  </span>
                  <span className="block text-sm text-gray-500">
                    {patient.phone}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-[#0d2d26]">New patient?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add their basic details to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setError("");
              setNotice("");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0d2d26] px-3 py-2 text-sm font-medium text-[#0d2d26] hover:bg-[#f7f4ed]"
          >
            <UserPlus size={17} />
            {showCreateForm ? "Close form" : "Add patient"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreatePatient} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="first_name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleFormChange}
                autoComplete="given-name"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-[#0d2d26]"
              />
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleFormChange}
                autoComplete="family-name"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-[#0d2d26]"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleFormChange}
                autoComplete="tel"
                required
                placeholder="e.g. 0240000000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-[#0d2d26]"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-[#0d2d26] px-4 py-3 font-medium text-white transition hover:bg-[#164238] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Saving patient..." : "Save and select patient"}
            </button>
          </form>
        )}
      </div>

      {notice && (
        <p role="status" className="text-sm font-medium text-green-700">
          {notice}
        </p>
      )}
    </section>
  );
}
