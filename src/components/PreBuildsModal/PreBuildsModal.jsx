import React, { useEffect, useState } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";

// Styles
import styles from "./PreBuildsModal.module.scss";
import { generateClassesNames } from "styles/utilities";

const TABS = ["popular", "family"];

/**
 * "See pre builds" popup — shown when the blade (simple builds) or
 * main-blade (CX builds) currently selected in a deck entry has a
 * `builds` property in its catalog data (see data/blades.json,
 * data/main-blades.json). A top tab bar picks between:
 *  - "Popular": real ratchet/bit (+lock-chip/over-blade/assist-blade for
 *    CX) combos, each clickable to auto-fill the whole build at once.
 *  - "Family": `builds.family` is a mixed list of ids (blade, lock-chip,
 *    and main-blade ids all together, since it describes a whole product
 *    line) — this tab filters that down to just the blade ids and shows
 *    each as a single-image card; clicking one just swaps the entry's
 *    blade, leaving ratchet/bit as they were.
 *
 * Each popular-build card is rendered like a mini Deck Summary column —
 * a title plus a stack of circular part images — reusing the same visual
 * language as components/DeckSummaryModal.
 */
/* eslint-disable-next-line no-unused-vars */
const PreBuildsModal = ({
  additionalstyles,
  open = false,
  entryType = "simple",
  sourcePartType = "blade",
  sourcePartId = undefined,
  onClose = () => {},
  onApply = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "close-btn",
    "header",
    "title",
    "subtitle",
    "tabs",
    "tab",
    "active",
    "content",
    "grid",
    "card",
    "card-title",
    "card-parts",
    "part-frame",
    "part-img",
    "part-caption",
    "empty-state",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("landing-page");

  const [activeTab, setActiveTab] = useState("popular");

  useEffect(() => {
    if (open) setActiveTab("popular");
  }, [open]);

  if (!open) return null;

  const sourcePartData = beyXUtilities.findPartData(
    sourcePartType,
    sourcePartId,
  );
  const popularBuilds = sourcePartData?.builds?.popular || [];
  const familyIds = sourcePartData?.builds?.family || [];
  // `family` mixes blade, lock-chip, and main-blade ids together (it
  // describes a whole product line) — only the blade ones apply here.
  const familyBlades = familyIds
    .map((id) => PARTS.blade?.find((part) => part.id === id))
    .filter(Boolean);

  function handleApplyCombo(rawCombo) {
    const normalized = beyXUtilities.normalizeBuildCombo(rawCombo);
    onApply({ ...normalized, [sourcePartType]: sourcePartId });
  }

  function handleApplyFamilyBlade(bladeId) {
    onApply({ blade: bladeId });
  }

  return (
    <div className={classes_names["overlay"]} {...props}>
      <div
        className={classes_names["modal"]}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ion-icon
          name="close-outline"
          className={classes_names["close-btn"]}
          onClick={onClose}
        ></ion-icon>

        <div className={classes_names["header"]}>
          <h2 className={classes_names["title"]}>{t("pre-builds.title")}</h2>
          <p className={classes_names["subtitle"]}>{sourcePartData?.name}</p>
        </div>

        <div className={classes_names["tabs"]}>
          {TABS.map((tab) => (
            <div
              key={`pre-builds-tab-${tab}`}
              className={`${classes_names["tab"]} ${
                activeTab === tab ? classes_names["active"] : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`pre-builds.tabs.${tab}`)}
            </div>
          ))}
        </div>

        <div className={classes_names["content"]}>
          {activeTab === "popular" &&
            (popularBuilds.length === 0 ? (
              <p className={classes_names["empty-state"]}>
                {t("pre-builds.empty-popular")}
              </p>
            ) : (
              <div className={classes_names["grid"]}>
                {popularBuilds.map((rawCombo, index) => {
                  const normalized =
                    beyXUtilities.normalizeBuildCombo(rawCombo);
                  const fields = beyXUtilities.buildComboDisplayFields(
                    entryType,
                    sourcePartType,
                    sourcePartId,
                    normalized,
                  );
                  const title =
                    beyXUtilities.buildEntryTitle(entryType, {
                      ...normalized,
                      [sourcePartType]: sourcePartId,
                    }) || t("pre-builds.build-number", { index: index + 1 });

                  return (
                    <div
                      className={classes_names["card"]}
                      key={`pre-build-${index}`}
                      onClick={() => handleApplyCombo(rawCombo)}
                    >
                      <p className={classes_names["card-title"]}>{title}</p>
                      <div className={classes_names["card-parts"]}>
                        {fields.map(({ partType, partId }) => {
                          const partData = PARTS[partType]?.find(
                            (part) => part.id === partId,
                          );
                          if (!partData) return null;

                          return (
                            <div
                              className={classes_names["part-frame"]}
                              key={`pre-build-${index}-${partType}`}
                            >
                              <img
                                className={classes_names["part-img"]}
                                src={partData.img}
                                alt={partData.name}
                              />
                              <span className={classes_names["part-caption"]}>
                                {partData.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {activeTab === "family" &&
            (familyBlades.length === 0 ? (
              <p className={classes_names["empty-state"]}>
                {t("pre-builds.empty-family")}
              </p>
            ) : (
              <div className={classes_names["grid"]}>
                {familyBlades.map((bladePart) => (
                  <div
                    className={classes_names["card"]}
                    key={`family-blade-${bladePart.id}`}
                    onClick={() => handleApplyFamilyBlade(bladePart.id)}
                  >
                    <p className={classes_names["card-title"]}>
                      {bladePart.name}
                    </p>
                    <div className={classes_names["card-parts"]}>
                      <div className={classes_names["part-frame"]}>
                        <img
                          className={classes_names["part-img"]}
                          src={bladePart.img}
                          alt={bladePart.name}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PreBuildsModal;
