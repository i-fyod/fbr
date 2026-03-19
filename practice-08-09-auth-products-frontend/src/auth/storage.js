const KEY = "p89.tokens";

export function getTokens() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.accessToken || null,
      refreshToken: parsed?.refreshToken || null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export function setTokens(tokens) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  );
}

export function clearTokens() {
  localStorage.removeItem(KEY);
}

export function isAuthed() {
  const { accessToken } = getTokens();
  return Boolean(accessToken);
}
