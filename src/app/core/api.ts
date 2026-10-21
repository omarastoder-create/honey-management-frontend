// Single place for the backend address. Change it here when the backend moves.
export const API_BASE_URL = 'http://localhost:8080';

/** Builds a REST endpoint URL, e.g. apiUrl('customers') -> http://localhost:8080/api/v1/customers */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/api/v1/${path}`;
}

/** Turns a path returned by the backend (e.g. /images/x.jpg) into a loadable URL. */
export function fileUrl(path: string | null | undefined): string | null {
  return path ? `${API_BASE_URL}${path}` : null;
}
