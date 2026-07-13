import React, { useEffect, useState } from "react";

// Translation
import { useTranslation } from "react-i18next";

// RTDB
import { duplicateRuleSetToDate } from "../../modules/rtdb";

// Styles
import styles from "./DuplicateDateModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Asks for a new date, then duplicates the currently-viewed rule set into
 * that date (see modules/rtdb.js duplicateRuleSetToDate). Editing always
 * happens on this fresh copy — the original date is never mutated.
 */
/* eslint-disable-next-line no-unused-vars */
const DuplicateDateModal = ({
  additionalstyles,
  open = false,
  tournamentFormat,
  club,
  ruleSetData,
  onClose = () => {},
  onSuccess = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "close-btn",
    "title",
    "description",
    "field",
    "field-label",
    "input",
    "error",
    "submit-btn",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("admin");

  const [date, setDate] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!date || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await duplicateRuleSetToDate(
        tournamentFormat,
        club,
        date,
        ruleSetData,
      );

      if (!result.ok && result.alreadyExists) {
        setError(t("duplicate.already-exists"));
        return;
      }

      onSuccess(date);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Duplicate rule set failed:", err);
      setError(t("duplicate.generic-error"));
    } finally {
      setIsSubmitting(false);
    }
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

        <h2 className={classes_names["title"]}>{t("duplicate.title")}</h2>
        <p className={classes_names["description"]}>
          {t("duplicate.description")}
        </p>

        <div className={classes_names["field"]}>
          <label className={classes_names["field-label"]} htmlFor="new-date">
            {t("duplicate.date-label")}
          </label>
          <input
            id="new-date"
            className={classes_names["input"]}
            type="date"
            value={date}
            autoFocus
            onChange={(event) => {
              setDate(event.target.value);
              setError(null);
            }}
          />
        </div>

        {error && <p className={classes_names["error"]}>{error}</p>}

        <button
          type="submit"
          className={classes_names["submit-btn"]}
          disabled={!date || isSubmitting}
        >
          <ion-icon name="copy-outline"></ion-icon>
          {t("duplicate.submit-button")}
        </button>
      </form>
    </div>
  );
};

export default DuplicateDateModal;
