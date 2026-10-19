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

export function normalizePhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    digits = "0" + digits.slice(3);
  } else if (digits.length === 9) {
    digits = "0" + digits;
  }
  return digits;
}

export function normalizeName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function namesMatch(first1, last1, first2, last2) {
  const f1 = normalizeName(first1);
  const l1 = normalizeName(last1);
  const f2 = normalizeName(first2);
  const l2 = normalizeName(last2);

  if (!f1 || !l1 || !f2 || !l2) return false;

  // 1. Exact match on both names
  if (f1 === f2 && l1 === l2) return true;

  // 2. Swapped first and last names
  if (f1 === l2 && l1 === f2) return true;

  // 3. Combined full names match (e.g. "Bright Adjei" + "Frimpong" vs "Bright" + "Adjei Frimpong")
  const full1 = `${f1} ${l1}`;
  const full2 = `${f2} ${l2}`;
  if (full1 === full2) return true;

  // 4. Same last name, and first name overlaps or is a subpart/token
  // e.g. "Bright Adjei" vs "Bright"
  if (l1 === l2) {
    if (
      f1.startsWith(f2) ||
      f2.startsWith(f1) ||
      f1.includes(f2) ||
      f2.includes(f1)
    ) {
      return true;
    }
    const tokens1 = f1.split(" ");
    const tokens2 = f2.split(" ");
    if (tokens1.some((t) => t.length > 1 && tokens2.includes(t))) {
      return true;
    }
  }

  // 5. One full name contains the other full name
  if (full1.includes(full2) || full2.includes(full1)) {
    return true;
  }

  return false;
}

export async function findPatientByPhone(phone) {
  if (!phone) return null;
  const raw = String(phone).trim();
  const normalized = normalizePhone(raw);

  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect);

  if (error) {
    console.error("Supabase findPatientByPhone error:", error);
    throw new AppError("Failed to find patient", 500);
  }

  const match = data.find((p) => {
    if (p.phone === raw) return true;
    if (normalized && normalizePhone(p.phone) === normalized) return true;
    if (
      p.notes &&
      (p.notes.includes(raw) || (normalized && p.notes.includes(normalized)))
    ) {
      return true;
    }
    return false;
  });

  return match || null;
}

export async function findExistingPatient({
  firstName,
  lastName,
  email,
  phone,
  dateOfBirth,
}) {
  const cleanFirst = firstName ? firstName.trim() : "";
  const cleanLast = lastName ? lastName.trim() : "";
  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const cleanDob = dateOfBirth ? String(dateOfBirth).trim().slice(0, 10) : "";
  const cleanPhone = phone ? String(phone).trim() : "";
  const normPhone = normalizePhone(cleanPhone);

  // 1. Primary rule: match by Email (email is personal and unique)
  if (cleanEmail) {
    const { data: candidates, error } = await supabase
      .from("patients")
      .select(patientSelect)
      .ilike("email", cleanEmail);

    if (error) {
      console.error("Error searching patients by email:", error);
    } else if (candidates && candidates.length > 0) {
      const match = candidates.find((c) => {
        if (namesMatch(c.first_name, c.last_name, cleanFirst, cleanLast)) {
          return true;
        }
        if (
          cleanDob &&
          c.date_of_birth &&
          String(c.date_of_birth).slice(0, 10) === cleanDob
        ) {
          return true;
        }
        if (normPhone && normalizePhone(c.phone) === normPhone) {
          return true;
        }
        const cLast = normalizeName(c.last_name);
        const iLast = normalizeName(cleanLast);
        if (cLast && iLast && cLast === iLast) {
          if (
            !cleanDob ||
            !c.date_of_birth ||
            String(c.date_of_birth).slice(0, 10) === cleanDob
          ) {
            return true;
          }
        }
        return false;
      });

      if (match) return match;

      // If email matches and there is a single record with this email, and DOB does not conflict:
      if (candidates.length === 1) {
        const candidate = candidates[0];
        const dobConflict =
          cleanDob &&
          candidate.date_of_birth &&
          String(candidate.date_of_birth).slice(0, 10) !== cleanDob;
        if (!dobConflict) {
          return candidate;
        }
      }
    }
  }

  // 2. Match by Phone
  if (cleanPhone || normPhone) {
    const matchedByPhone = await findPatientByPhone(cleanPhone);
    if (matchedByPhone) {
      // Check if names match (with middle name, nickname, or compound name tolerance)
      if (
        namesMatch(
          matchedByPhone.first_name,
          matchedByPhone.last_name,
          cleanFirst,
          cleanLast,
        )
      ) {
        return matchedByPhone;
      }

      // Check if last names match and DOB is not conflicting
      const pLast = normalizeName(matchedByPhone.last_name);
      const iLast = normalizeName(cleanLast);
      const dobMatches =
        !cleanDob ||
        !matchedByPhone.date_of_birth ||
        String(matchedByPhone.date_of_birth).slice(0, 10) === cleanDob;

      if (pLast && iLast && pLast === iLast && dobMatches) {
        return matchedByPhone;
      }

      // Check if email matches
      if (
        cleanEmail &&
        matchedByPhone.email &&
        cleanEmail === matchedByPhone.email.toLowerCase()
      ) {
        return matchedByPhone;
      }

      // If DOB matches exactly, this is almost certainly the same individual
      if (
        cleanDob &&
        matchedByPhone.date_of_birth &&
        String(matchedByPhone.date_of_birth).slice(0, 10) === cleanDob
      ) {
        return matchedByPhone;
      }

      // Important fallback: Since `phone` is strictly UNIQUE in the DB schema,
      // if this phone is registered and neither DOB nor email conflicts,
      // return the existing patient rather than causing a database constraint crash.
      if (
        (!cleanDob ||
          !matchedByPhone.date_of_birth ||
          String(matchedByPhone.date_of_birth).slice(0, 10) === cleanDob) &&
        (!cleanEmail ||
          !matchedByPhone.email ||
          cleanEmail === matchedByPhone.email.toLowerCase())
      ) {
        return matchedByPhone;
      }
    }
  }

  // 3. Match by Name + Date of Birth (in case email and phone changed)
  if (cleanFirst && cleanLast && cleanDob) {
    const { data: candidates, error } = await supabase
      .from("patients")
      .select(patientSelect)
      .eq("date_of_birth", cleanDob);

    if (error) {
      console.error("Error searching patients by DOB:", error);
    } else if (candidates && candidates.length > 0) {
      const match = candidates.find((c) =>
        namesMatch(c.first_name, c.last_name, cleanFirst, cleanLast),
      );
      if (match) return match;
    }
  }

  return null;
}

