import React, { useEffect, useState } from "react";

// Translation
import { useTranslation } from "react-i18next";

// Styles
import styles from "./NewPointValueModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Tiny prompt for the point value of a brand new row, opened from "Add
 * new point value". The row itself isn't written to RTDB until a part is
 * actually assigned to it (see RulesPointValues) — this just picks which
 * number that row will be.
 */
/* eslint-disable-next-line no-unused-vars */
const NewPointValueModal = ({
  additionalstyles,
  open = false,
  onClose = () => {},
  onConfirm = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "close-btn",
    "title",
    "field",
    "field-label",
    "input",
    "submit-btn",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("admin");

  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (value === "") return;
    onConfirm(Number(value));
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

        <h2 className={classes_names["title"]}>{t("new-point-value.title")}</h2>

        <div className={classes_names["field"]}>
          <label
            className={classes_names["field-label"]}
            htmlFor="new-point-value"
          >
            {t("new-point-value.value-label")}
          </label>
          <input
            id="new-point-value"
            className={classes_names["input"]}
            type="number"
            value={value}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className={classes_names["submit-btn"]}
          disabled={value === ""}
        >
          <ion-icon name="add-circle-outline"></ion-icon>
          {t("new-point-value.submit-button")}
        </button>
      </form>
    </div>
  );
};

export default NewPointValueModal;
