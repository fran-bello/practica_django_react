const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getAuthHeaders(token) {
  if (!token) return {};
  return { Authorization: `Token ${token}` };
}

export function getApiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}
