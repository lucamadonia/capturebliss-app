import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../main/ipc/ipc-channels';

/**
 * Secure IPC bridge exposed to the renderer process via contextBridge.
 * This is the only way the renderer can communicate with the main process.
 *
 * Accessible as window.capturebliss in the renderer.
 */
contextBridge.exposeInMainWorld('capturebliss', {
  capture: {
    start: (url: string) => ipcRenderer.invoke(IpcChannels.CAPTURE_START, url),
    stop: () => ipcRenderer.invoke(IpcChannels.CAPTURE_STOP),
    screenshot: () => ipcRenderer.invoke(IpcChannels.CAPTURE_SCREENSHOT),
    dom: (frameId: string | null) => ipcRenderer.invoke(IpcChannels.CAPTURE_DOM, frameId),
    onProgress: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.CAPTURE_PROGRESS, listener);
      return () => ipcRenderer.removeListener(IpcChannels.CAPTURE_PROGRESS, listener);
    },
    onError: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.CAPTURE_ERROR, listener);
      return () => ipcRenderer.removeListener(IpcChannels.CAPTURE_ERROR, listener);
    },
  },

  window: {
    minimize: () => ipcRenderer.send(IpcChannels.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IpcChannels.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IpcChannels.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IpcChannels.WINDOW_IS_MAXIMIZED),
  },

  app: {
    getVersion: () => ipcRenderer.invoke(IpcChannels.APP_VERSION),
    quit: () => ipcRenderer.send(IpcChannels.APP_QUIT),
  },

  updates: {
    check: () => ipcRenderer.invoke(IpcChannels.CHECK_FOR_UPDATES),
    install: () => ipcRenderer.send(IpcChannels.UPDATE_INSTALL),
    onAvailable: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.UPDATE_AVAILABLE, listener);
      return () => ipcRenderer.removeListener(IpcChannels.UPDATE_AVAILABLE, listener);
    },
    onDownloaded: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.UPDATE_DOWNLOADED, listener);
      return () => ipcRenderer.removeListener(IpcChannels.UPDATE_DOWNLOADED, listener);
    },
    onProgress: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.UPDATE_PROGRESS, listener);
      return () => ipcRenderer.removeListener(IpcChannels.UPDATE_PROGRESS, listener);
    },
    onError: (callback: (data: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(IpcChannels.UPDATE_ERROR, listener);
      return () => ipcRenderer.removeListener(IpcChannels.UPDATE_ERROR, listener);
    },
  },
});
