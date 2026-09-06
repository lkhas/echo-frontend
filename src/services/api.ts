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

  if (res.status === 401 && navigator.onLine) {
    // JWT has expired or is invalid.
    localStorage.removeItem("access_token");

    // Keep this: it enables offline field work later.
    // localStorage.removeItem("offline_access_granted"); // Do NOT do this.

    sessionStorage.setItem(
      "login_message",
      "Your session expired. Please log in to sync your saved offline data."
    );

    window.location.assign("/");
  }

  throw new Error(errorText);
}

  return res.json();
}
