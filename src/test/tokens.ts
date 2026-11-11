function base64Url(value: unknown) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Builds an unsigned JWT-shaped token. The app only reads its payload. */
export function makeToken(payload: Record<string, unknown>) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url({ exp, ...payload })}.signature`;
}
