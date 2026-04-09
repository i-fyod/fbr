import path from "node:path";
import { fileURLToPath } from "node:url";

export function getDirname(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  return path.dirname(__filename);
}
