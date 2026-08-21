import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  let token: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
        localStorage.setItem("momentum_token", token);
      } else {
        token = localStorage.getItem("momentum_token");
      }
    } catch {
      token = localStorage.getItem("momentum_token");
    }
  }

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
        localStorage.removeItem("momentum_token");
        await supabase.auth.signOut().catch(() => {});
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

    return response.json();
  } catch (error: any) {
    if (error.name === "TypeError" && error.message?.includes("fetch")) {
      throw new Error("Unable to connect to the backend server. Please check your connection.");
    }
    throw error;
  }
}

