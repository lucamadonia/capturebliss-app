import { BrowserView, BrowserWindow } from 'electron';
import { SerDoc } from '@capturebliss/common/dist/types';
import { createCaptureWindow } from '../window-manager';
import { IpcChannels } from '../ipc/ipc-channels';

/**
 * CaptureManager orchestrates DOM capture using BrowserView and webContents API.
 *
 * This is the Electron equivalent of the Chrome extension's background.ts capture flow:
 * - chrome.scripting.executeScript()  -> webContents.executeJavaScript()
 * - chrome.tabs.captureVisibleTab()   -> webContents.capturePage()
 * - chrome.webNavigation.getAllFrames() -> webContents.mainFrame.framesInSubtree
 */
export class CaptureManager {
  private captureView: BrowserView | null = null;
  private parentWindow: BrowserWindow;

  constructor(parentWindow: BrowserWindow) {
    this.parentWindow = parentWindow;
  }

  /**
   * Start capturing a target URL by loading it in a BrowserView.
   */
  async startCapture(url: string): Promise<void> {
    if (this.captureView) {
      this.stopCapture();
    }

    this.captureView = createCaptureWindow(url, this.parentWindow);

    // Wait for page to finish loading
    await new Promise<void>((resolve, reject) => {
      const wc = this.captureView!.webContents;
      wc.once('did-finish-load', () => resolve());
      wc.once('did-fail-load', (_event, errorCode, errorDescription) => {
        reject(new Error(`Failed to load ${url}: ${errorDescription} (${errorCode})`));
      });
    });

    this.parentWindow.webContents.send(IpcChannels.CAPTURE_PROGRESS, {
      status: 'loaded',
      url,
    });
  }

  /**
   * Capture a screenshot of the current BrowserView.
   * Equivalent to chrome.tabs.captureVisibleTab().
   */
  async captureScreenshot(): Promise<string> {
    if (!this.captureView) {
      throw new Error('No active capture session');
    }

    const image = await this.captureView.webContents.capturePage();
    return image.toDataURL();
  }

  /**
   * Serialize the DOM of the capture BrowserView by executing the serializer
   * in the page context. Equivalent to chrome.scripting.executeScript() with doc.ts.
   */
  async captureDOM(frameId: string | null): Promise<SerDoc> {
    if (!this.captureView) {
      throw new Error('No active capture session');
    }

    // Execute the serializer function in the capture BrowserView's renderer
    const serializedDom = await this.captureView.webContents.executeJavaScript(
      `window.__capturebliss_serialize(${JSON.stringify({ frameId })})`
    );

    return serializedDom as SerDoc;
  }

  /**
   * Get all frames in the capture BrowserView.
   * Equivalent to chrome.webNavigation.getAllFrames().
   */
  getFrames(): Electron.WebFrameMain[] {
    if (!this.captureView) {
      return [];
    }
    return Array.from(this.captureView.webContents.mainFrame.framesInSubtree);
  }

  /**
   * Stop the current capture session and clean up the BrowserView.
   */
  stopCapture(): void {
    if (this.captureView) {
      this.parentWindow.removeBrowserView(this.captureView);
      (this.captureView.webContents as any).destroy?.();
      this.captureView = null;
    }
  }

  isCapturing(): boolean {
    return this.captureView !== null;
  }
}
