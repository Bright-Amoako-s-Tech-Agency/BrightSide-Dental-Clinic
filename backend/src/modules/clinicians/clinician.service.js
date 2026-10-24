import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

const clinicianSelect = `
  id,
  name,
  slug,
  title,
  specialty,
  bio,
  experience_years,
  consultation_fee,
  image_url,
  active,
  clinician_treatments (
    treatment_id
  )
`;

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function findClinicians() {
  const { data, error } = await supabase
    .from("clinicians")
    .select(clinicianSelect)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new AppError("Failed to fetch clinicians", 500);
  }

  return data;
}

export async function findClinicianById(id) {
  const { data, error } = await supabase
    .from("clinicians")
    .select(clinicianSelect)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to fetch clinician", 500);
  }

  if (!data) {
    throw new AppError("Clinician not found", 404);
  }

  return data;
}

function normalizeClinicianInput(input = {}) {
  const payload = {
    name: input.name == null ? null : String(input.name).trim(),
    title: input.title == null ? null : String(input.title).trim(),
    specialty: input.specialty == null ? null : String(input.specialty).trim(),
    bio:
      input.bio == null || String(input.bio).trim() === ""
        ? null
        : String(input.bio).trim(),
    image_url:
      input.image_url == null || String(input.image_url).trim() === ""
        ? null
        : String(input.image_url).trim(),
    active: input.active === undefined ? true : Boolean(input.active),
  };

  if (
    input.slug !== undefined &&
    input.slug !== null &&
    String(input.slug).trim() !== ""
  ) {
    payload.slug = String(input.slug).trim();
  } else if (payload.name) {
    payload.slug = slugify(payload.name);
  }

  if (
    input.experience_years !== undefined &&
    input.experience_years !== null &&
    input.experience_years !== ""
  ) {
    payload.experience_years = Number(input.experience_years);
  }

  if (
    input.consultation_fee !== undefined &&
    input.consultation_fee !== null &&
    input.consultation_fee !== ""
  ) {
    payload.consultation_fee = Number(input.consultation_fee);
  }

  return payload;
}

function validateClinicianInput(payload) {
  if (!payload.name) {
    throw new AppError("Clinician name is required", 400);
  }

  if (!payload.title) {
    throw new AppError("Clinician title is required", 400);
  }

  if (!payload.specialty) {
    throw new AppError("Clinician specialty is required", 400);
  }

  if (payload.experience_years !== undefined && payload.experience_years < 0) {
    throw new AppError("Experience years cannot be negative", 400);
  }

  if (payload.consultation_fee !== undefined && payload.consultation_fee < 0) {
    throw new AppError("Consultation fee cannot be negative", 400);
  }

  if (payload.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    throw new AppError(
      "Slug must contain only lowercase letters, numbers, and hyphens",
      400,
    );
  }
}

export async function createClinician(input) {
  const payload = normalizeClinicianInput(input);
  validateClinicianInput(payload);

  const { data, error } = await supabase
    .from("clinicians")
    .insert(payload)
    .select(clinicianSelect)
    .single();

  if (error) {
    console.error("Supabase create clinician error:", error);
    if (error.code === "23505") {
      throw new AppError("A clinician with this slug already exists", 409);
    }

    throw new AppError(error.message || "Failed to create clinician", 500);
  }

  // Link treatments if provided
  if (Array.isArray(input.treatment_ids) && input.treatment_ids.length > 0) {
    const rows = input.treatment_ids.map((treatment_id) => ({
      clinician_id: data.id,
      treatment_id,
    }));

    const { error: linkError } = await supabase
      .from("clinician_treatments")
      .insert(rows);

    if (linkError) {
      console.error("Failed to link treatments to clinician:", linkError);
    }
  }

  // Fetch updated record with relations
  const { data: fullClinician } = await supabase
    .from("clinicians")
    .select(clinicianSelect)
    .eq("id", data.id)
    .maybeSingle();

  return fullClinician || data;
}
