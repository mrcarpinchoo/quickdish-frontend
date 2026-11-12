import { ApiError } from "../api/client";

/** The text to show the user for any failed request. */
export function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  return "No se pudo conectar con la API.";
}
