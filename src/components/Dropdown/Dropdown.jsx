import React, { useState, useEffect } from "react";

// Translations
import { useTranslation } from "react-i18next";

// Styles
import styles from "./Dropdown.module.scss";
import { generateClassesNames } from "styles/utilities";

/* million-ignore */
const Dropdown = ({
  id,
  additionalstyles,
  actualValue = undefined,
  options = [],
  onChange = {
    function(newValue) {
      console.log("changing to", newValue);
      return newValue;
    },
  },
  /* eslint-disable-next-line no-unused-vars */
  ...props
}) => {
  const elements = [
    "dropdown",
    "expanded",
    "shrinked",
    "actual-value",
    "value",
    "placeholder",
    "options-container",
    "option",
  ];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { t } = useTranslation("inputs");

  const [isDropped, setIsDropped] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(
    options.filter((opt) => opt.value !== actualValue.value),
  );

  useEffect(() => {
    if (options.length > 0) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFilteredOptions(
        options.filter((opt) => opt.value !== actualValue.value),
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [options]);

  function drop() {
    setIsDropped(!isDropped);
  }

  function select(option) {
    onChange(option);
    setFilteredOptions(options.filter((opt) => opt.value !== option.value));
    setIsDropped(false);
  }

  return (
    <div
      className={`${classes_names["dropdown"]} ${classes_names[isDropped ? "expanded" : "shrinked"]}`}
    >
      <div className={classes_names["actual-value"]} onClick={drop}>
        <p className={classes_names[actualValue ? "value" : "placeholder"]}>
          {actualValue.text || t("dropdown.actual_value.placeholder")}
        </p>
        <ion-icon
          name={`chevron-${isDropped ? "up" : "down"}-circle-outline`}
        ></ion-icon>
      </div>
      {isDropped && (
        <div className={classes_names["options-container"]}>
          {filteredOptions.length === 0 ? (
            <div
              className={classes_names["option"]}
              style={{ backgroundColor: "#eeeeee" }}
            >
              <p className={classes_names["value"]}>
                {t("dropdown.options.no-options")}
              </p>
            </div>
          ) : (
            filteredOptions.map((opt) => {
              return (
                <div
                  className={classes_names["option"]}
                  key={`${id || "dropdown"}-option-${opt.text}`}
                  onClick={() => select(opt)}
                >
                  {opt.text}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
