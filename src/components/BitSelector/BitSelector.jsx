import React from 'react';

// Styles
import styles from './BitSelector.module.scss';
import { generateClassesNames } from 'styles/utilities';

/* eslint-disable-next-line no-unused-vars */
const BitSelector = ({ additionalstyles, ...props }) => {
  const elements = ['root'];
  const classes_names = generateClassesNames(elements, styles, additionalstyles);

  return (
    <div className={classes_names['root']}>
      {/* BitSelector */}
    </div>
  );
};

export default BitSelector;
