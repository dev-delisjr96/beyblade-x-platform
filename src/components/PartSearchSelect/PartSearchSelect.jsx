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
 * image, name and rule-set value once chosen. Also offers a value-tier
 * filter (0-1-2-3-4-5.../Ban) built straight from whichever point values
 * actually exist for this part type in the current rule set.
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
    "tier-filter",
    "tier-chip",
    "active",
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
  // Empty array = "All" (no filtering). Otherwise a set of selected value
  // tiers, ORed together (e.g. selecting 5 and 4 shows parts worth either).
  const [tierFilters, setTierFilters] = useState([]);
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

  // A different part type has a different set of value tiers — drop back
  // to "All" rather than silently keeping a filter that no longer applies.
  useEffect(() => {
    setTierFilters([]);
  }, [partType]);

  const catalog = useMemo(() => PARTS[partType] || [], [partType]);

  const availableTiers = useMemo(
    () => beyXUtilities.getAvailableValueTiers(valuesSet, partType, catalog),
    [valuesSet, partType, catalog],
  );

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

    return catalog.filter((part) => {
      const matchesSearch =
        !normalizedSearch ||
        part.name?.toLowerCase().includes(normalizedSearch) ||
        part.id?.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      if (tierFilters.length === 0) return true;

      const partValue = beyXUtilities.findPartValue(
        valuesSet,
        partType,
        part.id,
        context,
      );
      const partValueKey = beyXUtilities.isBannedValue(partValue)
        ? "ban"
        : partValue;

      return tierFilters.includes(partValueKey);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, searchTerm, tierFilters, valuesSet, partType]);

  function toggleTierFilter(tierKey) {
    setTierFilters((prev) =>
      prev.includes(tierKey)
        ? prev.filter((key) => key !== tierKey)
        : [...prev, tierKey],
    );
  }

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
              {selectedValue === undefined
                ? "—"
                : beyXUtilities.isBannedValue(selectedValue)
                  ? t("part-search.filter-ban")
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
          {availableTiers.length > 0 && (
            <div className={classes_names["tier-filter"]}>
              <button
                type="button"
                className={`${classes_names["tier-chip"]} ${
                  tierFilters.length === 0 ? classes_names["active"] : ""
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setTierFilters([])}
              >
                {t("part-search.filter-all")}
              </button>
              {availableTiers.map((tier) => {
                const tierKey = tier;
                return (
                  <button
                    type="button"
                    key={`tier-${tierKey}`}
                    className={`${classes_names["tier-chip"]} ${
                      tierFilters.includes(tierKey)
                        ? classes_names["active"]
                        : ""
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleTierFilter(tierKey)}
                  >
                    {tier === "ban" ? t("part-search.filter-ban") : tier}
                  </button>
                );
              })}
            </div>
          )}

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
                        {partValue === undefined
                          ? "—"
                          : beyXUtilities.isBannedValue(partValue)
                            ? t("part-search.filter-ban")
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
