import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../main/ipc/ipc-channels';

/**
 * Preload script injected into the capture BrowserView.
 *
 * DOM serialization architecture:
 * The getSearializedDom function (from ext-tour/src/doc.ts) needs to run in
 * the page's world to access document, getComputedStyle(), etc. directly.
 *
 * The serializer code is injected into the page world by capture-manager.ts
 * via webContents.executeJavaScript() after the page loads. This defines
 * window.__capturebliss_serialize in the page context.
 *
 * This preload only provides a minimal IPC bridge for the capture context
 * to send data back to the main process if needed (e.g., for streaming
 * serialized data or screenshots).
 */

// Expose a minimal IPC bridge for the capture context
contextBridge.exposeInMainWorld('__capturebliss_ipc', {
  sendSerializedDom: (data: unknown) => {
    ipcRenderer.send(IpcChannels.CAPTURE_DOM, data);
  },
  sendScreenshot: (data: string) => {
    ipcRenderer.send(IpcChannels.CAPTURE_SCREENSHOT, data);
  },
});
