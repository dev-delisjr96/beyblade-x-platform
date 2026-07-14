import React, { useEffect, useMemo, useRef, useState } from "react";

import * as beyXSchemas from "../../modules/schema";
import * as beyXHandlers from "../../modules/handlers.js";
import * as beyXUtilities from "../../modules/utilities.js";
import * as saved_rules from "../../modules/rules/index.js";
import * as utilities from "../../utilities/index.js";

// RTDB
import { subscribeToData, subscribeToRecord } from "../../modules/rtdb";

// Screenshot saving
import * as beyXShare from "../../modules/share";

// Router
import { useNavigate, useParams } from "react-router-dom";

// Translation
import { useTranslation } from "react-i18next";

// Styles
import styles from "./DeckBuilderPage.module.scss";
import selectorDropdownStyles from "./SelectorDropdown.module.scss";
import { generateClassesNames } from "../../styles/utilities";
import Dropdown from "../../components/Dropdown/Dropdown.jsx";
import DeckEntryCard from "../../components/DeckEntryCard/DeckEntryCard.jsx";
import DeckSummaryModal from "../../components/DeckSummaryModal/DeckSummaryModal.jsx";

const INITIAL_ENTRIES_COUNT = 3;

function buildInitialDeck() {
  return {
    entries: Array.from({ length: INITIAL_ENTRIES_COUNT }, () => ({
      ...beyXSchemas.BEY_BUILD,
    })),
    totalValue: 0,
    sameParts: {},
  };
}

/**
 * The deck builder for a given tournament format. Rule sets are no longer
 * bundled statically — they live in Firebase RTDB under
 * `tournaments-formats/{tournament_format}` (see services/firebase/rtdb.js).
 *
 * Not every format works the same way:
 *  - Point-buy's part values differ per club/date, so its rule set lives
 *    at `tournaments-formats/point-buy/clubs/{club}/{date}` and this page
 *    shows Club + Date selectors to pick which one is active.
 *  - Formats that don't vary by club/date (e.g. "default", which only has
 *    deck limits — max entries, no duplicate parts) set
 *    `"usesClubDate": false` on their format record and keep a single
 *    rule set directly at `tournaments-formats/{format}/deck` instead —
 *    no club/date selectors are shown at all.
 *
 * `usesClubDate` defaults to true (existing/point-buy behavior) unless a
 * format explicitly opts out, so nothing breaks for formats that haven't
 * set the flag yet.
 */
