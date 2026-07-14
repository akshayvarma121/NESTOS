import { supabase } from "./supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API Error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  // FR-10.1 Milestone Detection
  if (data && data.milestone_reached) {
    window.dispatchEvent(new CustomEvent("milestone_reached"));
  }

  return data;
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  post: (endpoint: string, body?: any) =>
    fetchWithAuth(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (endpoint: string, body?: any) =>
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (endpoint: string, body?: any) =>
    fetchWithAuth(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (endpoint: string) =>
    fetchWithAuth(endpoint, {
      method: "DELETE",
    }),
};
