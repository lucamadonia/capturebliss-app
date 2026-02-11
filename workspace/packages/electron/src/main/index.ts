import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window-manager';
import { registerIpcHandlers } from './ipc/ipc-handlers';
import { initAutoUpdater } from './auto-updater';
import { createTray } from './tray';
import { createAppMenu } from './menu';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  createAppMenu();
  mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow);
  initAutoUpdater(mainWindow);
  createTray(mainWindow);

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      registerIpcHandlers(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
