import fs from "node:fs";
import path from "node:path";

export function createSubscriptionsStore({ filePath }) {
  function ensureDir() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function readAll() {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeAll(next) {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n");
  }

  function upsert(sub) {
    const current = readAll();
    const next = [...current.filter((x) => x?.endpoint !== sub.endpoint), sub];
    writeAll(next);
    return next;
  }

  function removeByEndpoint(endpoint) {
    const current = readAll();
    const next = current.filter((x) => x?.endpoint !== endpoint);
    writeAll(next);
    return next;
  }

  return {
    list: readAll,
    upsert,
    removeByEndpoint,
  };
}
