import React, { useEffect, useState } from "react";

// Translation
import { useTranslation } from "react-i18next";

// Play type icons
import { PLAY_TYPES, getPlayTypeIcon } from "../../modules/playType";

// Styles
import styles from "./EditLimitsModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Admin-only editor for a play-type rule set's two extra limits (see
 * modules/rules/index.js validateDeck):
 *  - "allowSamePlayType": a single on/off toggle.
 *  - "allowedPlayTypes": which of attack/balance/stamina/defense are
 *    legal at all, as a multi-select checkbox group.
 *
 * Unlike the point-buy values editor, this writes directly to the
 * currently viewed club/date's `deck.limits` in place — no forced
 * duplicate-date step, since there's no per-part data to lose, just a
 * couple of settings.
 */
/* eslint-disable-next-line no-unused-vars */
const EditLimitsModal = ({
  additionalstyles,
  open = false,
  currentLimits = {},
  onClose = () => {},
  onSave = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "close-btn",
    "title",
    "field",
    "field-label",
    "checkbox-row",
    "play-type-options",
    "play-type-option",
    "active",
    "submit-btn",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("admin");

  const [allowSamePlayType, setAllowSamePlayType] = useState(true);
  const [allowedPlayTypes, setAllowedPlayTypes] = useState(PLAY_TYPES);

  useEffect(() => {
    if (!open) return;
    setAllowSamePlayType(currentLimits?.allowSamePlayType !== false);
    setAllowedPlayTypes(
      Array.isArray(currentLimits?.allowedPlayTypes) &&
        currentLimits.allowedPlayTypes.length > 0
        ? currentLimits.allowedPlayTypes
        : PLAY_TYPES,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function togglePlayType(playType) {
    setAllowedPlayTypes((prev) =>
      prev.includes(playType)
        ? prev.filter((type) => type !== playType)
        : [...prev, playType],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({ allowSamePlayType, allowedPlayTypes });
  }

  return (
    <div className={classes_names["overlay"]} {...props}>
      <form
        className={classes_names["modal"]}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <ion-icon
          name="close-outline"
          className={classes_names["close-btn"]}
          onClick={onClose}
        ></ion-icon>

        <h2 className={classes_names["title"]}>{t("edit-limits.title")}</h2>

        <label className={classes_names["checkbox-row"]}>
          <input
            type="checkbox"
            checked={allowSamePlayType}
            onChange={(event) => setAllowSamePlayType(event.target.checked)}
          />
          <span>{t("edit-limits.allow-same-play-type")}</span>
        </label>

        <div className={classes_names["field"]}>
          <p className={classes_names["field-label"]}>
            {t("edit-limits.allowed-play-types")}
          </p>
          <div className={classes_names["play-type-options"]}>
            {PLAY_TYPES.map((playType) => (
              <label
                key={`allowed-play-type-${playType}`}
                className={`${classes_names["play-type-option"]} ${
                  allowedPlayTypes.includes(playType)
                    ? classes_names["active"]
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={allowedPlayTypes.includes(playType)}
                  onChange={() => togglePlayType(playType)}
                />
                <img src={getPlayTypeIcon(playType)} alt={playType} />
                <span>{t(`edit-limits.play-type.${playType}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={classes_names["submit-btn"]}
          disabled={allowedPlayTypes.length === 0}
        >
          <ion-icon name="save-outline"></ion-icon>
          {t("edit-limits.submit-button")}
        </button>
      </form>
    </div>
  );
};

export default EditLimitsModal;
