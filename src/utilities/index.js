export function globalizeString(str, separator = "-") {
  return str.trim().toLowerCase().replace(/\s+/g, separator);
}
export function replaceAtIndex(array, index, newObject) {
  if (index < 0 || index >= array.length) {
    throw new RangeError(
      `Index ${index} is out of bounds for array of length ${array.length}`,
    );
  }

  const newArray = [...array];
  newArray[index] = newObject;
  return newArray;
}

export function normalizeString(str, separator = "-", newSeparator = " ") {
  if (typeof str !== "string" || str.length === 0) return "";

  // Escape separator in case it's a regex special character
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    str
      .trim()
      // collapse multiple consecutive separators into one
      .replace(new RegExp(`(${escapedSeparator})+`, "g"), separator)
      // replace separator with the new separator
      .split(separator)
      .filter(Boolean)
      .join(newSeparator)
      .trim()
  );
}
