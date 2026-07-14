import React, { useEffect, useRef, useState } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";
import * as beyXHandlers from "../../modules/handlers";
import * as beyXShare from "../../modules/share";

// Styles
import styles from "./DeckSummaryModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Read-only "Deck" summary popup shown once every entry is filled in and
 * valid. Renders each build as a titled column of part images (no
 * selectors), plus a Save action that screenshots that summary and
 * downloads it as a PNG — see modules/share.js for why it's a plain
 * download rather than an upload (short version: Firebase Storage &
 * Functions both need the paid Blaze plan now, so there's no free
 * first-party way to host the image and hand back a URL).
 *
 * The saved image always matches the desktop 3-column layout, even when
 * saved from a mobile device — see captureElementAsDesktopPng.
 */
/* eslint-disable-next-line no-unused-vars */
const DeckSummaryModal = ({
  additionalstyles,
  open = false,
  entries = [],
  entryTypes = [],
  ruleSet = undefined,
  toggles = [],
  totalValue = 0,
  onClose = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "modal-header",
    "modal-title-group",
    "modal-title",
    "modal-total",
    "modal-total-number",
    "close-btn",
    "capture-area",
    "columns",
    "column",
    "column-title",
    "column-value",
    "column-parts",
    "part-frame",
    "part-img",
    "part-caption",
    "part-value",
    "modal-footer",
    "save-btn",
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

  const { t } = useTranslation("landing-page");

  const captureRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Lock page scroll while the popup is open.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Reset any leftover status message every time the popup re-opens.
  // useEffect(() => {
  //   if (open) setSaveStatus(null);
  // }, [open]);

  if (!open) return null;

  async function handleSave() {
    console.log("saving");
    if (!captureRef.current || isSaving) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const blob = await beyXShare.captureElementAsDesktopPng(
        captureRef.current,
        {
          backgroundColor: "#0b1214",
          // The columns grid collapses to 1 column on small screens (see
          // .columns media query) — force it back to the desktop 3-column
          // layout on the offscreen clone before it's rasterized, so the
          // saved image looks the same no matter what device saved it.
          beforeCapture: (clone) => {
            const columnsEl = clone.querySelector("[data-capture-columns]");
            if (columnsEl) {
              columnsEl.style.display = "grid";
              columnsEl.style.gridTemplateColumns = "repeat(3, 1fr)";
            }
          },
        },
      );

      beyXShare.downloadBlob(blob, "beyblade-x-deck.png");
      setSaveStatus({
        type: "success",
        message: t("deck-summary.save-status.saved"),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Deck summary save failed:", err);
      setSaveStatus({
        type: "error",
        message: t("deck-summary.save-status.error"),
      });
    } finally {
      setIsSaving(false);
    }
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

        <div className={classes_names["capture-area"]} ref={captureRef}>
          <div className={classes_names["modal-header"]}>
            <div className={classes_names["modal-title-group"]}>
              <h2 className={classes_names["modal-title"]}>
                {t("deck-summary.title")}
              </h2>
              <span className={classes_names["modal-total"]}>
                {t("total-value")}:{" "}
                <span className={classes_names["modal-total-number"]}>
                  {totalValue}
                </span>
              </span>
            </div>
          </div>

          <div className={classes_names["columns"]} data-capture-columns>
            {entries.map((entry, index) => {
              const entryType = entryTypes[index];
              const title =
                beyXUtilities.buildEntryTitle(entryType, entry) ||
                t("entry-title", { index: index + 1 });
              const fields = beyXUtilities.getVisibleEntryFields(
                entryType,
                entry,
              );
              const valuesSet = ruleSet?.deck?.values || {};
              const entryToggles = toggles[index] || {};
              const entryValue = beyXHandlers.calcEntryValue(
                entry,
                valuesSet,
                entryToggles,
              );

              return (
                <div
                  className={classes_names["column"]}
                  key={`summary-column-${index}`}
                >
                  <p className={classes_names["column-title"]}>{title}</p>
                  <span className={classes_names["column-value"]}>
                    {t("build-value")}: {entryValue}
                  </span>
                  <div className={classes_names["column-parts"]}>
                    {fields.map((partType) => {
                      const partId = entry[partType];
                      const partData = PARTS[partType]?.find(
                        (part) => part.id === partId,
                      );

                      if (!partData) return null;

                      const partValue = beyXUtilities.findPartValue(
                        valuesSet,
                        partType,
                        partId,
                        { buildEntry: entry, toggles: entryToggles },
                      );

                      return (
                        <div
                          className={classes_names["part-frame"]}
                          key={`summary-${index}-${partType}`}
                        >
                          <img
                            className={classes_names["part-img"]}
                            src={partData.img}
                            alt={partData.name}
                          />
                          <span className={classes_names["part-caption"]}>
                            {partData.name}
                          </span>
                          <span className={classes_names["part-value"]}>
                            {partValue === undefined
                              ? "—"
                              : beyXUtilities.isBannedValue(partValue)
                                ? t("ban-label")
                                : partValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={classes_names["modal-footer"]}>
          <button
            type="button"
            className={classes_names["save-btn"]}
            onClick={handleSave}
            // disabled={isSaving}
          >
            <ion-icon
              name={isSaving ? "sync-outline" : "download-outline"}
              className={isSaving ? classes_names["spin-icon"] : ""}
            ></ion-icon>
            {isSaving ? t("deck-summary.saving") : t("deck-summary.save")}
          </button>

          {saveStatus && (
            <div
              className={`${classes_names["save-status"]} ${classes_names[saveStatus.type]}`}
            >
              <p>{saveStatus.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckSummaryModal;
