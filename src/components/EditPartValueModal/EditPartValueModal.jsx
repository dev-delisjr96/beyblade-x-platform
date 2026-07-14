import React, { useEffect, useMemo, useState } from "react";

// Translation
import { useTranslation } from "react-i18next";

// Rules editor
import * as rulesEditor from "../../modules/rulesEditor";

// Components
import PartSearchSelect from "../PartSearchSelect/PartSearchSelect";

// Styles
import styles from "./EditPartValueModal.module.scss";
import { generateClassesNames } from "styles/utilities";

/**
 * Popup used both by the "+" on a point row and "Add new point value":
 * search/select a part, assign it this row's point value, and optionally
 * attach a rule-set combo bonus (e.g. Bullet Griffon + the Merge bit).
 *
 * When a combo is attached, `rowValue` becomes the bonus's value (the
 * point value this row represents), not the part's plain base value —
 * see pages/RulesPointValues for how the two ends of the combo get
 * resolved and written (blade always gets the rule-set, per the "blade
 * takes priority" rule).
 *
 * Purely a form — the caller (RulesPointValues) owns actually writing the
 * result to RTDB via modules/rulesEditor.js + modules/rtdb.js.
 */
/* eslint-disable-next-line no-unused-vars */
const EditPartValueModal = ({
  additionalstyles,
  open = false,
  rowValue,
  lockedPartType = undefined,
  valuesSet = {},
  onClose = () => {},
  onConfirm = () => {},
  ...props
}) => {
  const elements = [
    "overlay",
    "modal",
    "close-btn",
    "title",
    "value-badge",
    "field",
    "field-label",
    "part-type-toggle",
    "part-type-option",
    "active",
    "checkbox-row",
    "combo-form",
    "combo-row",
    "combo-hint",
    "condition-form",
    "submit-btn",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("admin");

  const [partType, setPartType] = useState(
    lockedPartType || rulesEditor.ALL_PART_TYPES[0],
  );
  const [partId, setPartId] = useState(undefined);
  const [isBan, setIsBan] = useState(false);
  const [hasRuleSet, setHasRuleSet] = useState(false);
  const [comboPartType, setComboPartType] = useState(undefined);
  const [comboPartId, setComboPartId] = useState(undefined);
  const [hasCondition, setHasCondition] = useState(false);
  const [conditionLabel, setConditionLabel] = useState("");
  const [conditionValue, setConditionValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setPartType(lockedPartType || rulesEditor.ALL_PART_TYPES[0]);
    setPartId(undefined);
    setIsBan(false);
    setHasRuleSet(false);
    setComboPartType(undefined);
    setComboPartId(undefined);
    setHasCondition(false);
    setConditionLabel("");
    setConditionValue("");
  }, [open, lockedPartType]);

  const comboPartnerTypes = useMemo(
    () => rulesEditor.getComboPartnerTypes(partType),
    [partType],
  );

  if (!open) return null;

  const canSubmit =
    Boolean(partId) &&
    (isBan ||
      (!hasRuleSet && !hasCondition) ||
      (hasRuleSet && Boolean(comboPartType && comboPartId)) ||
      (hasCondition &&
        conditionLabel.trim() !== "" &&
        conditionValue !== ""));

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    onConfirm({
      mainPartType: partType,
      mainPartId: partId,
      value: isBan ? false : rowValue,
      hasCombo: !isBan && hasRuleSet,
      comboPartType: !isBan && hasRuleSet ? comboPartType : undefined,
      comboPartId: !isBan && hasRuleSet ? comboPartId : undefined,
      hasCondition: !isBan && hasCondition,
      conditionLabel: !isBan && hasCondition ? conditionLabel.trim() : undefined,
      conditionValue: !isBan && hasCondition ? conditionValue : undefined,
    });
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

        <h2 className={classes_names["title"]}>{t("edit-part.add-title")}</h2>
        <span className={classes_names["value-badge"]}>
          {t("edit-part.value-label")}:{" "}
          {isBan ? t("edit-part.ban-badge") : rowValue}
        </span>

        {!lockedPartType && (
          <div className={classes_names["field"]}>
            <p className={classes_names["field-label"]}>
              {t("edit-part.part-type-label")}
            </p>
            <div className={classes_names["part-type-toggle"]}>
              {rulesEditor.ALL_PART_TYPES.map((type) => (
                <div
                  key={`part-type-${type}`}
                  className={`${classes_names["part-type-option"]} ${
                    partType === type ? classes_names["active"] : ""
                  }`}
                  onClick={() => {
                    setPartType(type);
                    setPartId(undefined);
                  }}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={classes_names["field"]}>
          <p className={classes_names["field-label"]}>
            {t("edit-part.part-label")}
          </p>
          <PartSearchSelect
            partType={partType}
            selectedId={partId}
            valuesSet={valuesSet}
            onSelect={setPartId}
          />
        </div>

        <label className={classes_names["checkbox-row"]}>
          <input
            type="checkbox"
            checked={isBan}
            onChange={(event) => {
              setIsBan(event.target.checked);
              if (event.target.checked) {
                setHasRuleSet(false);
                setHasCondition(false);
              }
            }}
          />
          <span>{t("edit-part.ban-checkbox")}</span>
        </label>

        {!isBan && (
          <label className={classes_names["checkbox-row"]}>
            <input
              type="checkbox"
              checked={hasRuleSet}
              onChange={(event) => {
                setHasRuleSet(event.target.checked);
                if (event.target.checked) setHasCondition(false);
              }}
            />
            <span>{t("edit-part.rule-set-checkbox")}</span>
          </label>
        )}

        {!isBan && (
          <label className={classes_names["checkbox-row"]}>
            <input
              type="checkbox"
              checked={hasCondition}
              onChange={(event) => {
                setHasCondition(event.target.checked);
                if (event.target.checked) setHasRuleSet(false);
              }}
            />
            <span>{t("edit-part.condition-checkbox")}</span>
          </label>
        )}

        {!isBan && hasRuleSet && (
          <div className={classes_names["combo-form"]}>
            <p className={classes_names["combo-hint"]}>
              {t("edit-part.combo-hint", { value: rowValue })}
            </p>

            <div className={classes_names["combo-row"]}>
              <div className={classes_names["field"]}>
                <p className={classes_names["field-label"]}>
                  {t("edit-part.combo-type-label")}
                </p>
                <div className={classes_names["part-type-toggle"]}>
                  {comboPartnerTypes.map((type) => (
                    <div
                      key={`combo-type-${type}`}
                      className={`${classes_names["part-type-option"]} ${
                        comboPartType === type ? classes_names["active"] : ""
                      }`}
                      onClick={() => {
                        setComboPartType(type);
                        setComboPartId(undefined);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {comboPartType && (
              <div className={classes_names["field"]}>
                <p className={classes_names["field-label"]}>
                  {t("edit-part.combo-part-label")}
                </p>
                <PartSearchSelect
                  partType={comboPartType}
                  selectedId={comboPartId}
                  valuesSet={{}}
                  onSelect={setComboPartId}
                />
              </div>
            )}
          </div>
        )}

        {!isBan && hasCondition && (
          <div className={classes_names["condition-form"]}>
            <div className={classes_names["field"]}>
              <p className={classes_names["field-label"]}>
                {t("edit-part.condition-label-label")}
              </p>
              <input
                type="text"
                value={conditionLabel}
                placeholder={t("edit-part.condition-label-placeholder")}
                onChange={(event) => setConditionLabel(event.target.value)}
              />
            </div>

            <div className={classes_names["field"]}>
              <p className={classes_names["field-label"]}>
                {t("edit-part.condition-value-label")}
              </p>
              <input
                type="number"
                value={conditionValue}
                onChange={(event) => setConditionValue(event.target.value)}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className={classes_names["submit-btn"]}
          disabled={!canSubmit}
        >
          <ion-icon name="save-outline"></ion-icon>
          {t("edit-part.submit-button")}
        </button>
      </form>
    </div>
  );
};

export default EditPartValueModal;
