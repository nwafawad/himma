import { authClient } from "@/lib/authClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = typeof window !== "undefined" ? authClient.getToken() : null;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        authClient.clearSession();
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth")) {
          window.location.href = "/login";
        }
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || "Unauthorized access. Session expired.");
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `API Request failed with status ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Unable to connect to the backend server. Please check your connection.");
    }
    throw error;
  }
}
