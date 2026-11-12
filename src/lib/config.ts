/**
 * Build-time settings. Vite inlines each VITE_ variable when it builds, so
 * Dev and Prod builds each carry their own values.
 */
export function appConfig() {
  return {
    apiUrl: import.meta.env.VITE_API_URL,
    environment: import.meta.env.VITE_ENV,
    version: import.meta.env.VITE_VERSION
  };
}
