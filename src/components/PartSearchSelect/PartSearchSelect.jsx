import React, { useEffect, useMemo, useRef, useState } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";
import { getPlayTypeIcon } from "../../modules/playType";

// Styles
import styles from "./PartSearchSelect.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Searchable / filterable part selector.
 *
 * Lets the user search through every saved part of a given `partType`,
 * filter the list live, click to select one, and see the selected part's
 * image and name once chosen.
 *
 * Filters are grouped behind two collapsible toggle buttons (tap to
 * reveal the chip row, tap again or click outside to hide it — see
 * `openFilterPanel`, same pattern as the search dropdown's own
 * click-outside handling):
 *  - "Play Type" (attack/balance/stamina/defense) — shown whenever this
 *    part type's catalog carries any play_type at all, regardless of
 *    `showValues`, since it's unrelated to points.
 *  - "Point Value" — shown only when `showValues` is true (point-buy
 *    formats), built from whichever point values actually exist for this
 *    part type in the current rule set.
 */
/* eslint-disable-next-line no-unused-vars */
const PartSearchSelect = ({
  additionalstyles,
  partType = "blade",
  label,
  selectedId = undefined,
  valuesSet = {},
  context = {},
  showValues = true,
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
    "filters-bar",
    "filter-group",
    "filter-toggle",
    "filter-toggle-label",
    "filter-toggle-value",
    "open",
    "filter-panel",
    "tier-filter",
    "tier-chip",
    "play-type-filter",
    "play-type-chip",
    "active",
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
  // Empty array = "All" (no filtering). Otherwise a set of selected value
  // tiers, ORed together (e.g. selecting 5 and 4 shows parts worth either).
  const [tierFilters, setTierFilters] = useState([]);
  // Same idea, but for play types (attack/balance/stamina/defense).
  const [playTypeFilters, setPlayTypeFilters] = useState([]);
  // Which filter's chip row is currently expanded — "playType" |
  // "pointValue" | null. Only one at a time.
  const [openFilterPanel, setOpenFilterPanel] = useState(null);
  const inputRef = useRef(null);
  const filtersRef = useRef(null);

  // The dropdown can be opened without the input itself being focused yet
  // (e.g. clicking "change" on an already-selected part) — always shift
  // focus into the input once it's open, so blur (below) is a reliable way
  // to close it no matter how it was opened, on both mouse and touch.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // A different part type has a different set of value tiers/play types —
  // drop back to "All" rather than silently keeping filters that no
  // longer apply.
  useEffect(() => {
    setTierFilters([]);
    setPlayTypeFilters([]);
    setOpenFilterPanel(null);
  }, [partType]);

  // Close whichever filter panel is open on any click outside it.
  useEffect(() => {
    if (!openFilterPanel) return undefined;

    function handleClickOutside(event) {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setOpenFilterPanel(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilterPanel]);

  const catalog = useMemo(() => PARTS[partType] || [], [partType]);

  const availableTiers = useMemo(
    () =>
      showValues
        ? beyXUtilities.getAvailableValueTiers(valuesSet, partType, catalog)
        : [],
    [showValues, valuesSet, partType, catalog],
  );

  const availablePlayTypes = useMemo(
    () => beyXUtilities.getAvailablePlayTypes(catalog),
    [catalog],
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

      if (playTypeFilters.length > 0 && !playTypeFilters.includes(part.play_type)) {
        return false;
      }

      if (!showValues || tierFilters.length === 0) return true;

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
  }, [
    catalog,
    searchTerm,
    tierFilters,
    playTypeFilters,
    valuesSet,
    partType,
    showValues,
  ]);

  function toggleTierFilter(tierKey) {
    setTierFilters((prev) =>
      prev.includes(tierKey)
        ? prev.filter((key) => key !== tierKey)
        : [...prev, tierKey],
    );
    setOpenFilterPanel(null);
  }

  function togglePlayTypeFilter(playType) {
    setPlayTypeFilters((prev) =>
      prev.includes(playType)
        ? prev.filter((key) => key !== playType)
        : [...prev, playType],
    );
    setOpenFilterPanel(null);
  }

  function toggleFilterPanel(panel) {
    setOpenFilterPanel((prev) => (prev === panel ? null : panel));
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

  const playTypeSummary =
    playTypeFilters.length === 0
      ? t("part-search.filter-all")
      : playTypeFilters
          .map((playType) => t(`part-search.play-type.${playType}`))
          .join(", ");

  const tierSummary =
    tierFilters.length === 0
      ? t("part-search.filter-all")
      : tierFilters
          .map((tier) => (tier === "ban" ? t("part-search.filter-ban") : tier))
          .join(", ");

  const showSelected = Boolean(selectedPart) && !isOpen;

  return (
    <div className={classes_names["root"]} {...props}>
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
            {showValues && (
              <span className={classes_names["value-badge"]}>
                {t("part-search.value-label")}{" "}
                {selectedValue === undefined
                  ? "—"
                  : beyXUtilities.isBannedValue(selectedValue)
                    ? t("part-search.filter-ban")
                    : selectedValue}
              </span>
            )}
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
          {(availablePlayTypes.length > 0 ||
            (showValues && availableTiers.length > 0)) && (
            <div className={classes_names["filters-bar"]} ref={filtersRef}>
              {availablePlayTypes.length > 0 && (
                <div className={classes_names["filter-group"]}>
                  <button
                    type="button"
                    className={`${classes_names["filter-toggle"]} ${
                      openFilterPanel === "playType"
                        ? classes_names["open"]
                        : ""
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleFilterPanel("playType")}
                  >
                    <span className={classes_names["filter-toggle-label"]}>
                      {t("part-search.play-type-label")}
                    </span>
                    <span className={classes_names["filter-toggle-value"]}>
                      {playTypeSummary}
                    </span>
                    <ion-icon
                      name={
                        openFilterPanel === "playType"
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                    ></ion-icon>
                  </button>

                  {openFilterPanel === "playType" && (
                    <div className={classes_names["filter-panel"]}>
                      <div className={classes_names["play-type-filter"]}>
                        <button
                          type="button"
                          className={`${classes_names["tier-chip"]} ${
                            playTypeFilters.length === 0
                              ? classes_names["active"]
                              : ""
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setPlayTypeFilters([]);
                            setOpenFilterPanel(null);
                          }}
                        >
                          {t("part-search.filter-all")}
                        </button>
                        {availablePlayTypes.map((playType) => (
                          <button
                            type="button"
                            key={`play-type-${playType}`}
                            className={`${classes_names["play-type-chip"]} ${
                              playTypeFilters.includes(playType)
                                ? classes_names["active"]
                                : ""
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => togglePlayTypeFilter(playType)}
                          >
                            <img
                              src={getPlayTypeIcon(playType)}
                              alt={playType}
                            />
                            <span>
                              {t(`part-search.play-type.${playType}`)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showValues && availableTiers.length > 0 && (
                <div className={classes_names["filter-group"]}>
                  <button
                    type="button"
                    className={`${classes_names["filter-toggle"]} ${
                      openFilterPanel === "pointValue"
                        ? classes_names["open"]
                        : ""
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleFilterPanel("pointValue")}
                  >
                    <span className={classes_names["filter-toggle-label"]}>
                      {t("part-search.point-value-label")}
                    </span>
                    <span className={classes_names["filter-toggle-value"]}>
                      {tierSummary}
                    </span>
                    <ion-icon
                      name={
                        openFilterPanel === "pointValue"
                          ? "chevron-up-outline"
                          : "chevron-down-outline"
                      }
                    ></ion-icon>
                  </button>

                  {openFilterPanel === "pointValue" && (
                    <div className={classes_names["filter-panel"]}>
                      <div className={classes_names["tier-filter"]}>
                        <button
                          type="button"
                          className={`${classes_names["tier-chip"]} ${
                            tierFilters.length === 0
                              ? classes_names["active"]
                              : ""
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setTierFilters([]);
                            setOpenFilterPanel(null);
                          }}
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
                              {tier === "ban"
                                ? t("part-search.filter-ban")
                                : tier}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={classes_names["search-input-wrapper"]}>
            <ion-icon name="search-outline"></ion-icon>
            <input
              type="text"
              ref={inputRef}
              value={searchTerm}
              placeholder={t("part-search.placeholder")}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={openSearch}
              onBlur={() => setIsOpen(false)}
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
                      {showValues && (
                        <span className={classes_names["value-badge"]}>
                          {partValue === undefined
                            ? "—"
                            : beyXUtilities.isBannedValue(partValue)
                              ? t("part-search.filter-ban")
                              : partValue}
                        </span>
                      )}
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
