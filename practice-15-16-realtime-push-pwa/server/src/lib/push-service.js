export function createPushService({ webpush, vapidKeys, subject, store }) {
  const isEnabled = Boolean(vapidKeys?.publicKey && vapidKeys?.privateKey);

  if (isEnabled) {
    webpush.setVapidDetails(subject, vapidKeys.publicKey, vapidKeys.privateKey);
  }

  async function sendToAll(payload) {
    if (!isEnabled) return { ok: false, error: "Push disabled: missing VAPID keys" };

    const subs = store.list();
    const json = JSON.stringify(payload);

    const results = await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, json);
          return { ok: true, endpoint: sub.endpoint };
        } catch (error) {
          const statusCode = error?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            store.removeByEndpoint(sub.endpoint);
          }
          return { ok: false, endpoint: sub.endpoint, statusCode: statusCode || 0 };
        }
      })
    );

    return { ok: true, results };
  }

  return {
    isEnabled,
    sendToAll,
  };
}
