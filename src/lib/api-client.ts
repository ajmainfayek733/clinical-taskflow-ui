import { setTokens, clearTokens } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type RequestOptions = RequestInit & {
  token?: string | null;
  _retry?: boolean;
};

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, _retry, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (response.status === 401 && !_retry) {
    // Attempt token refresh
    const refreshToken = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.access;
          const newRefreshToken = data.refresh || refreshToken;

          // Update localstorage tokens and notify listeners
          setTokens(newAccessToken, newRefreshToken);

          // Retry the original request
          return apiClient(path, {
            ...options,
            token: newAccessToken,
            _retry: true,
          });
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }

    // If refresh failed or there is no refresh token, log out the user
    clearTokens();
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
