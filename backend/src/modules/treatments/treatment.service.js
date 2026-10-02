import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

export async function findTreatments() {
  const { data, error } = await supabase
    .from("treatments")
    .select(
      `
      id,
      name,
      slug,
      description,
      price_type,
      price_min,
      price_max,
      duration_minutes,
      deposit_amount,
      display_order,
      active,
      category:treatment_categories (
        id,
        name,
        slug
      )
    `,
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new AppError("Failed to fetch treatments", 500);
  }

  return data;
}

export async function findTreatmentById(id) {
  const { data, error } = await supabase
    .from("treatments")
    .select(
      `
      id,
      name,
      slug,
      description,
      price_type,
      price_min,
      price_max,
      duration_minutes,
      deposit_amount,
      display_order,
      active,
      category:treatment_categories (
        id,
        name,
        slug
      )
    `,
    )
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to fetch treatment", 500);
  }

  if (!data) {
    throw new AppError("Treatment not found", 404);
  }

  return data;
}
