const API_BASE = "/api";

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,                  // spread options FIRST
    credentials: "include",
    headers: mergedHeaders,      // then override headers safely
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API ERROR STATUS:", res.status);
    console.error("API ERROR BODY:", errorText);
    throw new Error(errorText);
  }

  return res.json();
}
