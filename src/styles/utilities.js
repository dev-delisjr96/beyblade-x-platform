/**
 * Merges component-local and parent-injected CSS Module class names.
 *
 * For each element name, looks up the class in `styles` (the component's own
 * .module.scss) and optionally in `additionalStyles` (injected by a parent).
 * Both halves are trimmed and joined with a space; undefined/missing keys
 * produce an empty string — never the literal string "undefined".
 *
 * @param {string[]} elementsNames   - CSS class keys to resolve
 * @param {Object}   styles          - CSS Modules object from the component's own .module.scss
 * @param {Object}   [additionalStyles] - Optional CSS Modules object injected by a parent
 * @returns {Record<string, string>}
 */
function generateClassesNames(elementsNames, styles, additionalStyles) {
  const result = {};

  elementsNames.forEach((name) => {
    const base  = styles?.[name]           ?? "";
    const extra = additionalStyles?.[name] ?? "";
    // Filter out empty strings before joining so there's no leading/trailing space
    result[name] = [base, extra].filter(Boolean).join(" ");
  });

  return result;
}

export { generateClassesNames };
