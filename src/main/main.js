// src/main/main.js
const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const keytar = require('keytar'); // Asumiendo que ya lo tienes instalado

const KEYTAR_SERVICE = 'com.tu-dominio.gestorcontrasenaseguro'; // Reemplaza con tu appId real
const KEYTAR_ACCOUNT = 'masterPassword';

const isDev = process.env.ELECTRON_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 850,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(app.getAppPath(), 'build', 'icon.png')
  });

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
    console.error('Fallo al copiar texto al portapapeles:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-vault-dialog', async () => {
  try {
    console.log("[main.js] Abriendo diálogo showSaveDialog...");
    const result = await dialog.showSaveDialog({
      title: 'Guardar nueva bóveda de contraseñas',
      defaultPath: path.join(app.getPath('documents'), 'mi_boveda.json'),
      filters: [
        { name: 'Archivos de Bóveda Segura', extensions: ['json'] }
      ]
    });
    
    console.log("[main.js] Resultado de showSaveDialog:", result);

    if (!result) {
        console.error("[main.js] showSaveDialog devolvió un resultado inesperado (null/undefined).");
        return { canceled: true, filePath: null, error: "Resultado inesperado del diálogo." };
    }

    if (result.canceled || !result.filePath) {
      console.log("[main.js] Diálogo cancelado o sin ruta seleccionada.");
      return { canceled: true, filePath: null };
    }
    console.log("[main.js] Ruta seleccionada para guardar:", result.filePath);
    return { canceled: false, filePath: result.filePath };

  } catch (error) {
    console.error("[main.js] Error DENTRO de show-save-vault-dialog IPC handler:", error);
    return { canceled: true, filePath: null, error: error.message }; 
  }
});

ipcMain.handle('show-open-vault-dialog', async () => {
  try {
    console.log("[main.js] Abriendo diálogo showOpenDialog...");
    const result = await dialog.showOpenDialog({
      title: 'Abrir bóveda de contraseñas existente',
      filters: [
        { name: 'Archivos de Bóveda Segura', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    console.log("[main.js] Resultado de showOpenDialog:", result);

    if (!result) {
        console.error("[main.js] showOpenDialog devolvió un resultado inesperado (null/undefined).");
        return { canceled: true, filePath: null, error: "Resultado inesperado del diálogo." };
    }

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      console.log("[main.js] Diálogo de abrir cancelado o sin ruta seleccionada.");
      return { canceled: true, filePath: null };
    }
    const filePath = result.filePaths[0];
    console.log("[main.js] Ruta seleccionada para abrir:", filePath);
    return { canceled: false, filePath: filePath };
  } catch (error) {
    console.error("[main.js] Error DENTRO de show-open-vault-dialog IPC handler:", error);
    return { canceled: true, filePath: null, error: error.message };
  }
});

ipcMain.handle('read-vault-file', async (event, filePath) => {
  try {
    console.log(`[main.js] Intentando leer archivo: ${filePath}`);
    const data = await fs.readFile(filePath, 'utf-8');
    console.log(`[main.js] Archivo leído con éxito: ${filePath}`);
    return { success: true, data };
  } catch (error) {
    console.error(`[main.js] Error al leer el archivo de la bóveda: ${filePath}`, error);
    return { success: false, error: error.message, code: error.code };
  }
});

ipcMain.handle('write-vault-file', async (event, filePath, data) => {
  try {
    console.log(`[main.js] Intentando escribir archivo: ${filePath}`);
    await fs.writeFile(filePath, data, 'utf-8');
    console.log(`[main.js] Archivo escrito con éxito: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`[main.js] Error al escribir en el archivo de la bóveda: ${filePath}`, error);
    return { success: false, error: error.message, code: error.code };
  }
});

ipcMain.handle('keytar-set-master-password', async (event, password) => {
  try {
    await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, password);
    console.log('[main.js keytar] Contraseña maestra guardada en el llavero.');
    return { success: true };
  } catch (error) {
    console.error('[main.js keytar] Error al guardar contraseña maestra en el llavero:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('keytar-get-master-password', async () => {
  try {
    const password = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    if (password !== null) {
      console.log('[main.js keytar] Contraseña maestra obtenida del llavero.');
      return { success: true, password };
    } else {
      console.log('[main.js keytar] No se encontró contraseña maestra en el llavero.');
      return { success: true, password: null };
    }
  } catch (error) {
    console.error('[main.js keytar] Error al obtener contraseña maestra del llavero:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('keytar-delete-master-password', async () => {
  try {
    const deleted = await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    if (deleted) {
      console.log('[main.js keytar] Contraseña maestra eliminada del llavero.');
    } else {
      console.log('[main.js keytar] No se encontró contraseña maestra para eliminar o fallo al eliminar.');
    }
    return { success: deleted };
  } catch (error) {
    console.error('[main.js keytar] Error al eliminar contraseña maestra del llavero:', error);
    return { success: false, error: error.message };
  }
});