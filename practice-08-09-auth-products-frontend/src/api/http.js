import axios from "axios";
import { clearTokens, getTokens, setTokens } from "../auth/storage";

const API_BASE = "http://localhost:4100";

function base64UrlToBase64(s) {
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const b64 = base64UrlToBase64(parts[1]);
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(accessToken, skewSeconds = 2) {
  const payload = decodeJwtPayload(accessToken);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
}

let refreshInFlight = null;

async function refreshTokens() {
  if (refreshInFlight) return refreshInFlight;

  const { refreshToken } = getTokens();
  if (!refreshToken) {
    clearTokens();
    throw new Error("No refresh token");
  }

  refreshInFlight = axios
    .post(`${API_BASE}/api/auth/refresh`, null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    })
    .then((r) => {
      setTokens(r.data);
      return r.data;
    })
    .catch((e) => {
      clearTokens();
      throw e;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

http.interceptors.request.use(async (config) => {
  const { accessToken, refreshToken } = getTokens();
  if (!accessToken) return config;

  // Proactively refresh if access token is expired / about to expire
  if (refreshToken && shouldRefreshAccessToken(accessToken)) {
    try {
      const nextTokens = await refreshTokens();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${nextTokens.accessToken}`;
      return config;
    } catch {
      // fall through - request will likely fail with 401
    }
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;
    const url = original?.url || "";

    if (!original || status !== 401 || original.__isRetry) {
      return Promise.reject(error);
    }

    if (
      url.startsWith("/api/auth/login") ||
      url.startsWith("/api/auth/register") ||
      url.startsWith("/api/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    try {
      original.__isRetry = true;

      const refreshed = await refreshTokens();

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
      return http.request(original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);
