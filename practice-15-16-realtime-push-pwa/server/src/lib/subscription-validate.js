export function validatePushSubscription(value) {
  const endpoint = value?.endpoint;
  const p256dh = value?.keys?.p256dh;
  const auth = value?.keys?.auth;

  if (typeof endpoint !== "string" || !endpoint) {
    return { ok: false, error: "Invalid subscription: endpoint is required" };
  }
  if (typeof p256dh !== "string" || !p256dh) {
    return { ok: false, error: "Invalid subscription: keys.p256dh is required" };
  }
  if (typeof auth !== "string" || !auth) {
    return { ok: false, error: "Invalid subscription: keys.auth is required" };
  }
  return { ok: true, data: { endpoint, keys: { p256dh, auth } } };
}
