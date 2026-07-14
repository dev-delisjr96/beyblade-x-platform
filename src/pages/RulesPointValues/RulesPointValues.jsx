import React, { useEffect, useMemo, useRef, useState } from "react";

// Router
import { useNavigate, useParams } from "react-router-dom";

// Translation
import { useTranslation } from "react-i18next";

// Data
import PARTS from "../../data/index";

// RTDB
import { subscribeToRecord, updateRuleSetPartValues } from "../../modules/rtdb";

// Screenshot saving
import * as beyXShare from "../../modules/share";

// Admin access + editing
import * as adminAccess from "../../modules/adminAccess";
import * as rulesEditor from "../../modules/rulesEditor";

// Utilities
import * as beyXUtilities from "../../modules/utilities";
import * as utilities from "../../utilities/index";

// Components
import AdminAccessModal from "../../components/AdminAccessModal/AdminAccessModal";
import DuplicateDateModal from "../../components/DuplicateDateModal/DuplicateDateModal";
import NewPointValueModal from "../../components/NewPointValueModal/NewPointValueModal";
import EditPartValueModal from "../../components/EditPartValueModal/EditPartValueModal";

// Styles
import styles from "./RulesPointValues.module.scss";
import { generateClassesNames } from "styles/utilities";

const VIEW_MODES = ["point", "part"];

/**
 * Reference "point list" for a club's rule set on a given date: every part
 * that's worth points (0-value parts are skipped), grouped either by
 * point value or by part type, each shown as an image + name chip. Parts
 * with a rule-set combo bonus (see modules/rules/conditions.js) get an
 * extra chip in whichever value group that bonus is worth, tagged with
 * the bonus's label.
 *
 * Subscribes live to
 * `tournaments-formats/{tournament_format}/clubs/{club}/{date}` in
 * Firebase RTDB, so any edit made there shows up here immediately
 * without a refresh.
 *
 * Admins (password-gated, see modules/adminAccess.js) can edit the
 * currently viewed date's values directly. They can optionally create a
 * fresh duplicate under a new date first (see DuplicateDateModal) when
 * they want to preserve today's values as history rather than overwrite
 * them in place.
 */
