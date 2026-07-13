import React, { useEffect, useMemo, useRef, useState } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";

// Styles
import styles from "./PartSearchSelect.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Searchable / filterable part selector.
 *
 * Lets the user search through every saved part of a given `partType`,
 * filter the list live, click to select one, and see the selected part's
 * image, name and rule-set value once chosen.
 */
/* eslint-disable-next-line no-unused-vars */
const PartSearchSelect = ({
  additionalstyles,
  partType = "blade",
  label,
  selectedId = undefined,
  valuesSet = {},
  context = {},
  onSelect = () => {},
  ...props
}) => {
  const elements = [
    "root",
    "label",
    "selected",
    "img-frame",
    "selected-img",
    "selected-info",
    "selected-name",
    "value-badge",
    "selected-actions",
    "search",
    "search-input-wrapper",
    "options-container",
    "option",
    "option-img",
    "option-name",
    "no-options",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("inputs");

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  // Close the dropdown on any click outside this component — not just when
  // re-clicking the selector itself.
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const catalog = useMemo(() => PARTS[partType] || [], [partType]);

  const selectedPart = useMemo(
    () => catalog.find((part) => part.id === selectedId),
    [catalog, selectedId],
  );

  const selectedValue = beyXUtilities.findPartValue(
    valuesSet,
    partType,
    selectedId,
    context,
  );

  const filteredParts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return catalog;

    return catalog.filter((part) => {
      return (
        part.name?.toLowerCase().includes(normalizedSearch) ||
        part.id?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [catalog, searchTerm]);

  function openSearch() {
    setIsOpen(true);
  }

  function handleSelect(part) {
    onSelect(part.id);
    setSearchTerm("");
    setIsOpen(false);
  }

  function handleClear(event) {
    event.stopPropagation();
    onSelect(undefined);
    setSearchTerm("");
    setIsOpen(true);
  }

  const showSelected = Boolean(selectedPart) && !isOpen;

  return (
    <div className={classes_names["root"]} ref={rootRef} {...props}>
      {label && <p className={classes_names["label"]}>{label}</p>}

      {showSelected ? (
        <div className={classes_names["selected"]} onClick={openSearch}>
          <div className={classes_names["img-frame"]}>
            <img
              className={classes_names["selected-img"]}
              src={selectedPart.img}
              alt={selectedPart.name}
            />
          </div>
          <div className={classes_names["selected-info"]}>
            <p className={classes_names["selected-name"]}>
              {selectedPart.name}
            </p>
            <span className={classes_names["value-badge"]}>
              {t("part-search.value-label")}{" "}
              {selectedValue === undefined || selectedValue === null
                ? "—"
                : selectedValue}
            </span>
          </div>
          <div className={classes_names["selected-actions"]}>
            <ion-icon
              name="create-outline"
              title={t("part-search.change")}
            ></ion-icon>
            <ion-icon
              name="close-outline"
              title={t("part-search.clear")}
              onClick={handleClear}
            ></ion-icon>
          </div>
        </div>
      ) : (
        <div className={classes_names["search"]}>
          <div className={classes_names["search-input-wrapper"]}>
            <ion-icon name="search-outline"></ion-icon>
            <input
              type="text"
              value={searchTerm}
              placeholder={t("part-search.placeholder")}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={openSearch}
            />
            {selectedPart && (
              <ion-icon
                name="close-outline"
                onClick={() => {
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              ></ion-icon>
            )}
          </div>

          {isOpen && (
            <div className={classes_names["options-container"]}>
              {filteredParts.length === 0 ? (
                <div className={classes_names["no-options"]}>
                  {t("part-search.no-results")}
                </div>
              ) : (
                filteredParts.map((part) => {
                  const partValue = beyXUtilities.findPartValue(
                    valuesSet,
                    partType,
                    part.id,
                    context,
                  );

                  return (
                    <div
                      className={classes_names["option"]}
                      key={`${partType}-option-${part.id}`}
                      onMouseDown={() => handleSelect(part)}
                    >
                      <div className={classes_names["img-frame"]}>
                        <img
                          className={classes_names["option-img"]}
                          src={part.img}
                          alt={part.name}
                        />
                      </div>
                      <p className={classes_names["option-name"]}>
                        {part.name}
                      </p>
                      <span className={classes_names["value-badge"]}>
                        {partValue === undefined || partValue === null
                          ? "—"
                          : partValue}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartSearchSelect;
