/**
 * Returns the base URL for API calls without credentials.
 * Browsers block fetch() when the page URL contains credentials (user:pass@host).
 * This strips them out so client-side requests work correctly.
 */
export function getApiBase(): string {
  if (typeof window === "undefined") return "";
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}
