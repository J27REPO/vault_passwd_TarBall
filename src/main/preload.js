// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Funcionalidades existentes
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  showSaveVaultDialog: () => ipcRenderer.invoke('show-save-vault-dialog'),
  showOpenVaultDialog: () => ipcRenderer.invoke('show-open-vault-dialog'),
  readVaultFile: (filePath) => ipcRenderer.invoke('read-vault-file', filePath),
  writeVaultFile: (filePath, data) => ipcRenderer.invoke('write-vault-file', filePath, data),

  // NUEVAS FUNCIONALIDADES PARA KEYTAR (LLAvero)
  keytarSetMasterPassword: (password) => ipcRenderer.invoke('keytar-set-master-password', password),
  keytarGetMasterPassword: () => ipcRenderer.invoke('keytar-get-master-password'),
  keytarDeleteMasterPassword: () => ipcRenderer.invoke('keytar-delete-master-password'),
});