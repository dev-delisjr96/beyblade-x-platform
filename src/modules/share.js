import { domToBlob } from "modern-screenshot";

/**
 * Client-side "save a screenshot" helpers — pure browser-side rendering,
 * no backend involved (see DeckSummaryModal for why: Firebase
 * Storage/Functions both require the paid Blaze plan now).
 *
 * Uses `modern-screenshot` rather than `html-to-image`: both work by
 * cloning the DOM and re-serializing it into an SVG `<foreignObject>`, but
 * `html-to-image` doesn't traverse Shadow DOM — and this app's icons are
 * `<ion-icon>` web components that render their actual glyph inside a
 * shadow root, which reliably made html-to-image hang. modern-screenshot
 * tracks shadow roots explicitly and has a real built-in timeout instead
 * of hanging indefinitely.
 *
 * Part images are served from our own `public/parts/` folder (see
 * scripts/logic/download-part-images.cjs) rather than a third-party CDN,
 * so they're same-origin — no CORS fetching needed to draw them.
 */

/**
 * Rasterizes a DOM node into a PNG Blob.
 *
 * `font: false` skips embedding @font-face declarations — we don't need
 * pixel-perfect custom fonts in a raster screenshot, and skipping it
 * avoids another whole class of cross-origin-stylesheet slowdowns.
 */
export async function captureElementAsPng(element, options = {}) {
  if (!element) throw new Error("captureElementAsPng: no element given");

  const blob = await domToBlob(element, {
    scale: 2,
    font: false,
    timeout: 15000,
    ...options,
  });

  if (!blob) throw new Error("captureElementAsPng: failed to render image");
  return blob;
}

/**
 * Renders a node the way it would look on desktop — regardless of the
 * device's actual viewport — by cloning it into an off-screen wrapper at a
 * fixed desktop width, then rasterizing that clone. Useful for elements
 * whose layout changes at mobile breakpoints (e.g. a 3-column summary that
 * collapses to 1 column on small screens): the saved image should always
 * look like the desktop version, even when saved from a phone.
 *
 * @param {HTMLElement} element - the node to capture
 * @param {Object} [options]
 * @param {number} [options.desktopWidth] - the width to force, in px
 * @param {(clone: HTMLElement) => void} [options.beforeCapture] - runs on
 *   the offscreen clone right before it's captured, so callers can force
 *   any layout overrides a CSS media query would otherwise undo (e.g.
 *   setting `gridTemplateColumns` back to the desktop value)
 */
export async function captureElementAsDesktopPng(element, options = {}) {
  if (!element) throw new Error("captureElementAsDesktopPng: no element given");

  const { desktopWidth = 780, beforeCapture, ...captureOptions } = options;

  const clone = element.cloneNode(true);
  const offscreenWrapper = document.createElement("div");
  offscreenWrapper.style.position = "fixed";
  offscreenWrapper.style.top = "0";
  offscreenWrapper.style.left = "-99999px";
  offscreenWrapper.style.width = `${desktopWidth}px`;
  offscreenWrapper.style.pointerEvents = "none";
  offscreenWrapper.appendChild(clone);

  // Insert as a SIBLING of `element`, not a child of document.body.
  // CSS custom properties / theme classes are usually set on some
  // ancestor between `element` and <body> (a theme wrapper, app root,
  // etc). Appending straight to document.body drops that ancestor
  // chain, so every var(--...) the clone relies on resolves to nothing
  // — which is exactly the "everything renders black" bug. Staying in
  // the real tree (just pulled out of flow via position:fixed) keeps
  // the clone inheriting the same computed styles as the original.
  element.parentNode.insertBefore(offscreenWrapper, element.nextSibling);

  try {
    beforeCapture?.(clone);

    return await captureElementAsPng(clone, {
      width: desktopWidth,
      ...captureOptions,
    });
  } finally {
    offscreenWrapper.remove();
  }
}

/** Triggers a browser download of a Blob. */
export function downloadBlob(blob, filename = "deck.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
