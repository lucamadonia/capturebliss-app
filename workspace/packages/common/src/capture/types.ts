import { SerDoc, ThemeStats, InteractionCtx } from '../types';

/**
 * Information about a frame being captured.
 * Used by both Chrome extension and Electron capture flows.
 */
export interface CaptureFrameInfo {
  frameId: number;
  url: string;
  isCrossOrigin: boolean;
}

/**
 * Result of a single frame's DOM capture.
 */
export interface CaptureResult {
  frameId: number;
  tabId: number;
  type: 'serdom' | 'thumbnail' | 'sigstop' | 'sigskip';
  data: SerDoc | string;
  interactionCtx: InteractionCtx | null;
}

/**
 * Configuration for a capture session.
 */
export interface CaptureConfig {
  /** URL to capture */
  url: string;
  /** Viewport width */
  viewportWidth?: number;
  /** Viewport height */
  viewportHeight?: number;
  /** Whether to capture screenshots alongside DOM */
  captureScreenshots?: boolean;
}
