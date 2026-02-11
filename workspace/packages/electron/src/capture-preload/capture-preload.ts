import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../main/ipc/ipc-channels';

/**
 * Preload script injected into the capture BrowserView.
 *
 * This provides DOM serialization capabilities to the captured page.
 * The getSearializedDom function from doc.ts is designed to run in a
 * page context (accessing document, window, etc.). In Electron, this
 * preload script sets up the bridge so the main process can trigger
 * serialization via executeJavaScript().
 *
 * The actual serialization function is injected into the page world
 * via a content script approach - the capture-manager calls
 * executeJavaScript() which invokes window.__capturebliss_serialize.
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

/**
 * Inject the serializer function into the page context.
 * This runs in the isolated world but sets up a function that the
 * main process can call via webContents.executeJavaScript().
 *
 * NOTE: The actual getSearializedDom implementation from doc.ts is
 * self-contained (no external imports at runtime) and is designed
 * to be injected into page contexts. It accesses `document` and
 * `window` directly.
 *
 * The serializer code will be bundled and injected at build time
 * by electron-vite. For development, the capture-manager executes
 * the serializer via webContents.executeJavaScript() after the
 * page loads.
 */
