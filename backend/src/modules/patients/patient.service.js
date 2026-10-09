import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

const patientSelect = `
  id,
  first_name,
  last_name,
  phone,
  email,
  date_of_birth,
  notes,
  created_at,
  updated_at
`;

export async function findPatientByPhone(phone) {
  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect)
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to find patient", 500);
  }

  return data;
}

export async function createPatient(patientData) {
  const { first_name, last_name, phone, email, date_of_birth, notes } =
    patientData;

  if (!first_name || !last_name || !phone) {
    throw new AppError("first_name, last_name and phone are required", 400);
  }

  const existingPatient = await findPatientByPhone(phone);

  if (existingPatient) {
    return {
      patient: existingPatient,
      created: false,
    };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      first_name,
      last_name,
      phone,
      email: email || null,
      date_of_birth: date_of_birth || null,
      notes: notes || null,
    })
    .select(patientSelect)
    .single();

  if (error) {
    throw new AppError("Failed to create patient", 500);
  }

  return {
    patient: data,
    created: true,
  };
}

export async function getPatients(search = "") {
  let query = supabase
    .from("patients")
    .select(patientSelect)
    .order("created_at", { ascending: false });

  const term = search.trim();

  if (term) {
    const safeTerm = term.replace(/[,%()]/g, "");

    if (safeTerm) {
      query = query.or(
        `first_name.ilike.%${safeTerm}%,last_name.ilike.%${safeTerm}%,phone.ilike.%${safeTerm}%`,
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to fetch patients", 500);
  }

  return data;
}

export async function getPatientById(id) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new AppError("Valid patient ID is required", 400);
  }

  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to fetch patient", 500);
  }

  if (!data) {
    throw new AppError("Patient not found", 404);
  }

  return data;
}
