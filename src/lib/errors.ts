import { ApiError } from "../api/client";

/** The text to show the user for any failed request. */
export function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  return "Could not reach the API.";
}
