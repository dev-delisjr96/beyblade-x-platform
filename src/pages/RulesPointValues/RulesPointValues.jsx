import React, { useMemo, useState } from "react";

// Router
import { useNavigate, useParams } from "react-router-dom";

// Translation
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// Rules
import * as saved_rules from "../../modules/rules/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";
import * as utilities from "../../utilities/index";

// Styles
import styles from "./RulesPointValues.module.scss";
import { generateClassesNames } from "styles/utilities";

const VIEW_MODES = ["point", "part"];

/**
 * Reference "point list" for a rule set: every part that's worth points
 * (0-value parts are skipped), grouped either by point value or by part
 * type, each shown as an image + name chip. Parts with a rule-set combo
 * bonus (see modules/rules/conditions.js) get an extra chip in whichever
 * value group that bonus is worth, tagged with the bonus's label.
 */
/* eslint-disable-next-line no-unused-vars */
const RulesPointValues = ({ additionalstyles, ...props }) => {
  const elements = [
    "root",
    "glow-a",
    "glow-b",
    "header",
    "back-link",
    "title-group",
    "eyebrow",
    "title",
    "view-toggle",
    "view-option",
    "active",
    "content",
    "value-section",
    "value-header",
    "value-badge",
    "value-chips",
    "part-section",
    "part-heading",
    "chip",
    "chip-frame",
    "chip-img",
    "chip-name",
    "chip-label",
    "empty-state",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const navigate = useNavigate();
  const { rule_name } = useParams();
  const { t } = useTranslation("rules-point-values");

  const [viewMode, setViewMode] = useState("point");

  const ruleSet = saved_rules.RULE_SETS_STORED[rule_name];
  const valuesSet = ruleSet?.deck?.values || {};

  const entries = useMemo(
    () => beyXUtilities.buildPointListEntries(valuesSet),
    [valuesSet],
  );

  const pointGroups = useMemo(
    () => beyXUtilities.groupPointListEntriesByValue(entries),
    [entries],
  );

  const partGroups = useMemo(
    () => beyXUtilities.groupPointListEntriesByPart(entries),
    [entries],
  );

  function renderChip(entry, key) {
    const partData = PARTS[entry.partType]?.find(
      (part) => part.id === entry.partId,
    );
    if (!partData) return null;

    return (
      <div className={classes_names["chip"]} key={key}>
        <div className={classes_names["chip-frame"]}>
          <img
            className={classes_names["chip-img"]}
            src={partData.img}
            alt={partData.name}
          />
        </div>
        <span className={classes_names["chip-name"]}>{partData.name}</span>
        {entry.label && (
          <span className={classes_names["chip-label"]}>{entry.label}</span>
        )}
      </div>
    );
  }

  function renderValueGroup(value, groupEntries, keyPrefix) {
    const label =
      value === null ? t("ban-label") : t("point-label", { value });

    return (
      <div
        className={classes_names["value-section"]}
        key={`${keyPrefix}-value-${value}`}
      >
        <div
          className={classes_names["value-header"]}
          data-tier={value === null ? "ban" : value}
        >
          <span className={classes_names["value-badge"]}>{label}</span>
        </div>
        <div className={classes_names["value-chips"]}>
          {groupEntries.map((entry, index) =>
            renderChip(
              entry,
              `${keyPrefix}-${value}-${entry.partType}-${entry.partId}-${entry.label || "base"}-${index}`,
            ),
          )}
        </div>
      </div>
    );
  }

  if (!ruleSet) {
    return (
      <div className={classes_names["root"]}>
        <p className={classes_names["empty-state"]}>
          {t("not-found", { rule: rule_name })}
        </p>
      </div>
    );
  }

  return (
    <div className={classes_names["root"]} {...props}>
      <div className={classes_names["glow-a"]} />
      <div className={classes_names["glow-b"]} />

      <header className={classes_names["header"]}>
        <button
          type="button"
          className={classes_names["back-link"]}
          onClick={() => navigate(-1)}
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
          {t("back-button")}
        </button>

        <div className={classes_names["title-group"]}>
          <p className={classes_names["eyebrow"]}>
            {utilities.normalizeString(rule_name)}
          </p>
          <h1 className={classes_names["title"]}>{t("page-title")}</h1>
        </div>

        <div className={classes_names["view-toggle"]}>
          {VIEW_MODES.map((mode) => (
            <div
              key={`view-mode-${mode}`}
              className={`${classes_names["view-option"]} ${
                viewMode === mode ? classes_names["active"] : ""
              }`}
              onClick={() => setViewMode(mode)}
            >
              {t(`view-mode.${mode}`)}
            </div>
          ))}
        </div>
      </header>

      <div className={classes_names["content"]}>
        {entries.length === 0 && (
          <p className={classes_names["empty-state"]}>{t("empty-state")}</p>
        )}

        {viewMode === "point" &&
          pointGroups.map(({ value, entries: groupEntries }) =>
            renderValueGroup(value, groupEntries, "point"),
          )}

        {viewMode === "part" &&
          partGroups.map(({ partType, valueGroups }) => (
            <section
              className={classes_names["part-section"]}
              key={`part-group-${partType}`}
            >
              <h2 className={classes_names["part-heading"]}>
                {t(`parts.${partType}`, { defaultValue: partType })}
              </h2>
              {valueGroups.map(({ value, entries: groupEntries }) =>
                renderValueGroup(value, groupEntries, `part-${partType}`),
              )}
            </section>
          ))}
      </div>
    </div>
  );
};

export default RulesPointValues;
