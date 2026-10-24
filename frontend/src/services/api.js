const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const STAFF_KEY =
  import.meta.env.VITE_STAFF_KEY || "brightsmile-staff-demo-key";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
