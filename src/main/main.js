// src/main/main.js
const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');

// Detectar si estamos en desarrollo o producción
// Puedes usar una variable de entorno o un paquete como electron-is-dev
const isDev = process.env.ELECTRON_ENV === 'development' || !app.isPackaged;


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 850,
    height: 700,
    webPreferences: {
      // MODIFICADO: La ruta a preload.js ahora es relativa a __dirname (src/main)
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // MODIFICADO: Ruta al ícono, asumiendo que 'build' está en la raíz del proyecto
    icon: path.join(app.getAppPath(), 'build', 'icon.png')
  });

  // Carga el index.html generado por Webpack
  // La ruta es relativa a la raíz de la aplicación empaquetada o al directorio del proyecto
  const indexPath = path.join(app.getAppPath(), 'dist_react', 'index.html');
  mainWindow.loadFile(indexPath);


  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return { success: false, error: error.message };
  }
});