import React, { useMemo, useState } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Schema
import * as beyXSchemas from "../../modules/schema";

// Rule-set combo engine (merge / worn / left-spin, etc. — fully data-driven,
// read straight from each part's `rule-set` entry in the values JSON).
import * as ruleConditions from "../../modules/rules/conditions";

// Blade attribute helpers (ratchet-integrated blades, spin direction).
import * as beyXUtilities from "../../modules/utilities";

// Play type (attack/balance/stamina/defense) icons.
import { getPlayTypeIcon } from "../../modules/playType";

// Components
import PartSearchSelect from "../PartSearchSelect/PartSearchSelect";
import PreBuildsModal from "../PreBuildsModal/PreBuildsModal";

// Styles
import styles from "./DeckEntryCard.module.scss";
import { generateClassesNames } from "styles/utilities";

const BUILD_TYPES = {
  simple: Object.keys(beyXSchemas.BEY_BUILD),
  cx: Object.keys(beyXSchemas.BEY_BUILD_CX),
};

/**
 * Collapses a part's raw `rule-set` rules into one row per distinct label
 * (e.g. bit "elevate" has two alternate combos both labelled "left" — one
 * per qualifying blade — which should render as a single badge).
 */
function summarizeRules(rules, partName, context) {
  const groups = new Map();

  rules.forEach((rule, ruleIndex) => {
    const isCombo = ruleConditions.isRuleCombo(rule);
    const satisfied = ruleConditions.isRuleSatisfied(
      rule,
      ruleIndex,
      partName,
      context,
    );
    const groupKey = `${isCombo ? "combo" : "toggle"}::${rule.label}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: rule.label,
        newValue: rule.newValue,
        isCombo,
        satisfied,
        toggleKey: !isCombo
          ? ruleConditions.getRuleToggleKey(partName, rule, ruleIndex)
          : undefined,
      });
    } else if (satisfied) {
      groups.get(groupKey).satisfied = true;
    }
  });

  return Array.from(groups.values());
}

/**
 * A single Beyblade build inside the deck.
 * Lets the user pick between a simple build or a CX build, then fill in
 * each part of the resulting schema through a searchable selector.
 *
 * This is shared across every tournament format — physical-part handling
 * (ratchet-integrated blades, spin badges, over-blade support, simple/CX
 * toggle, duplicate-part warning, play-type icons/badge below, pre-builds)
 * applies regardless of scoring system. Only `showValues` is point-buy
 * specific: pass false for formats that don't score by points, and
 * PartSearchSelect drops the value badges and point-tier filter bar
 * entirely (see components/PartSearchSelect).
 *
 * Any selected part that carries a "play type" (attack/balance/stamina/
 * defense — see modules/playType.js) shows its icon right under that
 * part's selector; the blade slot shows it alongside the spin badge in a
 * row. The build's own play-type badge (top-right, next to the entry
 * number) is determined by the bit's play type only, regardless of build
 * type — that's the deliberate rule, not a bug.
 *
 * If the current build's "source" part (the blade for simple builds, the
 * main-blade for CX builds) has a `builds` property in its catalog data
 * (see data/blades.json / data/main-blades.json), a "See pre builds" link
 * appears after every part selector, opening PreBuildsModal — picking one
 * of its combos calls `onApplyPreBuild` with the whole combo at once.
 *
 * Parts whose value depends on a rule-set combo get an extra row: a
 * checkbox for combos the player controls (e.g. "Worn"), or a read-only
 * badge for combos derived from another selected part (e.g. Bullet Griffon
 * + the "Merge" bit). This section naturally stays empty for rule sets
 * with no values (e.g. non-point-buy formats), no extra flag needed.
 */
/* eslint-disable-next-line no-unused-vars */
const DeckEntryCard = ({
  additionalstyles,
  entryIndex = 0,
  entry = {},
  entryType = "simple",
  ruleSet = undefined,
  hasDuplicate = false,
  toggles = {},
  showValues = true,
  onTypeChange = () => {},
  onPartChange = () => {},
  onToggleChange = () => {},
  onApplyPreBuild = () => {},
  ...props
}) => {
  const elements = [
    "root",
    "corner-tag",
    "entry-play-type-badge",
    "header",
    "eyebrow",
    "title",
    "type-toggle",
    "type-option",
    "active",
    "parts",
    "part",
    "blade-meta-row",
    "play-type-badge",
    "conditions",
    "condition-toggle",
    "condition-badge",
    "satisfied",
    "unsatisfied",
    "spin-badge",
    "spin-left",
    "spin-right",
    "pre-builds-link",
    "duplicate-warning",
    "handle",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("landing-page");

  const [showPreBuilds, setShowPreBuilds] = useState(false);

  const valuesSet = ruleSet?.deck?.values || {};
  const context = { buildEntry: entry, toggles };

  const bladeSpin = beyXUtilities.getBladeSpin(entry.blade);
  // The build's overall play-type is defined by the bit only, on purpose —
  // regardless of build type (simple or CX).
  const buildPlayType = beyXUtilities.getPartPlayType("bit", entry.bit);

  // The part that "defines" this build for pre-built combos — the blade
  // for simple builds, the main-blade for CX builds.
  const sourcePartType = entryType === "cx" ? "main-blade" : "blade";
  const sourcePartId = entry[sourcePartType];
  const sourcePartData = beyXUtilities.findPartData(
    sourcePartType,
    sourcePartId,
  );
  const hasPreBuilds = Boolean(
    sourcePartData?.builds &&
      ((sourcePartData.builds.popular?.length ?? 0) > 0 ||
        (sourcePartData.builds.family?.length ?? 0) > 0),
  );

  const visibleFields = useMemo(
    () => beyXUtilities.getVisibleEntryFields(entryType, entry),
    [entryType, entry],
  );

  function renderPlayTypeBadge(playType, key) {
    return (
      <div className={classes_names["play-type-badge"]} key={key}>
        <img src={getPlayTypeIcon(playType)} alt={playType} />
        <span>{t(`play-type.${playType}`)}</span>
      </div>
    );
  }

  return (
    <div className={classes_names["root"]} {...props}>
      <span className={classes_names["corner-tag"]}>
        #{String(entryIndex + 1).padStart(2, "0")}
      </span>

      {buildPlayType && (
        <div className={classes_names["entry-play-type-badge"]}>
          <img src={getPlayTypeIcon(buildPlayType)} alt={buildPlayType} />
        </div>
      )}

      <div className={classes_names["header"]}>
        <div>
          <p className={classes_names["eyebrow"]}>{t("beyblade-label")}</p>
          <p className={classes_names["title"]}>
            {t("entry-title", { index: entryIndex + 1 })}
          </p>
        </div>
        <div className={classes_names["type-toggle"]}>
          {Object.keys(BUILD_TYPES).map((typeKey) => (
            <div
              key={`entry-${entryIndex}-type-${typeKey}`}
              className={`${classes_names["type-option"]} ${entryType === typeKey ? classes_names["active"] : ""}`}
              onClick={() => onTypeChange(entryIndex, typeKey)}
            >
              {t(`build-type.${typeKey}`)}
            </div>
          ))}
        </div>
      </div>

      <div className={classes_names["parts"]}>
        {visibleFields.map((partType) => {
          const selectedName = entry[partType];
          const rawRules = ruleConditions.getPartRules(
            valuesSet,
            partType,
            selectedName,
          );
          const rules = summarizeRules(rawRules, selectedName, context);
          const partPlayType = beyXUtilities.getPartPlayType(
            partType,
            selectedName,
          );

          return (
            <div
              className={classes_names["part"]}
              key={`entry-${entryIndex}-part-${partType}`}
            >
              <PartSearchSelect
                partType={partType}
                label={t(`parts.${partType}`)}
                selectedId={selectedName}
                valuesSet={valuesSet}
                context={context}
                showValues={showValues}
                onSelect={(partName) => {
                  return onPartChange(entryIndex, partType, partName);
                }}
              />

              {partType === "blade" ? (
                (bladeSpin || partPlayType) && (
                  <div className={classes_names["blade-meta-row"]}>
                    {bladeSpin && (
                      <div
                        className={`${classes_names["spin-badge"]} ${
                          bladeSpin === "left"
                            ? classes_names["spin-left"]
                            : classes_names["spin-right"]
                        }`}
                      >
                        <ion-icon name="sync-outline"></ion-icon>
                        <span>
                          {bladeSpin === "left"
                            ? t("spin.left")
                            : t("spin.right")}
                        </span>
                      </div>
                    )}
                    {partPlayType && renderPlayTypeBadge(partPlayType)}
                  </div>
                )
              ) : (
                partPlayType && renderPlayTypeBadge(partPlayType)
              )}

              {rules.length > 0 && (
                <div className={classes_names["conditions"]}>
                  {rules.map((rule) => {
                    if (!rule.isCombo) {
                      const checked = Boolean(toggles[rule.toggleKey]);

                      return (
                        <label
                          className={classes_names["condition-toggle"]}
                          key={`entry-${entryIndex}-${rule.key}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              onToggleChange(
                                entryIndex,
                                rule.toggleKey,
                                event.target.checked,
                              )
                            }
                          />
                          <span>
                            {rule.label} (+{rule.newValue})
                          </span>
                        </label>
                      );
                    }

                    return (
                      <div
                        className={`${classes_names["condition-badge"]} ${
                          rule.satisfied
                            ? classes_names["satisfied"]
                            : classes_names["unsatisfied"]
                        }`}
                        key={`entry-${entryIndex}-${rule.key}`}
                      >
                        <ion-icon
                          name={
                            rule.satisfied
                              ? "checkmark-circle-outline"
                              : "alert-circle-outline"
                          }
                        ></ion-icon>
                        <span>
                          {rule.label}
                          {rule.satisfied ? ` (+${rule.newValue})` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasPreBuilds && (
        <p
          className={classes_names["pre-builds-link"]}
          onClick={() => setShowPreBuilds(true)}
        >
          <ion-icon name="albums-outline"></ion-icon>
          {t("see-pre-builds")}
        </p>
      )}

      {hasDuplicate && (
        <p className={classes_names["duplicate-warning"]}>
          <ion-icon name="alert-circle-outline"></ion-icon>
          {t("duplicate-warning")}
        </p>
      )}

      <span className={classes_names["handle"]} />

      <PreBuildsModal
        open={showPreBuilds}
        entryType={entryType}
        sourcePartType={sourcePartType}
        sourcePartId={sourcePartId}
        onClose={() => setShowPreBuilds(false)}
        onApply={(combo) => {
          onApplyPreBuild(entryIndex, combo);
          setShowPreBuilds(false);
        }}
      />
    </div>
  );
};

export default DeckEntryCard;
