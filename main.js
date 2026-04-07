const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "Antigravity Video Editor",
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // We'll add a simple preload
    }
  });

  win.loadFile('index.html');
  
  // Manage External Window
  let extWin = null;

  ipcMain.on('open-external-window', () => {
    if (extWin) {
      extWin.focus();
      return;
    }

    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find((display) => {
      return display.bounds.x !== 0 || display.bounds.y !== 0;
    }) || displays[0]; // Fallback to primary

    extWin = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      fullscreen: true,
      autoHideMenuBar: true,
      backgroundColor: '#000',
      webPreferences: {
        nodeIntegration: true, // Internal preview window
        contextIsolation: false
      }
    });

    extWin.loadFile('external.html');
    extWin.on('closed', () => {
      extWin = null;
      if (win && !win.isDestroyed()) {
        win.webContents.send('external-window-closed');
      }
    });
  });

  ipcMain.on('close-external-window', () => {
    if (extWin) extWin.close();
  });

  ipcMain.on('render-frame', (event, dataUrl) => {
    if (extWin && !extWin.isDestroyed()) {
      extWin.webContents.send('render-frame', dataUrl);
    }
  });

  // win.on('closed', () => { if (extWin) extWin.close(); });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