export async function createPatient(patientData) {
  const { first_name, last_name, phone, email, date_of_birth, notes } =
    patientData;

  if (!first_name || !last_name || !phone) {
    throw new AppError("first_name, last_name and phone are required", 400);
  }

  const cleanFirst = first_name.trim();
  const cleanLast = last_name.trim();
  const cleanPhone = phone.trim();
  const normPhone = normalizePhone(cleanPhone);
  const finalPhone = normPhone || cleanPhone;
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanDob = date_of_birth
    ? String(date_of_birth).trim().slice(0, 10)
    : null;

  const existingPatient = await findExistingPatient({
    firstName: cleanFirst,
    lastName: cleanLast,
    email: cleanEmail,
    phone: finalPhone,
    dateOfBirth: cleanDob,
  });

  if (existingPatient) {
    const updates = {};

    if (cleanDob && !existingPatient.date_of_birth) {
      updates.date_of_birth = cleanDob;
    }

    if (cleanEmail && !existingPatient.email) {
      updates.email = cleanEmail;
    }

    // A patient can have different numbers.
    // If a new number is provided, update the primary contact phone
    // and preserve the previous number in notes.
    if (finalPhone && finalPhone !== existingPatient.phone) {
      const oldPhone = existingPatient.phone;
      const currentNotes = existingPatient.notes || "";
      const altTag =
        oldPhone && !currentNotes.includes(oldPhone)
          ? `Alt phone: ${oldPhone}`
          : null;

      const combinedNotes = [currentNotes, altTag].filter(Boolean).join(" | ");

      updates.phone = finalPhone;
      if (combinedNotes !== currentNotes) {
        updates.notes = combinedNotes;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { data: updatedPatient, error: updateError } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", existingPatient.id)
        .select(patientSelect)
        .single();

      if (!updateError && updatedPatient) {
        return {
          patient: updatedPatient,
          created: false,
        };
      }
      if (updateError) {
        console.warn("Could not update existing patient details:", updateError);
      }
    }

    return {
      patient: existingPatient,
      created: false,
    };
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: finalPhone,
      email: cleanEmail,
      date_of_birth: cleanDob,
      notes: notes ? notes.trim() : null,
    })
    .select(patientSelect)
    .single();

  if (error) {
    console.error("Supabase insert patient error:", error);

    // If duplicate phone violation occurs, recover gracefully by returning the existing record
    if (error.code === "23505") {
      const existing = await findPatientByPhone(finalPhone);
      if (existing) {
        return {
          patient: existing,
          created: false,
        };
      }
      throw new AppError(
        "A patient with this phone number or email already exists",
        409,
      );
    }

    throw new AppError(error.message || "Failed to create patient", 500);
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
    console.error("Supabase fetch patients error:", error);
    throw new AppError(error.message || "Failed to fetch patients", 500);
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
    console.error("Supabase fetch patient by ID error:", error);
    throw new AppError(error.message || "Failed to fetch patient", 500);
  }

  if (!data) {
    throw new AppError("Patient not found", 404);
  }

  return data;
}
