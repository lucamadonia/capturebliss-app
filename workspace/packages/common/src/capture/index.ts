/**
 * Shared capture types and utilities used by both the Chrome extension (ext-tour)
 * and the Electron desktop app.
 *
 * The DOM serialization logic (doc.ts) depends on browser APIs (document, window,
 * getComputedStyle, etc.) so it must run in a renderer/page context. This module
 * provides the shared types and platform-agnostic helpers.
 */

export type {
  SerDoc,
  SerNode,
  SerNodeWithPath,
  PostProcess,
  ProxyUrlMap,
  ProxyAttrs,
  AiDxDy,
} from '../types';

export { isSameOrigin } from '../utils';

export type { CaptureFrameInfo, CaptureResult, CaptureConfig } from './types';
