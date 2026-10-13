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
