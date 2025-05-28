// src/renderer/components/MasterPasswordSetup.js
import React, { useState } from 'react';
import { deriveKey, encryptData, bufferToHex } from '../cryptoUtils.js'; 

function MasterPasswordSetup({ onSetupComplete, onShowError }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupAttempt = async () => {
    if (!newPassword || !confirmPassword) {
      onShowError('Por favor, completa ambos campos de contraseña.');
      return;
    }
    if (newPassword.length < 8) {
      onShowError('La contraseña maestra debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    onShowError(''); 

    try {
      if (!window.electronAPI || !window.electronAPI.showSaveVaultDialog || !window.electronAPI.writeVaultFile) {
        console.error("[MasterPasswordSetup] Las funciones de la API de Electron para archivos no están disponibles en window.electronAPI.");
        throw new Error("Las funciones de la API de Electron para archivos no están disponibles.");
      }
      
      console.log("[MasterPasswordSetup] Llamando a window.electronAPI.showSaveVaultDialog...");
      const dialogResult = await window.electronAPI.showSaveVaultDialog();
      console.log("[MasterPasswordSetup] Resultado del diálogo showSaveVaultDialog recibido:", dialogResult);

      if (!dialogResult) {
          console.error("[MasterPasswordSetup] dialogResult de showSaveVaultDialog es undefined o null!");
          throw new Error("El diálogo de guardado no devolvió un resultado válido.");
      }
      if (dialogResult.error) { // Si el main.js devolvió un error en el objeto
          console.error("[MasterPasswordSetup] Error desde showSaveVaultDialog en main.js:", dialogResult.error);
          throw new Error(`Error en el diálogo de guardado: ${dialogResult.error}`);
      }

      if (dialogResult.canceled || !dialogResult.filePath) {
        onShowError('Creación de bóveda cancelada: No se seleccionó una ruta de archivo.');
        setIsLoading(false);
        return;
      }
      
      const chosenFilePath = dialogResult.filePath;
      console.log("[MasterPasswordSetup] Ruta elegida:", chosenFilePath);

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(newPassword, salt); 
      const saltHex = bufferToHex(salt);
      console.log("[MasterPasswordSetup] Salt generado (hex):", saltHex);

      const initialPasswordsArray = [];
      const { ciphertext, iv } = await encryptData(key, JSON.stringify(initialPasswordsArray));
      console.log("[MasterPasswordSetup] Datos cifrados para la bóveda inicial.");

      const vaultDataToStoreInFile = {
        salt: saltHex,
        iv: bufferToHex(iv),
        ciphertext: bufferToHex(ciphertext)
      };

      console.log("[MasterPasswordSetup] Escribiendo bóveda en:", chosenFilePath);
      const writeResult = await window.electronAPI.writeVaultFile(chosenFilePath, JSON.stringify(vaultDataToStoreInFile));
      console.log("[MasterPasswordSetup] Resultado de writeVaultFile:", writeResult);

      if (!writeResult || !writeResult.success) {
        console.error("[MasterPasswordSetup] writeResult es undefined, null o no exitoso:", writeResult);
        throw new Error(`Fallo al guardar el archivo de la bóveda: ${writeResult ? writeResult.error : 'Respuesta inválida de writeVaultFile'}`);
      }

      console.log("[MasterPasswordSetup] Llamando a onSetupComplete.");
      onSetupComplete({ key: key, saltHex: saltHex }, initialPasswordsArray, chosenFilePath);

    } catch (error) {
      console.error("[MasterPasswordSetup] Error durante la configuración de la contraseña maestra:", error);
      onShowError(`Error al configurar la contraseña maestra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-center text-gray-100 mb-4">Configura tu Contraseña Maestra y Bóveda</h2>
      <p className="text-sm text-gray-400 mb-2 text-center">
        Primero, introduce y confirma tu contraseña maestra.
      </p>
      <p className="text-sm text-gray-400 mb-4 text-center">
        Luego se te pedirá que elijas dónde guardar el archivo seguro de tu bóveda.
      </p>
      <input
        type="password"
        id="new-master-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nueva Contraseña Maestra"
        className="w-full p-3 mb-3 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading}
      />
      <input
        type="password"
        id="confirm-master-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSetupAttempt()}
        placeholder="Confirma Contraseña Maestra"
        className="w-full p-3 mb-4 rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500 focus:ring-blue-500"
        disabled={isLoading}
      />
      <button
        id="set-master-password-btn"
        onClick={handleSetupAttempt}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md font-semibold transition-colors duration-150 ease-in-out disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Configurando...' : 'Siguiente: Elegir Ubicación y Crear Bóveda'}
      </button>
    </div>
  );
}

export default MasterPasswordSetup;