/* eslint-disable-next-line no-unused-vars */
const DeckBuilderPage = ({ additionalstyles, ...props }) => {
  const elements = [
    "root",
    "glow-a",
    "glow-b",
    "header",
    "brand",
    "brand-badge",
    "brand-copy",
    "brand-eyebrow",
    "brand-title",
    "header-controls",
    "selector",
    "field-label",
    "parts-link",
    "entries-container",
    "deck-error",
    "empty-state",
    "footer",
    "footer-row",
    "footer-value",
    "footer-value-number",
    "footer-value-max",
    "progress-track",
    "progress-fill",
    "footer-actions",
    "confirm-button",
    "save-button",
    "spin-icon",
    "save-status",
    "success",
    "error",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );
  const navigate = useNavigate();
  const { tournament_format } = useParams();
  const { t } = useTranslation("landing-page");

  const [deck, setDeck] = useState(buildInitialDeck);
  const [entryTypes, setEntryTypes] = useState(
    Array.from({ length: INITIAL_ENTRIES_COUNT }, () => "simple"),
  );
  const [entryToggles, setEntryToggles] = useState(
    Array.from({ length: INITIAL_ENTRIES_COUNT }, () => ({})),
  );
  const [deckError, setDeckError] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const entriesRef = useRef(null);

  // The format's own record — { label, icon, description, usesClubDate,
  // clubs? (club/date formats), deck? (single-rule-set formats) }.
  const [formatRecord, setFormatRecord] = useState(null);

  useEffect(() => {
    if (!tournament_format) return undefined;

    const unsubscribe = subscribeToRecord(
      `tournaments-formats/${tournament_format}`,
      setFormatRecord,
    );
    return unsubscribe;
  }, [tournament_format]);

  const usesClubDate = formatRecord?.usesClubDate !== false;

  // Live tree of every club -> date -> rule-set blob, only fetched for
  // club/date formats. `subscribeToData` returns an array here since
  // `clubs` is a genuine list of club records:
  // [{ id: "dran-gladius", "2026-07-10": {...ruleSet} }, ...]
  const [rulesTree, setRulesTree] = useState(null);
  const [club, setClub] = useState(undefined);
  const [date, setDate] = useState(undefined);

  useEffect(() => {
    if (!tournament_format || !usesClubDate) {
      setRulesTree(null);
      return undefined;
    }

    const unsubscribe = subscribeToData(
      `tournaments-formats/${tournament_format}/clubs`,
      setRulesTree,
    );
    return unsubscribe;
  }, [tournament_format, usesClubDate]);

  const clubs = useMemo(
    () => (Array.isArray(rulesTree) ? rulesTree.map((entry) => entry.id) : []),
    [rulesTree],
  );

  const selectedClubEntry = useMemo(
    () => rulesTree?.find((entry) => entry.id === club),
    [rulesTree, club],
  );

  const dates = useMemo(
    () =>
      selectedClubEntry
        ? Object.keys(selectedClubEntry).filter((key) => key !== "id")
        : [],
    [selectedClubEntry],
  );

  // Keep the club/date selection valid as the RTDB data loads/changes —
  // default to the first available option, and fall back if the
  // currently selected one disappears. Only relevant for club/date formats.
  useEffect(() => {
    if (!usesClubDate) return undefined;

    if (clubs.length === 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setClub(undefined);
      return undefined;
    }
    if (!club || !clubs.includes(club)) {
      setClub(clubs[0]);
    }
    return undefined;
  }, [usesClubDate, clubs, club]);

  useEffect(() => {
    if (!usesClubDate) return undefined;

    if (dates.length === 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setDate(undefined);
      return undefined;
    }
    if (!date || !dates.includes(date)) {
      setDate(dates[0]);
    }
    return undefined;
  }, [usesClubDate, dates, date]);

  // The active rule set: per club/date for point-buy-style formats, or
  // the format's single fixed rule set otherwise. Memoized so it keeps a
  // stable reference across renders when nothing it depends on actually
  // changed — without this, the `{ deck: formatRecord.deck }` wrapper
  // below would be a brand-new object every render, which fed into a
  // `useEffect([ruleSetSelected])` and caused an infinite update loop.
  const ruleSetSelected = useMemo(() => {
    if (usesClubDate) {
      return date ? selectedClubEntry?.[date] : undefined;
    }
    return formatRecord?.deck ? { deck: formatRecord.deck } : undefined;
  }, [usesClubDate, date, selectedClubEntry, formatRecord]);

  function recalcDeck(entries, valuesSet, ruleSet, toggles = entryToggles) {
    const newTotal = beyXHandlers.calcDeckTotalValue(
      entries,
      valuesSet || {},
      toggles,
    );
    const sameParts = beyXHandlers.checkSameParts(entries);

    const newDeck = {
      entries,
      totalValue: newTotal,
      sameParts,
    };

    setDeck(newDeck);

    try {
      saved_rules.validateDeck(ruleSet, newDeck);
      setDeckError(null);
    } catch (err) {
      setDeckError(err);
    }
  }

  // Recalculate whenever the active rule set changes (club/date switch,
  // or the single fixed rule set loading in for non-club/date formats).
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    recalcDeck(deck.entries, ruleSetSelected?.deck?.values, ruleSetSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleSetSelected]);

  function handleTypeChange(entryIndex, newType) {
    const blankEntry =
      newType === "cx"
        ? { ...beyXSchemas.BEY_BUILD_CX }
        : { ...beyXSchemas.BEY_BUILD };

    const newEntries = utilities.replaceAtIndex(
      deck.entries,
      entryIndex,
      blankEntry,
    );

    setEntryTypes((prev) =>
      utilities.replaceAtIndex(prev, entryIndex, newType),
    );
    recalcDeck(newEntries, ruleSetSelected?.deck?.values, ruleSetSelected);
  }

  function handlePartChange(entryIndex, partType, partName) {
    let updatedEntry = {
      ...deck.entries[entryIndex],
      [partType]: partName,
    };

    // Ratchet-integrated blades (e.g. Bullet Griffon) have no separate
    // ratchet piece — drop any previously selected one so it stops scoring.
    if (
      partType === "blade" &&
      beyXUtilities.isRatchetIntegratedBlade(partName)
    ) {
      updatedEntry = { ...updatedEntry, ratchet: undefined };
    }

    // Main-blades without "withOverBlade" don't take an over-blade — drop
    // any previously selected one so it stops scoring/showing.
    if (
      partType === "main-blade" &&
      !beyXUtilities.mainBladeAllowsOverBlade(partName)
    ) {
      updatedEntry = { ...updatedEntry, "over-blade": undefined };
    }

    const newEntries = utilities.replaceAtIndex(
      deck.entries,
      entryIndex,
      updatedEntry,
    );

    recalcDeck(newEntries, ruleSetSelected?.deck?.values, ruleSetSelected);
  }

  function handleToggleChange(entryIndex, conditionKey, checked) {
    const newToggles = utilities.replaceAtIndex(entryToggles, entryIndex, {
      ...entryToggles[entryIndex],
      [conditionKey]: checked,
    });

    setEntryToggles(newToggles);
    recalcDeck(
      deck.entries,
      ruleSetSelected?.deck?.values,
      ruleSetSelected,
      newToggles,
    );
  }

  const duplicateEntryIndexes = new Set(
    Object.values(deck.sameParts).flatMap((occurrences) =>
      occurrences.map((occurrence) => occurrence.index),
    ),
  );

  const maxValue = ruleSetSelected?.deck?.limits?.maxValue;
  const progressPct = maxValue
    ? Math.min(100, Math.round((deck.totalValue / maxValue) * 100))
    : 0;
  const isOverCap = Boolean(maxValue) && deck.totalValue > maxValue;
  const isDeckComplete = beyXUtilities.isDeckComplete(entryTypes, deck.entries);
  const canConfirm = isDeckComplete && !deckError;
  const isReady = usesClubDate
    ? Boolean(club && date && ruleSetSelected)
    : Boolean(ruleSetSelected);
  // Point values (and the point-tier filter on every part selector) only
  // make sense for the point-buy format — other formats reuse the exact
  // same DeckEntryCard/PartSearchSelect for physical part selection, just
  // without any of that (see components/PartSearchSelect "showValues").
  const showValues = tournament_format === "point-buy";
  // "Check the part values" only makes sense for club/date formats — its
  // route needs a club + date in the URL.
  const canCheckPartValues = showValues && usesClubDate;

  async function handleSaveDeck() {
    if (!entriesRef.current || isSaving) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const blob = await beyXShare.captureElementAsDesktopPng(
        entriesRef.current,
        { backgroundColor: "#060a0c" },
      );

      beyXShare.downloadBlob(
        blob,
        `beyblade-x-deck-${tournament_format}.png`,
      );
      setSaveStatus({ type: "success", message: t("save-status.saved") });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Deck builder save failed:", err);
      setSaveStatus({ type: "error", message: t("save-status.error") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={classes_names["root"]}>
      <div className={classes_names["glow-a"]} />
      <div className={classes_names["glow-b"]} />

      <header className={classes_names["header"]}>
        <div className={classes_names["brand"]} onClick={() => navigate("/")}>
          <div className={classes_names["brand-badge"]}>
            <ion-icon name="disc-outline"></ion-icon>
          </div>
          <div className={classes_names["brand-copy"]}>
            <p className={classes_names["brand-eyebrow"]}>
              {utilities.normalizeString(tournament_format)}
            </p>
            <h1 className={classes_names["brand-title"]}>Deck Builder</h1>
          </div>
        </div>

        <div className={classes_names["header-controls"]}>
          {usesClubDate && (
            <>
              <div className={classes_names["selector"]}>
                <p className={classes_names["field-label"]}>
                  {t("club-label")}
                </p>
                <Dropdown
                  id="club-selector"
                  actualValue={{
                    value: club,
                    text: utilities.normalizeString(club || ""),
                  }}
                  additionalstyles={selectorDropdownStyles}
                  options={clubs.map((clubId) => ({
                    value: clubId,
                    text: utilities.normalizeString(clubId),
                  }))}
                  onChange={(newClub) => setClub(newClub.value)}
                />
              </div>

              <div className={classes_names["selector"]}>
                <p className={classes_names["field-label"]}>
                  {t("date-label")}
                </p>
                <Dropdown
                  id="date-selector"
                  actualValue={{ value: date, text: date || "" }}
                  additionalstyles={selectorDropdownStyles}
                  options={dates.map((dateId) => ({
                    value: dateId,
                    text: dateId,
                  }))}
                  onChange={(newDate) => setDate(newDate.value)}
                />
              </div>
            </>
          )}

          {canCheckPartValues && (
            <button
              type="button"
              className={classes_names["parts-link"]}
              disabled={!isReady}
              onClick={() =>
                navigate(
                  `/${tournament_format}/deck-builder/${club}/${date}/values`,
                )
              }
            >
              <ion-icon name="list-outline"></ion-icon>
              {t("check-part-values")}
            </button>
          )}
        </div>
      </header>

      {!isReady ? (
        <p className={classes_names["empty-state"]}>
          {t("no-rule-set-selected")}
        </p>
      ) : (
        <>
          <div className={classes_names["entries-container"]} ref={entriesRef}>
            {deck.entries.map((entry, index) => (
              <DeckEntryCard
                key={`deck-entry-${index}`}
                entryIndex={index}
                entry={entry}
                entryType={entryTypes[index]}
                ruleSet={ruleSetSelected}
                hasDuplicate={duplicateEntryIndexes.has(index)}
                toggles={entryToggles[index]}
                showValues={showValues}
                onTypeChange={handleTypeChange}
                onPartChange={handlePartChange}
                onToggleChange={handleToggleChange}
              />
            ))}
          </div>

          {deckError && (
            <div className={classes_names["deck-error"]}>
              <ion-icon name="warning-outline"></ion-icon>
              <p>
                {t(`errors.${deckError.message}`, {
                  defaultValue: deckError.message,
                })}
              </p>
            </div>
          )}

          <footer className={classes_names["footer"]}>
            {showValues && (
              <>
                <div className={classes_names["footer-row"]}>
                  <p className={classes_names["field-label"]}>
                    {t("total-value")}
                  </p>
                  <p className={classes_names["footer-value"]}>
                    <span className={classes_names["footer-value-number"]}>
                      {deck.totalValue}
                    </span>
                    {maxValue ? (
                      <span className={classes_names["footer-value-max"]}>
                        {" "}
                        / {maxValue}
                      </span>
                    ) : null}
                  </p>
                </div>

                {maxValue ? (
                  <div className={classes_names["progress-track"]}>
                    <div
                      className={classes_names["progress-fill"]}
                      data-over={isOverCap}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                ) : null}
              </>
            )}

            <div className={classes_names["footer-actions"]}>
              <button
                type="button"
                className={classes_names["confirm-button"]}
                disabled={!canConfirm}
                onClick={() => setIsSummaryOpen(true)}
              >
                <ion-icon name="checkmark-done-outline"></ion-icon>
                {t("confirm-button")}
              </button>

              {canConfirm && (
                <button
                  type="button"
                  className={classes_names["save-button"]}
                  onClick={handleSaveDeck}
                  disabled={isSaving}
                >
                  <ion-icon
                    name={isSaving ? "sync-outline" : "download-outline"}
                    className={isSaving ? classes_names["spin-icon"] : ""}
                  ></ion-icon>
                  {isSaving ? t("saving") : t("save-button")}
                </button>
              )}
            </div>

            {saveStatus && (
              <div
                className={`${classes_names["save-status"]} ${classes_names[saveStatus.type]}`}
              >
                <p>{saveStatus.message}</p>
              </div>
            )}
          </footer>

          <DeckSummaryModal
            open={isSummaryOpen}
            entries={deck.entries}
            entryTypes={entryTypes}
            ruleSet={ruleSetSelected}
            toggles={entryToggles}
            totalValue={deck.totalValue}
            showValues={showValues}
            onClose={() => setIsSummaryOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default DeckBuilderPage;
