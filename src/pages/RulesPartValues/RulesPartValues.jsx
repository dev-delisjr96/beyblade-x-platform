import React from "react";

// Router
import { useParams } from "react-router-dom";

// Data
import PARTS from "../../data/index";

// Rules
import * as saved_rules from "../../modules/rules/index";

// Utilities
import * as beyXUtilities from "../../modules/utilities";

// Styles
import styles from "./RulesPartValues.module.scss";
import { generateClassesNames } from "styles/utilities";

/* eslint-disable-next-line no-unused-vars */
const RulesPartValues = ({ additionalstyles, ...props }) => {
  const elements = ["values-page", "part", "parts-list"];
  const classes_names = generateClassesNames(
    elements,
    styles,
    additionalstyles,
  );

  const { rule_name } = useParams();

  const rules_parts_values =
    saved_rules.RULE_SETS_STORED[rule_name].deck.values;
  console.log(rules_parts_values);

  return (
    <div className={classes_names["values-page"]}>
      {Object.entries(rules_parts_values).map(function ([partType, parts]) {
        return (
          <div
            className={classes_names["part-row"]}
            key={`value-row-${rule_name}-${partType}`}
          >
            <p>{partType}</p>
            <div className={classes_names["parts-list"]}>
              {parts.map((pt) => {
                const partInfo = beyXUtilities.findPartData(partType, pt.name);

                return (
                  <div
                    className={classes_names["part"]}
                    key={`part-card-${partType}-${partInfo.id}`}
                  >
                    <img src={partInfo.img} alt="" />
                    <p>{partInfo.name}</p>
                    {/* <p>{pt.value}</p> */}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RulesPartValues;
