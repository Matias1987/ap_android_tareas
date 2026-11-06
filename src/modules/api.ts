const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL || "https://9nm35htv-3000.brs.devtunnels.ms/";

// Normalize the base URL so requests never become `//auth/login` or `//users`.
export const API_URL = configuredApiUrl.trim().replace(/\/+$/, "");

export const API_HEADERS: Record<string, string> = API_URL.includes(".devtunnels.ms")
  ? { "X-Tunnel-Skip-AntiPhishing-Page": "true" }
  : {};
