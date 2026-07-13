import React, { useState } from "react";

import * as beyXSchemas from "../../modules/schema";
import * as beyXHandlers from "../../modules/handlers.js";
import * as beyXUtilities from "../../modules/utilities.js";
import * as saved_rules from "../../modules/rules/index.js";
import * as utilities from "../../utilities/index.js";

// Router
import { useNavigate } from "react-router-dom";

// Translation
import { useTranslation } from "react-i18next";

// Styles
import styles from "./LandingPage.module.scss";
import ruleDropdownStyles from "./RuleSetDropdown.module.scss";
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

/* eslint-disable-next-line no-unused-vars */
const LandingPage = ({ additionalstyles, ...props }) => {
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
    "rule-select",
    "field-label",
    "parts-link",
    "entries-container",
    "deck-error",
    "footer",
    "footer-row",
    "footer-value",
    "footer-value-number",
    "footer-value-max",
    "progress-track",
    "progress-fill",
    "footer-actions",
    "confirm-button",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );
  const navigate = useNavigate();
  const { t } = useTranslation("landing-page");

  const [deck, setDeck] = useState(buildInitialDeck);
  const [entryTypes, setEntryTypes] = useState(
    Array.from({ length: INITIAL_ENTRIES_COUNT }, () => "simple"),
  );
  const [entryToggles, setEntryToggles] = useState(
    Array.from({ length: INITIAL_ENTRIES_COUNT }, () => ({})),
  );
  const [rules, setRules] = useState({ value: "ibna", text: "ibna" });
  const [ruleSetSelected, setRuleSet] = useState(
    saved_rules.RULE_SETS_STORED["ibna"],
  );
  const [deckError, setDeckError] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  function recalcDeck(entries, valuesSet, ruleKey, toggles = entryToggles) {
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
      saved_rules.validateDeck(ruleKey, newDeck);
      setDeckError(null);
    } catch (err) {
      setDeckError(err);
    }
  }

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
    recalcDeck(newEntries, ruleSetSelected?.deck?.values, rules.value);
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

    recalcDeck(newEntries, ruleSetSelected?.deck?.values, rules.value);
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
      rules.value,
      newToggles,
    );
  }

  const duplicateEntryIndexes = new Set(
    Object.values(deck.sameParts).flatMap((occurrences) =>
      occurrences.map((occurrence) => occurrence.index),
    ),
  );

  const maxValue = ruleSetSelected?.deck?.limits?.deck?.maxValue;
  const progressPct = maxValue
    ? Math.min(100, Math.round((deck.totalValue / maxValue) * 100))
    : 0;
  const isOverCap = Boolean(maxValue) && deck.totalValue > maxValue;
  const isDeckComplete = beyXUtilities.isDeckComplete(entryTypes, deck.entries);
  const canConfirm = isDeckComplete && !deckError;

  return (
    <div className={classes_names["root"]}>
      <div className={classes_names["glow-a"]} />
      <div className={classes_names["glow-b"]} />

      <header className={classes_names["header"]}>
        <div className={classes_names["brand"]}>
          <div className={classes_names["brand-badge"]}>
            <ion-icon name="disc-outline"></ion-icon>
          </div>
          <div className={classes_names["brand-copy"]}>
            <p className={classes_names["brand-eyebrow"]}>Beyblade X</p>
            <h1 className={classes_names["brand-title"]}>Deck Builder</h1>
          </div>
        </div>

        <div className={classes_names["header-controls"]}>
          <div className={classes_names["rule-select"]}>
            <p className={classes_names["field-label"]}>
              {t("rule-set-label")}
            </p>
            <Dropdown
              id="rules-selector"
              actualValue={rules}
              additionalstyles={ruleDropdownStyles}
              options={Object.entries(saved_rules.RULE_SETS_STORED).map(
                function ([
                  ruleName,
                  /* eslint-disable-next-line no-unused-vars */
                  ruleSet,
                ]) {
                  return {
                    value: ruleName,
                    text: utilities.normalizeString(ruleName),
                  };
                },
              )}
              onChange={(newRule) => {
                setRules(newRule);
                const newRuleSet = saved_rules.RULE_SETS_STORED[newRule.value];
                setRuleSet(newRuleSet);
                recalcDeck(
                  deck.entries,
                  newRuleSet?.deck?.values,
                  newRule.value,
                );
              }}
            />
          </div>

          <button
            type="button"
            className={classes_names["parts-link"]}
            onClick={() => navigate(`/rules/${rules.value}/values`)}
          >
            <ion-icon name="list-outline"></ion-icon>
            {t("check-part-values")}
          </button>
        </div>
      </header>

      <div className={classes_names["entries-container"]}>
        {deck.entries.map((entry, index) => (
          <DeckEntryCard
            key={`deck-entry-${index}`}
            entryIndex={index}
            entry={entry}
            entryType={entryTypes[index]}
            ruleSet={ruleSetSelected}
            hasDuplicate={duplicateEntryIndexes.has(index)}
            toggles={entryToggles[index]}
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
        <div className={classes_names["footer-row"]}>
          <p className={classes_names["field-label"]}>{t("total-value")}</p>
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
        </div>
      </footer>

      <DeckSummaryModal
        open={isSummaryOpen}
        entries={deck.entries}
        entryTypes={entryTypes}
        ruleSet={ruleSetSelected}
        toggles={entryToggles}
        totalValue={deck.totalValue}
        onClose={() => setIsSummaryOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
