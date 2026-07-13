import { subscribeToData, readData } from "../services/firebase/rtdb";

/**
 * Thin app-level wrappers around services/firebase/rtdb.js.
 *
 * `subscribeToData`'s generic "is this a list of sibling records?"
 * heuristic (see that file) works great for genuine collections (a bunch
 * of clubs, a bunch of dates) but mis-detects a single-key leaf record
 * like a rule-set blob — `{ deck: { limits, values } }` — as a list, and
 * wraps it as `[{ id: "deck", limits, values }]`. `subscribeToRecord` /
 * `readRecord` undo that specific wrapping so callers just get the plain
 * object back.
 */
function normalizeRecordPayload(payload) {
  if (!Array.isArray(payload)) return payload;
  if (payload.length === 0) return null;

  const [first] = payload;
  const { id, ...rest } = first;
  return { [id]: rest };
}

/** Realtime subscription to a single record (not a list) at `path`. */
export function subscribeToRecord(path, callback, onError) {
  return subscribeToData(
    path,
    (payload) => callback(normalizeRecordPayload(payload)),
    onError,
  );
}

/** One-time read of a single record (not a list) at `path`. */
export async function readRecord(path) {
  const payload = await readData(path);
  return normalizeRecordPayload(payload);
}

export { subscribeToData, readData };
