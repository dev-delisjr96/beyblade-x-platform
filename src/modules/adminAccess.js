/**
 * Very lightweight "admin mode" gate for the rule-values editing feature.
 *
 * This is intentionally NOT real authentication — no Firebase Auth, no
 * server-side check. It's a single shared password (kept in the .env
 * file, never committed) compared client-side, exactly as requested.
 * That means it's really only a speed bump (anyone who opens devtools can
 * read VITE_ADMIN_PASSWORD out of the built bundle) — fine for keeping
 * casual visitors from fat-fingering values, not a real security boundary.
 * Don't put anything sensitive behind it.
 *
 * Session persists in sessionStorage so switching between the by-point /
 * by-part views or reloading the tab doesn't re-prompt.
 */

const SESSION_KEY = "beyx-admin-session";

export function checkAdminPassword(password) {
  const expected = import.meta.env?.VITE_ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export function isAdminSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAdminSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, "true");
  } catch {
    // sessionStorage unavailable (e.g. private mode) — admin mode just
    // won't persist across reloads, which is an acceptable degradation.
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

// --- Which club/date is currently "unlocked" for editing -------------------
//
// Editing always happens on a fresh duplicate of a date's values (see
// DuplicateDateModal) rather than mutating history in place, so "edit
// mode" is scoped to one specific { tournamentFormat, club, date } at a
// time. Remembering it in sessionStorage means navigating away and back
// (or reloading) keeps the edit controls visible for that same date.

const EDIT_TARGET_KEY = "beyx-admin-edit-target";

export function getEditingTarget() {
  try {
    const raw = sessionStorage.getItem(EDIT_TARGET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setEditingTarget(tournamentFormat, club, date) {
  try {
    sessionStorage.setItem(
      EDIT_TARGET_KEY,
      JSON.stringify({ tournamentFormat, club, date }),
    );
  } catch {
    /* noop */
  }
}

export function isEditingTarget(tournamentFormat, club, date) {
  const target = getEditingTarget();
  return Boolean(
    target &&
      target.tournamentFormat === tournamentFormat &&
      target.club === club &&
      target.date === date,
  );
}

export function clearEditingTarget() {
  try {
    sessionStorage.removeItem(EDIT_TARGET_KEY);
  } catch {
    /* noop */
  }
}

/** Logs the admin all the way out: clears both the password session and
 * whichever date was unlocked for editing. Next "Edit" click starts fresh
 * from the password prompt. */
export function blockEditAccess() {
  clearAdminSession();
  clearEditingTarget();
}
