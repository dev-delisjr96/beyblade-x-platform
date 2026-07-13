import React, { useEffect, useMemo, useState } from "react";

// Router
import { useNavigate } from "react-router-dom";

// Translation
import { useTranslation } from "react-i18next";

// RTDB
import { subscribeToData } from "../../modules/rtdb";

// Styles
import styles from "./LandingPage.module.scss";
import { generateClassesNames } from "../../styles/utilities";

/**
 * Entry point of the app: lets the player pick which tournament format
 * they're building a deck for (e.g. "Point Buy", "3v3 Team"), sourced live
 * from Firebase RTDB at `tournaments-formats`. Picking one navigates to
 * that format's deck builder at `/{format}/deck-builder`.
 */
/* eslint-disable-next-line no-unused-vars */
const LandingPage = ({ additionalstyles, ...props }) => {
  const elements = [
    "root",
    "glow-a",
    "glow-b",
    "header",
    "brand-badge",
    "eyebrow",
    "title",
    "formats-grid",
    "format-card",
    "format-icon",
    "format-name",
    "format-description",
    "empty-state",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const navigate = useNavigate();
  const { t } = useTranslation("tournament-formats");

  const [rawFormats, setRawFormats] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToData("tournaments-formats", setRawFormats);
    return unsubscribe;
  }, []);

  // `tournaments-formats` might be seeded as `{ "point-buy": { label: ... } }`
  // (subscribeToData turns that into an array of records already) or as
  // simple flags like `{ "point-buy": true }` (subscribeToData's "is this
  // a list of records" heuristic doesn't recognize that as a list, so it
  // hands back the raw object instead) — normalize either shape here.
  const formats = useMemo(() => {
    if (Array.isArray(rawFormats)) return rawFormats;

    if (rawFormats && typeof rawFormats === "object") {
      return Object.entries(rawFormats).map(([id, value]) => {
        if (value && typeof value === "object") return { id, ...value };
        return { id, label: typeof value === "string" ? value : undefined };
      });
    }

    return [];
  }, [rawFormats]);

  const isLoading = rawFormats === null;
  const hasFormats = formats.length > 0;

  return (
    <div className={classes_names["root"]} {...props}>
      <div className={classes_names["glow-a"]} />
      <div className={classes_names["glow-b"]} />

      <header className={classes_names["header"]}>
        <div className={classes_names["brand-badge"]}>
          <ion-icon name="disc-outline"></ion-icon>
        </div>
        <p className={classes_names["eyebrow"]}>Beyblade X</p>
        <h1 className={classes_names["title"]}>{t("page-title")}</h1>
      </header>

      <div className={classes_names["formats-grid"]}>
        {isLoading && (
          <p className={classes_names["empty-state"]}>{t("loading")}</p>
        )}

        {!isLoading && !hasFormats && (
          <p className={classes_names["empty-state"]}>{t("empty-state")}</p>
        )}

        {hasFormats &&
          formats.map((format) => (
            <div
              className={classes_names["format-card"]}
              key={`format-${format.id}`}
              onClick={() => navigate(`/${format.id}/deck-builder`)}
            >
              <div className={classes_names["format-icon"]}>
                <ion-icon name={format.icon || "trophy-outline"}></ion-icon>
              </div>
              <p className={classes_names["format-name"]}>
                {format.label || format.name || format.id}
              </p>
              {format.description && (
                <p className={classes_names["format-description"]}>
                  {format.description}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default LandingPage;
