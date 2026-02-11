export function captureVisibleTab(): Promise<string> {
  return chrome.tabs.captureVisibleTab({
    format: "png",
  });
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (tabs && tabs.length >= 1) {
    return tabs[0];
  }

  return null;
}

export const PURIFY_DOM_SERIALIZATION = "capturebliss-purify-dom-serialization";
export const AGGRESSIVE_BUFFER_PRESERVATION = "capturebliss-aggressibe-buffer-preservation";

export enum SettingState {
  ON = "On",
  OFF = "Off"
}
