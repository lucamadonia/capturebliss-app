import { autoUpdater, UpdateInfo } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { IpcChannels } from './ipc/ipc-channels';

let mainWindow: BrowserWindow | null = null;

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    mainWindow?.webContents.send(IpcChannels.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send(IpcChannels.UPDATE_PROGRESS, {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    mainWindow?.webContents.send(IpcChannels.UPDATE_DOWNLOADED, {
      version: info.version,
    });

    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Restart now to apply the update?`,
        buttons: ['Restart', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', (error) => {
    mainWindow?.webContents.send(IpcChannels.UPDATE_ERROR, {
      message: error.message,
    });
  });

  // Check for updates on startup
  autoUpdater.checkForUpdates().catch(() => {
    // Silently fail on startup check - user can manually check later
  });
}

export async function checkForUpdates(): Promise<{ updateAvailable: boolean }> {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { updateAvailable: result?.updateInfo != null };
  } catch {
    return { updateAvailable: false };
  }
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
