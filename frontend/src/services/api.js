// Robust API URL detection supporting VITE_API_URL and VITE_API_BASE_URL,
// with automatic normalization (stripping accidental trailing slashes and ensuring /api suffix)
const rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const cleanBase = rawBase.trim().replace(/\/+$/, "");
const API_BASE_URL = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

const STAFF_KEY =
  import.meta.env.VITE_STAFF_KEY || "brightsmile-staff-demo-key";

export async function apiRequest(path, options = {}) {
  // Ensure path starts with a slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${cleanPath}`, {
    headers: {
      "Content-Type": "application/json",
      "x-staff-key": STAFF_KEY,
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && data.error
        ? data.error.message
        : (data && data.message) ||
            "Something went wrong while contacting the server",
    );
  }

  return data;
}
