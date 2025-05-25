// main.js
const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');

function createWindow() {
  // Crea la ventana del navegador.
  const mainWindow = new BrowserWindow({
    width: 850, // Ancho ajustado para la app
    height: 700, // Alto ajustado para la app
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Carga el script de precarga
      contextIsolation: true, // Recomendado por seguridad
      nodeIntegration: false // Deshabilitado por seguridad, usar preload para APIs de Node
    },
    icon: path.join(__dirname, 'build', 'icon.png') // Icono para la ventana
  });

  // Carga gestor_contrasenas.html de la aplicación.
  mainWindow.loadFile('gestor_contrasenas.html');

  // Abre las herramientas de desarrollo (opcional, para depuración).
  // mainWindow.webContents.openDevTools();

  // Quitar el menú por defecto de Electron
  mainWindow.setMenu(null);
}

// Este método se llamará cuando Electron haya finalizado
// la inicialización y esté listo para crear ventanas de navegador.
// Algunas APIs solo pueden usarse después de que ocurra este evento.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // En macOS es común recrear una ventana en la aplicación cuando el
    // icono del dock es presionado y no hay otras ventanas abiertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Sal cuando todas las ventanas hayan sido cerradas, excepto en macOS.
// En macOS es común para las aplicaciones y sus barras de menú
// permanecer activas hasta que el usuario salga explícitamente con Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// En este archivo puedes incluir el resto del código del proceso principal específico de tu aplicación.
// También puedes ponerlos en archivos separados y requerirlos aquí.

// IPC para copiar al portapapeles desde el proceso de renderizado
ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    return { success: false, error: error.message };
  }
});
