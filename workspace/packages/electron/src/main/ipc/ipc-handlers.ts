import { ipcMain, BrowserWindow, app } from 'electron';
import { IpcChannels } from './ipc-channels';
import { CaptureManager } from '../capture/capture-manager';
import { checkForUpdates, installUpdate } from '../auto-updater';

/**
 * Register all IPC handlers for communication between main and renderer processes.
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const captureManager = new CaptureManager(mainWindow);

  // -- Capture handlers --

  ipcMain.handle(IpcChannels.CAPTURE_START, async (_event, url: string) => {
    try {
      await captureManager.startCapture(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannels.CAPTURE_STOP, async () => {
    captureManager.stopCapture();
    return { success: true };
  });

  ipcMain.handle(IpcChannels.CAPTURE_SCREENSHOT, async () => {
    try {
      const dataUrl = await captureManager.captureScreenshot();
      return { success: true, data: dataUrl };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IpcChannels.CAPTURE_DOM, async (_event, frameId: string | null) => {
    try {
      const serDoc = await captureManager.captureDOM(frameId);
      return { success: true, data: serDoc };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // -- Window handlers --

  ipcMain.on(IpcChannels.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IpcChannels.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IpcChannels.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  ipcMain.handle(IpcChannels.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow.isMaximized();
  });

  // -- App handlers --

  ipcMain.handle(IpcChannels.APP_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.on(IpcChannels.APP_QUIT, () => {
    app.quit();
  });

  // -- Update handlers --

  ipcMain.handle(IpcChannels.CHECK_FOR_UPDATES, async () => {
    return checkForUpdates();
  });

  ipcMain.on(IpcChannels.UPDATE_INSTALL, () => {
    installUpdate();
  });
}
