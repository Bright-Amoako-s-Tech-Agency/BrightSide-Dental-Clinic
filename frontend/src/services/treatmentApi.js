import { apiRequest } from "./api";

export async function getTreatments() {
    const result = await apiRequest("/treatments");
    return result.data;
}