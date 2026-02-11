/**
 * IPC channel name constants shared between main and renderer processes.
 */
export const IpcChannels = {
  // Capture
  CAPTURE_START: 'capture:start',
  CAPTURE_STOP: 'capture:stop',
  CAPTURE_SCREENSHOT: 'capture:screenshot',
  CAPTURE_DOM: 'capture:dom',
  CAPTURE_PROGRESS: 'capture:progress',
  CAPTURE_ERROR: 'capture:error',

  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // App
  APP_VERSION: 'app:version',
  APP_QUIT: 'app:quit',

  // Updates
  CHECK_FOR_UPDATES: 'updates:check',
  UPDATE_AVAILABLE: 'updates:available',
  UPDATE_DOWNLOADED: 'updates:downloaded',
  UPDATE_PROGRESS: 'updates:progress',
  UPDATE_ERROR: 'updates:error',
  UPDATE_INSTALL: 'updates:install',
} as const;

export type IpcChannel = typeof IpcChannels[keyof typeof IpcChannels];
