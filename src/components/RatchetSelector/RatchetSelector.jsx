import React from 'react';

// Styles
import styles from './RatchetSelector.module.scss';
import { generateClassesNames } from 'styles/utilities';

/* eslint-disable-next-line no-unused-vars */
const RatchetSelector = ({ additionalstyles, ...props }) => {
  const elements = ['root'];
  const classes_names = generateClassesNames(elements, styles, additionalstyles);

  return (
    <div className={classes_names['root']}>
      {/* RatchetSelector */}
    </div>
  );
};

export default RatchetSelector;
