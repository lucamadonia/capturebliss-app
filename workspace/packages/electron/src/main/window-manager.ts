import { BrowserWindow, BrowserView, screen } from 'electron';
import path from 'path';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const WINDOW_STATE_KEY = 'capturebliss-window-state';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

function loadWindowState(): WindowState {
  try {
    const raw = global.localStorage?.getItem(WINDOW_STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall through to defaults
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, isMaximized: false };
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const bounds = win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized(),
    };
    global.localStorage?.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore save errors
  }
}

function ensureWindowOnScreen(state: WindowState): WindowState {
  const displays = screen.getAllDisplays();
  if (state.x !== undefined && state.y !== undefined) {
    const onScreen = displays.some((display) => {
      const { x, y, width, height } = display.bounds;
      return (
        state.x! >= x &&
        state.y! >= y &&
        state.x! < x + width &&
        state.y! < y + height
      );
    });
    if (!onScreen) {
      delete state.x;
      delete state.y;
    }
  }
  return state;
}

export function createMainWindow(): BrowserWindow {
  const state = ensureWindowOnScreen(loadWindowState());

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    title: 'Capturebliss',
  });

  if (state.isMaximized) {
    win.maximize();
  }

  // Show window when ready to avoid visual flash
  win.once('ready-to-show', () => {
    win.show();
  });

  // Persist window state on changes
  win.on('close', () => saveWindowState(win));
  win.on('resize', () => saveWindowState(win));
  win.on('move', () => saveWindowState(win));

  // Load the client app
  if (process.env.ELECTRON_DEV_URL) {
    win.loadURL(process.env.ELECTRON_DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', '..', 'client', 'index.html'));
  }

  return win;
}

export function createCaptureWindow(url: string, parentWindow: BrowserWindow): BrowserView {
  const view = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, '..', 'capture-preload', 'capture-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  parentWindow.addBrowserView(view);

  const { width, height } = parentWindow.getBounds();
  view.setBounds({ x: 0, y: 0, width, height });
  view.setAutoResize({ width: true, height: true });

  view.webContents.loadURL(url);

  return view;
}
