/**
 * Wraps the shared DOM serializer from @capturebliss/common for use in
 * the Electron capture BrowserView context.
 *
 * In the Chrome extension, doc.ts runs as an injected content script.
 * In Electron, we inject it via the capture-preload script which exposes
 * the serialization function on window.__capturebliss_serialize.
 *
 * The actual serialization logic lives in:
 *   - @capturebliss/common/src/capture/dom-serializer.ts  (shared types & helpers)
 *   - ext-tour/src/doc.ts (original implementation, browser-dependent)
 *
 * The capture-preload script (capture-preload.ts) loads the serializer and
 * makes it available to the capture-manager via executeJavaScript().
 */

import { SerDoc } from '@capturebliss/common/dist/types';

export interface SerializerParams {
  frameId: string | null;
}

export interface SerializerResult {
  serDoc: SerDoc;
  screenshot?: string;
}

/**
 * Build the JavaScript code string that will be injected into the capture
 * BrowserView to perform DOM serialization. This wraps the getSearializedDom
 * function from doc.ts.
 */
export function buildSerializerScript(): string {
  // The capture-preload script has already exposed __capturebliss_serialize
  // on the window object. This script is called via executeJavaScript() and
  // simply invokes that function.
  return `
    (function() {
      if (typeof window.__capturebliss_serialize !== 'function') {
        throw new Error('Capturebliss serializer not loaded in capture context');
      }
      return window.__capturebliss_serialize();
    })()
  `;
}
