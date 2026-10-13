import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/AppError.js";

export async function findTreatments({ includeInactive = false } = {}) {
    let query = supabase
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
        .order("display_order", { ascending: true });

    if (!includeInactive) {
        query = query.eq("active", true);
    }

    const { data, error } = await query;

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

function slugify(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function validateTreatment(input, partial = false) {
    const errors = [];

    const requiredFields = [
        "category_id",
        "name",
        "price_type",
        "price_min",
        "duration_minutes",
    ];

    if (!partial) {
        for (const field of requiredFields) {
            if (
                input[field] === undefined ||
                input[field] === null ||
                input[field] === ""
            ) {
                errors.push(`${field} is required`);
            }
        }
    }

    if (input.name !== undefined) {
        if (typeof input.name !== "string" || !input.name.trim()) {
            errors.push("Name must be a non-empty string");
        }
    }

    if (
        input.category_id !== undefined &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            input.category_id,
        )
    ) {
        errors.push("A valid category_id is required");
    }

    if (
        input.price_type !== undefined &&
        !["fixed", "from", "range"].includes(input.price_type)
    ) {
        errors.push("price_type must be fixed, from, or range");
    }

    for (const field of["price_min", "price_max", "deposit_amount"]) {
        if (
            input[field] !== undefined &&
            input[field] !== null &&
            (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0)
        ) {
            errors.push(`${field} must be a non-negative number`);
        }
    }

    if (
        input.duration_minutes !== undefined &&
        (!Number.isInteger(Number(input.duration_minutes)) ||
            Number(input.duration_minutes) <= 0)
    ) {
        errors.push("duration_minutes must be a positive integer");
    }

    if (
        input.display_order !== undefined &&
        (!Number.isInteger(Number(input.display_order)) ||
            Number(input.display_order) < 0)
    ) {
        errors.push("display_order must be a non-negative integer");
    }

    if (input.active !== undefined && typeof input.active !== "boolean") {
        errors.push("active must be a boolean");
    }

    if (
        input.description !== undefined &&
        input.description !== null &&
        typeof input.description !== "string"
    ) {
        errors.push("description must be a string or null");
    }

    if (errors.length) {
        throw new AppError(errors.join("; "), 400);
    }
}

const treatmentFields = [
    "category_id",
    "name",
    "slug",
    "description",
    "price_type",
    "price_min",
    "price_max",
    "duration_minutes",
    "deposit_amount",
    "display_order",
    "active",
];

function pickTreatmentFields(input) {
    return Object.fromEntries(
        treatmentFields
        .filter((field) => input[field] !== undefined)
        .map((field) => [field, input[field]]),
    );
}

function normalizeTreatment(input) {
    const payload = pickTreatmentFields(input);

    if (payload.name !== undefined) {
        payload.name = payload.name.trim();
    }

    if (payload.slug !== undefined) {
        payload.slug = slugify(payload.slug);
    } else if (payload.name !== undefined) {
        payload.slug = slugify(payload.name);
    }

    if (payload.description !== undefined && payload.description === "") {
        payload.description = null;
    }

    for (const field of["price_min", "price_max", "deposit_amount"]) {
        if (payload[field] !== undefined && payload[field] !== null) {
            payload[field] = Number(payload[field]);
        }
    }

    for (const field of["duration_minutes", "display_order"]) {
        if (payload[field] !== undefined) {
            payload[field] = Number(payload[field]);
        }
    }

    if (payload.price_type === "fixed") {
        payload.price_max = payload.price_min;
    }

    if (payload.price_type === "from") {
        payload.price_max = null;
    }

    return payload;
}

function validatePricing(treatment) {
    const { price_type, price_min, price_max, deposit_amount } = treatment;

    if (price_type === "fixed" && price_max != null && price_max !== price_min) {
        throw new AppError(
            "For fixed pricing, price_max must equal price_min",
            400,
        );
    }

    if (price_type === "from" && price_max != null) {
        throw new AppError("For from pricing, price_max must be null", 400);
    }

    if (price_type === "range" && (price_max == null || price_max < price_min)) {
        throw new AppError(
            "Range pricing requires price_max greater than or equal to price_min",
            400,
        );
    }

    if (deposit_amount > price_min) {
        throw new AppError("deposit_amount cannot exceed price_min", 400);
    }
}

async function validateCategory(categoryId) {
    const { data, error } = await supabase
        .from("treatment_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("active", true)
        .maybeSingle();

    if (error) {
        throw new AppError("Failed to validate treatment category", 500);
    }

    if (!data) {
        throw new AppError("Treatment category not found or inactive", 400);
    }
}

function handleWriteError(error) {
    if (error.code === "23505") {
        throw new AppError("A treatment with this slug already exists", 409);
    }

    if (error.code === "23503") {
        throw new AppError("The selected treatment category is invalid", 400);
    }

    throw new AppError("Failed to save treatment", 500);
}

export async function createTreatment(input) {
    validateTreatment(input);

    const payload = normalizeTreatment(input);

    if (!payload.slug) {
        throw new AppError("A valid treatment name or slug is required", 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
        throw new AppError(
            "slug must contain only lowercase letters, numbers, and hyphens",
            400,
        );
    }

    if (payload.deposit_amount === undefined || payload.deposit_amount === null) {
        payload.deposit_amount = 0;
    }

    if (payload.display_order === undefined || payload.display_order === null) {
        payload.display_order = 0;
    }

    if (payload.active === undefined || payload.active === null) {
        payload.active = true;
    }

    if (payload.description === undefined || payload.description === null) {
        payload.description = null;
    }

    validatePricing(payload);
    await validateCategory(payload.category_id);

    const { data, error } = await supabase
        .from("treatments")
        .insert(payload)
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
        .single();

    if (error) handleWriteError(error);

    return data;
}

export async function updateTreatment(id, input) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
        )) {
        throw new AppError("Invalid treatment ID", 400);
    }

    const suppliedFields = pickTreatmentFields(input);

    if (Object.keys(suppliedFields).length === 0) {
        throw new AppError("Provide at least one treatment field to update", 400);
    }

    const { data: existing, error: fetchError } = await supabase
        .from("treatments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
        throw new AppError("Failed to fetch treatment for update", 500);
    }

    if (!existing) {
        throw new AppError("Treatment not found", 404);
    }

    validateTreatment(suppliedFields, true);

    const payload = normalizeTreatment(suppliedFields);
    const merged = {...existing, ...payload };

    if (!payload.slug && payload.name !== undefined) {
        payload.slug = slugify(payload.name);
    }

    if (payload.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
        throw new AppError(
            "slug must contain only lowercase letters, numbers, and hyphens",
            400,
        );
    }

    validatePricing(merged);

    if (payload.category_id) {
        await validateCategory(payload.category_id);
    }

    const { data, error } = await supabase
        .from("treatments")
        .update(payload)
        .eq("id", id)
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
        .single();

    if (error) handleWriteError(error);

    return data;
}