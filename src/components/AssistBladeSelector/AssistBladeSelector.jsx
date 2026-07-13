import React from 'react';

// Styles
import styles from './AssistBladeSelector.module.scss';
import { generateClassesNames } from 'styles/utilities';

/* eslint-disable-next-line no-unused-vars */
const AssistBladeSelector = ({ additionalstyles, ...props }) => {
  const elements = ['root'];
  const classes_names = generateClassesNames(elements, styles, additionalstyles);

  return (
    <div className={classes_names['root']}>
      {/* AssistBladeSelector */}
    </div>
  );
};

export default AssistBladeSelector;
