import React, { useEffect, useState } from "react";

// Translation
import { useTranslation } from "react-i18next";

// Admin access
import * as adminAccess from "../../modules/adminAccess";

// Styles
import styles from "./AdminAccessModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * "I am an Admin" password gate. Not real authentication — see
 * modules/adminAccess.js for what that means and why it's fine here.
 */
/* eslint-disable-next-line no-unused-vars */
const AdminAccessModal = ({
  additionalstyles,
  open = false,
  onClose = () => {},
  onSuccess = () => {},
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
    "error",
    "submit-btn",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("admin");

  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError(false);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();

    if (adminAccess.checkAdminPassword(password)) {
      adminAccess.setAdminSession();
      setError(false);
      onSuccess();
    } else {
      setError(true);
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

        <h2 className={classes_names["title"]}>{t("access-title")}</h2>

        <div className={classes_names["field"]}>
          <label
            className={classes_names["field-label"]}
            htmlFor="admin-password"
          >
            {t("password-label")}
          </label>
          <input
            id="admin-password"
            className={classes_names["input"]}
            type={showPw ? "text" : "password"}
            value={password}
            autoFocus
            onChange={(event) => {
              setPassword(event.target.value);
              setError(false);
            }}
          />
          <ion-icon
            onClick={() => {
              setShowPw(!showPw);
            }}
            name={`eye${showPw ? "-off" : ""}-outline`}
          ></ion-icon>
        </div>

        {error && (
          <p className={classes_names["error"]}>{t("access-denied")}</p>
        )}

        <button type="submit" className={classes_names["submit-btn"]}>
          <ion-icon name="shield-checkmark-outline"></ion-icon>
          {t("submit-button")}
        </button>
      </form>
    </div>
  );
};

export default AdminAccessModal;
