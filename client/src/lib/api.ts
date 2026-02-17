/**
 * @file HTTP client module that wraps the Fetch API.
 * Automatically attaches authentication headers from localStorage,
 * handles 401 responses by redirecting to the login page, and
 * provides typed convenience methods for common HTTP verbs.
 */

import { queryClient } from "./queryClient";

const API_BASE = "";

/**
 * Sends an HTTP request with automatic auth header injection.
 * Reads the user-id from localStorage and attaches it as a request header.
 * On a 401 response, clears stored credentials and redirects to /login.
 * Parses the JSON response body and returns it as the specified type.
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const userId = localStorage.getItem("ooh_user_id");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(userId ? { "user-id": userId } : {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (res.status === 401) {
    localStorage.removeItem("ooh_user_id");
    localStorage.removeItem("ooh_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Convenience methods for GET, POST, PATCH, and DELETE requests. */
export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
