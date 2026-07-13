/**
 * Default template string for a new React UI component.
 *
 * TO USE AS STRING: replace {{filename}} manually.
 * TO USE IN CODE:   call generateReactJSXComponent(filename) instead.
 *
 * @constant {string}
 */
const UI_COMPONENT_DEFAULT_TEMPLATE = `import React from 'react';

// Styles
import styles from './{{filename}}.module.scss';
import { generateClassesNames } from 'styles/utilities';

/* eslint-disable-next-line no-unused-vars */
const {{filename}} = ({ additionalstyles, ...props }) => {
  const elements = ['root'];
  const classes_names = generateClassesNames(elements, styles, additionalstyles);

  return (
    <div className={classes_names['root']}>
      {/* {{filename}} */}
    </div>
  );
};

export default {{filename}};
`;

/**
 * Generates a React JSX functional component template as a string.
 *
 * @param {string} filename - PascalCase name of the component (without extension).
 * @returns {string}
 */
function generateReactJSXComponent(filename) {
  return `import React from 'react';

// Styles
import styles from './${filename}.module.scss';
import { generateClassesNames } from 'styles/utilities';

/* eslint-disable-next-line no-unused-vars */
const ${filename} = ({ additionalstyles, ...props }) => {
  const elements = ['root'];
  const classes_names = generateClassesNames(elements, styles, additionalstyles);

  return (
    <div className={classes_names['root']}>
      {/* ${filename} */}
    </div>
  );
};

export default ${filename};
`;
}

// Single export — fixes the silent overwrite bug where two separate
// `module.exports = {}` assignments caused the first one to be lost.
module.exports = { UI_COMPONENT_DEFAULT_TEMPLATE, generateReactJSXComponent };
