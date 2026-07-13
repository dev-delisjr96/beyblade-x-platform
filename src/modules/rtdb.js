import {
  subscribeToData,
  readData,
  createData,
  updateData,
} from "../services/firebase/rtdb";

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

/**
 * Duplicates a whole rule-set blob into a brand new date key under the
 * same club, so edits always happen on a fresh copy rather than mutating
 * a date that's already been played. Refuses to overwrite an existing
 * date unless `force` is passed.
 *
 * @returns {Promise<{ ok: boolean, alreadyExists: boolean }>}
 */
export async function duplicateRuleSetToDate(
  tournamentFormat,
  club,
  targetDate,
  ruleSetData,
  { force = false } = {},
) {
  const clubPath = `tournaments-formats/${tournamentFormat}/clubs/${club}`;
  console.log("targetDate", targetDate);

  if (!force) {
    const existing = await readRecord(`${clubPath}/${targetDate}`);
    console.log("existing", existing);
    if (existing && Object.keys(existing).length > 0)
      return { ok: false, alreadyExists: true };
  }

  await createData(clubPath, ruleSetData, targetDate);
  return { ok: true, alreadyExists: false };
}

/**
 * Replaces a single part type's value array within a rule set (e.g. just
 * `deck.values.blade`) without touching any of its siblings. Relies on
 * Firebase's multi-path `update()` support for slash-delimited keys.
 */
export async function updateRuleSetPartValues(
  tournamentFormat,
  club,
  date,
  partType,
  newArray,
) {
  await updateData(
    `tournaments-formats/${tournamentFormat}/clubs/${club}`,
    date,
    {
      [`deck/values/${partType}`]: newArray,
    },
  );
}

export { subscribeToData, readData };