/* eslint-disable-next-line no-unused-vars */
const RulesPointValues = ({ additionalstyles, ...props }) => {
  const elements = [
    "root",
    "glow-a",
    "glow-b",
    "header",
    "back-link",
    "title-group",
    "eyebrow",
    "title",
    "header-actions",
    "edit-button",
    "editing-badge",
    "block-edit-icon",
    "save-button",
    "spin-icon",
    "save-status",
    "success",
    "error",
    "view-toggle",
    "view-option",
    "active",
    "content",
    "new-date-button",
    "add-row-button",
    "value-section",
    "value-header",
    "value-badge",
    "value-chips",
    "part-section",
    "part-heading",
    "chip",
    "chip-frame",
    "chip-actions",
    "force-visible",
    "chip-img",
    "chip-name",
    "chip-label",
    "add-chip-btn",
    "empty-state",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const navigate = useNavigate();
  const { tournament_format, club, date } = useParams();
  const { t } = useTranslation("rules-point-values");
  const { t: tAdmin } = useTranslation("admin");

  const [viewMode, setViewMode] = useState("point");
  const [ruleSet, setRuleSet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Admin / edit mode -----------------------------------------------
  const [isAdmin, setIsAdmin] = useState(() => adminAccess.isAdminSession());
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showNewPointValueModal, setShowNewPointValueModal] = useState(false);
  const [addPartContext, setAddPartContext] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const contentRef = useRef(null);
  // Which chip's action buttons are currently "expanded". Hover reveals
  // them for free on desktop, but hover doesn't exist on touch, so tapping
  // a chip toggles this instead — see the .chip-actions CSS.
  const [activeChipKey, setActiveChipKey] = useState(null);

  const isEditMode = isAdmin;

  // Tapping anywhere outside the active chip's frame collapses its
  // action buttons again.
  useEffect(() => {
    if (!activeChipKey) return undefined;

    function handleClickOutside(event) {
      if (!event.target.closest(`[data-chip-key="${activeChipKey}"]`)) {
        setActiveChipKey(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeChipKey]);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = subscribeToRecord(
      `tournaments-formats/${tournament_format}/clubs/${club}/${date}`,
      (data) => {
        setRuleSet(data);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [tournament_format, club, date]);

  const valuesSet = ruleSet?.deck?.values || {};

  const entries = useMemo(
    () => beyXUtilities.buildPointListEntries(valuesSet),
    [valuesSet],
  );

  const pointGroups = useMemo(
    () => beyXUtilities.groupPointListEntriesByValue(entries),
    [entries],
  );

  const partGroups = useMemo(
    () => beyXUtilities.groupPointListEntriesByPart(entries),
    [entries],
  );

  async function persistPartTypeArray(partType, newArray) {
    await updateRuleSetPartValues(
      tournament_format,
      club,
      date,
      partType,
      newArray,
    );
    // The realtime subscription above will pick up the change and
    // re-render — no need to setState manually here.
  }

  function handleEditClick() {
    setShowAdminModal(true);
  }

  function handleAdminSuccess() {
    setIsAdmin(true);
    setShowAdminModal(false);
  }

  function handleDuplicateSuccess(newDate) {
    setShowDuplicateModal(false);
    navigate(`/${tournament_format}/deck-builder/${club}/${newDate}/values`);
  }

  function handleBlockEdit() {
    adminAccess.blockEditAccess();
    setIsAdmin(false);
    setShowDuplicateModal(false);
  }

  function openAddPartModal(rowValue, lockedPartType) {
    setAddPartContext({ rowValue, lockedPartType });
  }

  async function handleAddPartConfirm({
    mainPartType,
    mainPartId,
    value,
    hasCombo,
    comboPartType,
    comboPartId,
  }) {
    if (!hasCombo) {
      // Simple case: just set/update this part's base value. Any rule-set
      // it already had stays exactly as it was.
      const newArray = rulesEditor.setBaseValue(
        valuesSet,
        mainPartType,
        mainPartId,
        value,
      );
      await persistPartTypeArray(mainPartType, newArray);
      setAddPartContext(null);
      return;
    }

    // Blade takes priority: whichever of the two parts in this combo is a
    // blade gets the rule-set attached to it (that's where the game's own
    // combo bonuses live, e.g. Bullet Griffon + Merge). The other part is
    // only ever referenced inside the combo — it's never written to.
    const mainIsBlade = mainPartType === "blade";
    const comboIsBlade = comboPartType === "blade";

    const targetType = mainIsBlade
      ? mainPartType
      : comboIsBlade
        ? comboPartType
        : mainPartType;
    const targetId = targetType === mainPartType ? mainPartId : comboPartId;
    const otherType =
      targetType === mainPartType ? comboPartType : mainPartType;
    const otherId = targetType === mainPartType ? comboPartId : mainPartId;

    const otherPartData = PARTS[otherType]?.find(
      (part) => part.id === otherId,
    );

    const comboRule = {
      label: `+ ${otherPartData?.name || otherId}`,
      combo: [{ part: otherType, name: otherId }],
      newValue: Number(value),
    };

    const newArray = rulesEditor.addComboRule(
      valuesSet,
      targetType,
      targetId,
      comboRule,
    );
    await persistPartTypeArray(targetType, newArray);
    setAddPartContext(null);
  }

  function handleNewPointValueConfirm(value) {
    setShowNewPointValueModal(false);
    openAddPartModal(value, undefined);
  }

  async function handleSaveTable() {
    if (!contentRef.current || isSaving) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const blob = await beyXShare.captureElementAsDesktopPng(
        contentRef.current,
        {
          desktopWidth: 1100,
          backgroundColor: "#060a0c",
          // Both the point-value rows and their tier badges collapse to a
          // narrower, stacked layout on small screens (see the .value-section
          // / .value-header media queries) — force them back to the desktop
          // row layout on the offscreen clone before it's rasterized, so the
          // saved image looks the same no matter what device saved it.
          beforeCapture: (clone) => {
            clone
              .querySelectorAll("[data-capture-value-section]")
              .forEach((el) => {
                el.style.flexDirection = "row";
                el.style.gap = "1.25rem";
              });
            clone
              .querySelectorAll("[data-capture-value-header]")
              .forEach((el) => {
                el.style.width = "92px";
              });
          },
        },
      );

      beyXShare.downloadBlob(
        blob,
        `beyblade-x-point-list-${club}-${date}-${viewMode}.png`,
      );
      setSaveStatus({ type: "success", message: t("save-status.saved") });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Point list save failed:", err);
      setSaveStatus({ type: "error", message: t("save-status.error") });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteChip(entry) {
    const newArray = entry.label
      ? rulesEditor.removeComboRule(
          valuesSet,
          entry.partType,
          entry.partId,
          entry,
        )
      : rulesEditor.removePartValue(valuesSet, entry.partType, entry.partId);

    await persistPartTypeArray(entry.partType, newArray);
  }

  async function handleMoveChip(entry, direction) {
    if (entry.label) return; // only base (non-bonus) chips can move tiers

    const newValue = entry.value + (direction === "up" ? 1 : -1);
    const newArray = rulesEditor.changePartValueTier(
      valuesSet,
      entry.partType,
      entry.partId,
      newValue,
    );

    await persistPartTypeArray(entry.partType, newArray);
  }

  function renderChip(entry, key) {
    const partData = PARTS[entry.partType]?.find(
      (part) => part.id === entry.partId,
    );
    if (!partData) return null;

    const isActive = activeChipKey === key;

    function handleActionClick(event, action) {
      event.stopPropagation();
      action();
      setActiveChipKey(null);
    }

    return (
      <div className={classes_names["chip"]} key={key}>
        <div
          className={classes_names["chip-frame"]}
          data-chip-key={key}
          onClick={() =>
            isEditMode &&
            setActiveChipKey((prev) => (prev === key ? null : key))
          }
        >
          <img
            className={classes_names["chip-img"]}
            src={partData.img}
            alt={partData.name}
          />
        </div>

        {isEditMode && (
          <div
            className={`${classes_names["chip-actions"]} ${
              isActive ? classes_names["force-visible"] : ""
            }`}
          >
            {!entry.label && (
              <>
                <button
                  type="button"
                  title="Move up a point"
                  onClick={(event) =>
                    handleActionClick(event, () => handleMoveChip(entry, "up"))
                  }
                >
                  <ion-icon name="arrow-up-outline"></ion-icon>
                </button>
                <button
                  type="button"
                  title="Move down a point"
                  onClick={(event) =>
                    handleActionClick(event, () =>
                      handleMoveChip(entry, "down"),
                    )
                  }
                >
                  <ion-icon name="arrow-down-outline"></ion-icon>
                </button>
              </>
            )}
            <button
              type="button"
              title="Remove"
              onClick={(event) =>
                handleActionClick(event, () => handleDeleteChip(entry))
              }
            >
              <ion-icon name="remove-circle-outline"></ion-icon>
            </button>
          </div>
        )}

        <span className={classes_names["chip-name"]}>{partData.name}</span>
        {entry.label && (
          <span className={classes_names["chip-label"]}>{entry.label}</span>
        )}
      </div>
    );
  }

  function renderValueGroup(value, groupEntries, keyPrefix, lockedPartType) {
    const isBanGroup = value === "ban";
    const label = isBanGroup ? t("ban-label") : t("point-label", { value });

    return (
      <div
        className={classes_names["value-section"]}
        data-capture-value-section
        key={`${keyPrefix}-value-${value}`}
      >
        <div
          className={classes_names["value-header"]}
          data-tier={value}
          data-capture-value-header
        >
          <span className={classes_names["value-badge"]}>{label}</span>
        </div>
        <div className={classes_names["value-chips"]}>
          {groupEntries.map((entry, index) =>
            renderChip(
              entry,
              `${keyPrefix}-${value}-${entry.partType}-${entry.partId}-${entry.label || "base"}-${index}`,
            ),
          )}

          {isEditMode && (
            <button
              type="button"
              className={classes_names["add-chip-btn"]}
              onClick={() =>
                openAddPartModal(isBanGroup ? false : value, lockedPartType)
              }
            >
              <ion-icon name="add-outline"></ion-icon>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={classes_names["root"]}>
        <p className={classes_names["empty-state"]}>{t("loading")}</p>
      </div>
    );
  }

  if (!ruleSet) {
    return (
      <div className={classes_names["root"]}>
        <p className={classes_names["empty-state"]}>
          {t("not-found", { club, date })}
        </p>
      </div>
    );
  }

  return (
    <div className={classes_names["root"]} {...props}>
      <div className={classes_names["glow-a"]} />
      <div className={classes_names["glow-b"]} />

      <header className={classes_names["header"]}>
        <button
          type="button"
          className={classes_names["back-link"]}
          onClick={() => navigate(`/${tournament_format}/deck-builder`)}
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
          {t("back-button")}
        </button>

        <div className={classes_names["title-group"]}>
          <p className={classes_names["eyebrow"]}>
            {utilities.normalizeString(club)} · {date}
          </p>
          <h1 className={classes_names["title"]}>{t("page-title")}</h1>
        </div>

        <div className={classes_names["header-actions"]}>
          <div className={classes_names["view-toggle"]}>
            {VIEW_MODES.map((mode) => (
              <div
                key={`view-mode-${mode}`}
                className={`${classes_names["view-option"]} ${
                  viewMode === mode ? classes_names["active"] : ""
                }`}
                onClick={() => setViewMode(mode)}
              >
                {t(`view-mode.${mode}`)}
              </div>
            ))}
          </div>

          {isEditMode ? (
            <span className={classes_names["editing-badge"]}>
              <ion-icon name="create-outline"></ion-icon>
              {tAdmin("edit-button")}
              <ion-icon
                name="lock-open-outline"
                title={tAdmin("duplicate.block-edit-button")}
                className={classes_names["block-edit-icon"]}
                onClick={handleBlockEdit}
              ></ion-icon>
            </span>
          ) : (
            <>
              <button
                type="button"
                className={classes_names["edit-button"]}
                onClick={handleEditClick}
              >
                <ion-icon name="lock-closed-outline"></ion-icon>
                {tAdmin("edit-button")}
              </button>
              <button
                type="button"
                className={classes_names["save-button"]}
                onClick={handleSaveTable}
                disabled={isSaving}
              >
                <ion-icon
                  name={isSaving ? "sync-outline" : "download-outline"}
                  className={isSaving ? classes_names["spin-icon"] : ""}
                ></ion-icon>
                {isSaving ? t("saving") : t("save-button")}
              </button>
            </>
          )}
        </div>
      </header>

      {saveStatus && (
        <div
          className={`${classes_names["save-status"]} ${classes_names[saveStatus.type]}`}
        >
          <p>{saveStatus.message}</p>
        </div>
      )}

      <div className={classes_names["content"]} ref={contentRef}>
        {entries.length === 0 && (
          <p className={classes_names["empty-state"]}>{t("empty-state")}</p>
        )}

        {viewMode === "point" && isEditMode && (
          <button
            type="button"
            className={classes_names["new-date-button"]}
            onClick={() => setShowDuplicateModal(true)}
          >
            <ion-icon name="copy-outline"></ion-icon>
            {tAdmin("create-new-set-button")}
          </button>
        )}

        {viewMode === "point" && isEditMode && (
          <button
            type="button"
            className={classes_names["add-row-button"]}
            onClick={() => setShowNewPointValueModal(true)}
          >
            <ion-icon name="add-circle-outline"></ion-icon>
            {tAdmin("add-point-value-button")}
          </button>
        )}

        {viewMode === "point" &&
          pointGroups.map(({ value, entries: groupEntries }) =>
            renderValueGroup(value, groupEntries, "point", undefined),
          )}

        {viewMode === "part" &&
          partGroups.map(({ partType, valueGroups }) => (
            <section
              className={classes_names["part-section"]}
              key={`part-group-${partType}`}
            >
              <h2 className={classes_names["part-heading"]}>
                {t(`parts.${partType}`, { defaultValue: partType })}
              </h2>
              {valueGroups.map(({ value, entries: groupEntries }) =>
                renderValueGroup(
                  value,
                  groupEntries,
                  `part-${partType}`,
                  partType,
                ),
              )}
            </section>
          ))}
      </div>

      <AdminAccessModal
        open={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminSuccess}
      />

      <DuplicateDateModal
        open={showDuplicateModal}
        tournamentFormat={tournament_format}
        club={club}
        ruleSetData={ruleSet}
        onClose={() => setShowDuplicateModal(false)}
        onSuccess={handleDuplicateSuccess}
        onBlockEdit={handleBlockEdit}
      />

      <NewPointValueModal
        open={showNewPointValueModal}
        onClose={() => setShowNewPointValueModal(false)}
        onConfirm={handleNewPointValueConfirm}
      />

      <EditPartValueModal
        open={Boolean(addPartContext)}
        rowValue={addPartContext?.rowValue}
        lockedPartType={addPartContext?.lockedPartType}
        valuesSet={valuesSet}
        onClose={() => setAddPartContext(null)}
        onConfirm={handleAddPartConfirm}
      />
    </div>
  );
};

export default RulesPointValues;
